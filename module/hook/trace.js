/**
 * Hook trace module — lowers console.log/warn/error → trace API,
 * Date.now / performance.now → ledger_last_time.
 * Overrides the default console module emitters when host:'hook' is active.
 */
import { asI64, asI32 } from '../../src/ir.js'
import { valTypeOf, VAL } from '../../src/analyze.js'
import { emit } from '../../src/emit.js'

const EMPTY_LABEL_PTR = ['i32.const', 0]
const EMPTY_LABEL_LEN = ['i32.const', 0]

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
        // String / Buffer / generic → trace
        stmts.push(['drop', ['call', '$hook_trace',
          EMPTY_LABEL_PTR, EMPTY_LABEL_LEN,
          ['i32.wrap_i64', ['call', '$__ptr_offset', asI64(emitted)]],
          ['call', '$__len', asI64(emitted)],
          ['i32.const', 0]]])
      }
    }
    if (stmts.length === 0) return ['i32.const', 0]
    if (stmts.length === 1) return stmts[0]
    return [';', ...stmts]
  }

  ctx.core.emit['console.warn'] = ctx.core.emit['console.log']
  ctx.core.emit['console.error'] = ctx.core.emit['console.log']

  // Date.now / performance.now → ledger_last_time
  ctx.core.emit['Date.now'] = () => ['call', '$hook_ledger_last_time']
  ctx.core.emit['performance.now'] = () => ['call', '$hook_ledger_last_time']
}
