/**
 * Hook trace module — lowers console.log/warn/error → trace API,
 * Date.now / performance.now → ledger_last_time.
 * Overrides the default console module emitters when host:'hook' is active.
 */
import { typed, asI64, asI32, tempI64 } from '../../src/ir.js'
import { valTypeOf, VAL } from '../../src/analyze.js'
import { emit } from '../../src/emit.js'
import { ctx as globalCtx } from '../../src/ctx.js'

const EMPTY_LABEL_PTR = ['i32.const', 0]
const EMPTY_LABEL_LEN = ['i32.const', 0]

/**
 * Extract [ptr_ir, len_ir] from a NaN-boxed string/buffer value in hook mode.
 * Hook mode never uses SSO — low 32 bits of every NaN-box are a heap address.
 * For strings: len is at mem[ptr - 4].
 * Avoids calling $__ptr_offset / $__len which are JS-host stdlib functions.
 */
const hookStrPtrLen = (ir) => {
  // i64.const literal: extract ptr and len at compile time from static data
  if (Array.isArray(ir) && ir[0] === 'i64.const') {
    const bits = typeof ir[1] === 'bigint' ? ir[1] : BigInt(ir[1])
    const rawOffset = Number(bits & 0xFFFFFFFFn)
    // Read length from static data header at rawOffset - 4
    const data = globalCtx?.runtime?.data
    if (data && rawOffset >= 4 && rawOffset - 4 + 4 <= data.length) {
      const len = (data.charCodeAt(rawOffset - 4) | (data.charCodeAt(rawOffset - 3) << 8) |
                   (data.charCodeAt(rawOffset - 2) << 16) | (data.charCodeAt(rawOffset - 1) << 24)) >>> 0
      const staticDataLen = globalCtx?.runtime?.staticDataLen || 0
      const ptr = rawOffset - staticDataLen
      return [typed(['i32.const', ptr], 'i32'), typed(['i32.const', len], 'i32')]
    }
  }
  // local/global get: safe to use directly without a temp
  if (Array.isArray(ir) && (ir[0] === 'local.get' || ir[0] === 'global.get')) {
    return [
      typed(['i32.wrap_i64', ir], 'i32'),
      typed(['i32.load', ['i32.sub', ['i32.wrap_i64', ir], ['i32.const', 4]]], 'i32')
    ]
  }
  // General case: store in a temp i64 local to avoid double-evaluation
  const tmp = tempI64()
  return [
    typed(['i32.wrap_i64', typed(['local.tee', `$${tmp}`, ir], 'i64')], 'i32'),
    typed(['i32.load', ['i32.sub', ['i32.wrap_i64', typed(['local.get', `$${tmp}`], 'i64')], ['i32.const', 4]]], 'i32')
  ]
}

export default (ctx) => {
  // Override console.log → Hook trace_num (for numbers) or trace (for strings/buffers)
  ctx.core.emit['console.log'] = (...args) => {
    const stmts = []
    for (const arg of args) {
      const vt = valTypeOf(arg)
      const emitted = emit(arg)
      if (vt === 'f64' || vt === 'i32' || vt === 'i64' || vt === VAL.NUMBER) {
        // Number → trace_num
        stmts.push(['drop', ['call', '$hook_trace_num',
          EMPTY_LABEL_PTR, EMPTY_LABEL_LEN,
          asI64(emitted)]])
      } else {
        // String / Buffer / generic → trace (hook-native ptr/len extraction)
        const [ptrIr, lenIr] = hookStrPtrLen(asI64(emitted))
        stmts.push(['drop', ['call', '$hook_trace',
          EMPTY_LABEL_PTR, EMPTY_LABEL_LEN,
          ptrIr, lenIr,
          ['i32.const', 0]]])
      }
    }
    if (stmts.length === 0) return ['i32.const', 0]
    if (stmts.length === 1) return stmts[0]
    return [';', ...stmts]
  }

  ctx.core.emit['console.warn'] = ctx.core.emit['console.log']
  ctx.core.emit['console.error'] = ctx.core.emit['console.log']

  // Date.now / performance.now → ledger_last_time + 946684800 (Ripple→Unix epoch offset)
  ctx.core.emit['Date.now'] = () =>
    typed(['i64.add',
      typed(['call', '$hook_ledger_last_time'], 'i64'),
      ['i64.const', 946684800n]
    ], 'i64')
  ctx.core.emit['performance.now'] = ctx.core.emit['Date.now']
}
