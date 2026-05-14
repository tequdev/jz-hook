/**
 * Hook API bindings — maps `import { fn } from 'hook'` to env.* WASM imports.
 * Registers all Xahau Hook API WASM imports and emitter table entries.
 */
import { asI64, asI32, typed, temp } from '../../src/ir.js'
import { inc, ctx, LAYOUT, PTR } from '../../src/ctx.js'
import { emit } from '../../src/emit.js'

export const HOOK_SCRATCH_OFFSET = 512
export const HOOK_SCRATCH_SIZE = 512

export const addImportOnce = (ctx, mod, name, fn) => {
  if (ctx.module.imports.some(i => i[1] === `"${mod}"` && i[2] === `"${name}"`)) return
  ctx.module.imports.push(['import', `"${mod}"`, `"${name}"`, fn])
}

/**
 * Ensure a Hook API function is imported from env.
 * name: Hook API function name (e.g. 'accept', 'rollback')
 * params: array of WASM param types (e.g. ['i32', 'i32', 'i64'])
 * result: result type (default 'i64')
 */
export const ensureHookImport = (ctx, name, params, result = 'i64') => {
  addImportOnce(ctx, 'env', name, [
    'func', `$hook_${name}`,
    ...params.map(t => ['param', t]),
    ['result', result]
  ])
}

export default (ctx) => {
  // No stdlib inc needed — ptr/len extraction is fully inlined as bit ops below.

  // Sanity check: static data must not overflow into scratch area
  const dataLen = ctx.runtime?.data?.length ?? 0
  if (dataLen > HOOK_SCRATCH_OFFSET) {
    console.warn(`[hook] static data (${dataLen} bytes) overlaps scratch area at ${HOOK_SCRATCH_OFFSET}`)
  }

  // Register _g import (guard function, always needed in hook mode)
  ensureHookImport(ctx, '_g', ['i32', 'i32'], 'i32')

  // === Core control functions ===
  ensureHookImport(ctx, 'accept', ['i32', 'i32', 'i64'])
  ensureHookImport(ctx, 'rollback', ['i32', 'i32', 'i64'])

  // === Trace functions ===
  ensureHookImport(ctx, 'trace', ['i32', 'i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'trace_num', ['i32', 'i32', 'i64'])
  ensureHookImport(ctx, 'trace_float', ['i32', 'i32', 'i64'])

  // === State functions ===
  ensureHookImport(ctx, 'state', ['i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'state_set', ['i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'state_foreign', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'state_foreign_set', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32'])

  // === Emitting transactions ===
  ensureHookImport(ctx, 'etxn_reserve', ['i32'])
  ensureHookImport(ctx, 'etxn_details', ['i32', 'i32'])
  ensureHookImport(ctx, 'etxn_burden', [])
  ensureHookImport(ctx, 'etxn_generation', [])
  ensureHookImport(ctx, 'etxn_nonce', ['i32', 'i32'])
  ensureHookImport(ctx, 'etxn_fee_base', ['i32', 'i32'])
  ensureHookImport(ctx, 'emit', ['i32', 'i32', 'i32', 'i32'])

  // === Outgoing transaction fields ===
  ensureHookImport(ctx, 'otxn_field', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'otxn_type', [])
  ensureHookImport(ctx, 'otxn_burden', [])
  ensureHookImport(ctx, 'otxn_slot', ['i32'])
  ensureHookImport(ctx, 'otxn_id', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'otxn_param', ['i32', 'i32', 'i32', 'i32'])

  // === Slot operations ===
  ensureHookImport(ctx, 'slot', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'slot_clear', ['i32'])
  ensureHookImport(ctx, 'slot_count', ['i32'])
  ensureHookImport(ctx, 'slot_id', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'slot_set', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'slot_size', ['i32'])
  ensureHookImport(ctx, 'slot_subarray', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'slot_subfield', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'slot_type', ['i32', 'i32'])
  ensureHookImport(ctx, 'slot_float', ['i32'])
  ensureHookImport(ctx, 'meta_slot', ['i32'])
  ensureHookImport(ctx, 'xpop_slot', ['i32', 'i32'])

  // === Hook metadata ===
  ensureHookImport(ctx, 'hook_account', ['i32', 'i32'])
  ensureHookImport(ctx, 'hook_pos', [])
  ensureHookImport(ctx, 'hook_again', [])
  ensureHookImport(ctx, 'hook_skip', ['i32', 'i32'])
  ensureHookImport(ctx, 'hook_param', ['i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'hook_param_set', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32'])

  // === Ledger ===
  ensureHookImport(ctx, 'ledger_last_time', [])
  ensureHookImport(ctx, 'ledger_seq', [])
  ensureHookImport(ctx, 'ledger_last_hash', ['i32', 'i32'])
  ensureHookImport(ctx, 'ledger_nonce', ['i32', 'i32'])
  ensureHookImport(ctx, 'ledger_keylet', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32'])

  // === Utilities ===
  ensureHookImport(ctx, 'util_keylet', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'util_sha512h', ['i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'util_accid', ['i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'util_raddr', ['i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'util_verify', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'util_encode', ['i32', 'i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'util_decode', ['i32', 'i32', 'i32', 'i32', 'i32'])

  // === XFL floating point ===
  ensureHookImport(ctx, 'float_set', ['i32', 'i64'])
  ensureHookImport(ctx, 'float_multiply', ['i64', 'i64'])
  ensureHookImport(ctx, 'float_divide', ['i64', 'i64'])
  ensureHookImport(ctx, 'float_one', [])
  ensureHookImport(ctx, 'float_compare', ['i64', 'i64', 'i32'])
  ensureHookImport(ctx, 'float_sum', ['i64', 'i64'])
  ensureHookImport(ctx, 'float_negate', ['i64'])
  ensureHookImport(ctx, 'float_invert', ['i64'])
  ensureHookImport(ctx, 'float_mulratio', ['i64', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'float_sto', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i64', 'i32'])
  ensureHookImport(ctx, 'float_sto_set', ['i32', 'i32'])
  ensureHookImport(ctx, 'float_mantissa', ['i64'])
  ensureHookImport(ctx, 'float_sign', ['i64'])
  ensureHookImport(ctx, 'float_int', ['i64', 'i32', 'i32'])
  ensureHookImport(ctx, 'float_exponent', ['i64'])
  ensureHookImport(ctx, 'float_exponent_set', ['i64', 'i32'])
  ensureHookImport(ctx, 'float_mantissa_set', ['i64', 'i64'])
  ensureHookImport(ctx, 'float_log', ['i64'])
  ensureHookImport(ctx, 'float_root', ['i64', 'i32'])

  // === STO operations ===
  ensureHookImport(ctx, 'sto_subfield', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'sto_subarray', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'sto_validate', ['i32', 'i32'])
  ensureHookImport(ctx, 'sto_emplace', ['i32', 'i32', 'i32', 'i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'sto_erase', ['i32', 'i32', 'i32', 'i32', 'i32'])

  // Compile-time helpers: extract (ptr i32, len i32) from NaN-boxed string/buffer
  // without any runtime function calls.  SSO is disabled in hook mode so the low
  // 32 bits of every string NaN-box are always a valid heap memory address.

  // Read a LE i32 from the static data segment at byte index idx.
  const readDataI32 = (idx) => {
    const data = ctx.runtime.data
    if (!data || idx < 0 || idx + 4 > data.length) return null
    return (data.charCodeAt(idx) | (data.charCodeAt(idx+1)<<8) |
            (data.charCodeAt(idx+2)<<16) | (data.charCodeAt(idx+3)<<24)) >>> 0
  }

  // Extract BigInt bits from an i64.const IR node.
  const getI64Bits = (ir) => {
    if (!Array.isArray(ir) || ir[0] !== 'i64.const') return null
    const v = ir[1]
    try { return typeof v === 'bigint' ? v : BigInt(v) } catch { return null }
  }

  // hookStrArgs(v) → [ptr_ir, len_ir]
  // ptr = memory address of string bytes (low 32 bits of NaN-box, heap only — SSO disabled)
  // len = UTF-8 byte count (compile-time from data pool header at ptr-4, or i32.load at runtime)
  const hookStrArgs = (v) => {
    const ir = asI64(emit(v))
    const bits = getI64Bits(ir)
    if (bits != null) {
      const rawOffset = Number(bits & 0xFFFFFFFFn)
      const len = readDataI32(rawOffset - 4)
      if (len != null) {
        // rawOffset is the pre-strip heap address; stripStaticDataPrefix will subtract
        // staticDataLen from i64.const nodes, so we pre-apply the same adjustment here.
        const ptr = rawOffset - (ctx.runtime.staticDataLen || 0)
        return [typed(['i32.const', ptr], 'i32'), typed(['i32.const', len], 'i32')]
      }
    }
    if (ir[0] === 'local.get' || ir[0] === 'global.get') {
      return [
        typed(['i32.wrap_i64', ir], 'i32'),
        typed(['i32.load', ['i32.sub', ['i32.wrap_i64', ir], ['i32.const', 4]]], 'i32')
      ]
    }
    const tmp = temp(); ctx.func.locals.set(tmp, 'i64')
    return [
      typed(['i32.wrap_i64', typed(['local.tee', `$${tmp}`, ir], 'i64')], 'i32'),
      typed(['i32.load', ['i32.sub', ['i32.wrap_i64', typed(['local.get', `$${tmp}`], 'i64')], ['i32.const', 4]]], 'i32')
    ]
  }

  // hookBufArgs(v) → [ptr_ir, len_ir]
  // ptr = low 32 bits, len = mem[ptr-8] (Buffer/Array/Uint8Array header: [-8:len][-4:cap][data])
  const hookBufArgs = (v) => {
    const ir = asI64(emit(v))
    const bits = getI64Bits(ir)
    if (bits != null) {
      const rawOffset = Number(bits & 0xFFFFFFFFn)
      const len = readDataI32(rawOffset - 8)
      if (len != null) {
        const ptr = rawOffset - (ctx.runtime.staticDataLen || 0)
        return [typed(['i32.const', ptr], 'i32'), typed(['i32.const', len], 'i32')]
      }
    }
    if (ir[0] === 'local.get' || ir[0] === 'global.get') {
      return [
        typed(['i32.wrap_i64', ir], 'i32'),
        typed(['i32.load', ['i32.sub', ['i32.wrap_i64', ir], ['i32.const', 8]]], 'i32')
      ]
    }
    const tmp = temp(); ctx.func.locals.set(tmp, 'i64')
    return [
      typed(['i32.wrap_i64', typed(['local.tee', `$${tmp}`, ir], 'i64')], 'i32'),
      typed(['i32.load', ['i32.sub', ['i32.wrap_i64', typed(['local.get', `$${tmp}`], 'i64')], ['i32.const', 8]]], 'i32')
    ]
  }

  // hookCapArgs(v) → [ptr_ir, cap_ir]
  // For OUTPUT buffer functions: passes capacity (ptr-4) as write_len so the Hook API
  // knows how many bytes it may write. For strings ptr-4 = len = max writable size.
  // For Uint8Array/Buffer ptr-4 = byteCap (distinct from the current byteLen at ptr-8).
  // Using ptr-8 (hookBufArgs) for output buffers is wrong: a freshly created Uint8Array
  // has byteLen=0, and a string literal has garbage at ptr-8 which causes out-of-bounds writes.
  const hookCapArgs = (v) => {
    const ir = asI64(emit(v))
    const bits = getI64Bits(ir)
    if (bits != null) {
      const rawOffset = Number(bits & 0xFFFFFFFFn)
      const cap = readDataI32(rawOffset - 4)
      if (cap != null) {
        const ptr = rawOffset - (ctx.runtime.staticDataLen || 0)
        return [typed(['i32.const', ptr], 'i32'), typed(['i32.const', cap], 'i32')]
      }
    }
    if (ir[0] === 'local.get' || ir[0] === 'global.get') {
      return [
        typed(['i32.wrap_i64', ir], 'i32'),
        typed(['i32.load', ['i32.sub', ['i32.wrap_i64', ir], ['i32.const', 4]]], 'i32')
      ]
    }
    const tmp = temp(); ctx.func.locals.set(tmp, 'i64')
    return [
      typed(['i32.wrap_i64', typed(['local.tee', `$${tmp}`, ir], 'i64')], 'i32'),
      typed(['i32.load', ['i32.sub', ['i32.wrap_i64', typed(['local.get', `$${tmp}`], 'i64')], ['i32.const', 4]]], 'i32')
    ]
  }

  // hookValArgs(v) → [ptr_ir, len_ir]
  // Like hookBufArgs but reads len from ptr-4 for strings (PTR.STRING) and ptr-8 for buffers.
  const hookValArgs = (v) => {
    const ir = asI64(emit(v))
    const bits = getI64Bits(ir)
    if (bits != null) {
      const tag = Number((bits >> BigInt(LAYOUT.TAG_SHIFT)) & BigInt(LAYOUT.TAG_MASK))
      const rawOffset = Number(bits & 0xFFFFFFFFn)
      const lenOff = tag === PTR.STRING ? -4 : -8
      const len = readDataI32(rawOffset + lenOff)
      if (len != null) {
        const ptr = rawOffset - (ctx.runtime.staticDataLen || 0)
        return [typed(['i32.const', ptr], 'i32'), typed(['i32.const', len], 'i32')]
      }
    }
    if (ir[0] === 'local.get' || ir[0] === 'global.get') {
      const varName = typeof ir[1] === 'string' ? ir[1].replace(/^\$/, '') : null
      const rep = varName
        ? (ir[0] === 'local.get' ? ctx.func.repByLocal?.get(varName) : ctx.scope.repByGlobal?.get(varName))
        : null
      const lenOff = rep?.val === 'string' ? 4 : 8
      return [
        typed(['i32.wrap_i64', ir], 'i32'),
        typed(['i32.load', ['i32.sub', ['i32.wrap_i64', ir], ['i32.const', lenOff]]], 'i32')
      ]
    }
    const tmp = temp(); ctx.func.locals.set(tmp, 'i64')
    return [
      typed(['i32.wrap_i64', typed(['local.tee', `$${tmp}`, ir], 'i64')], 'i32'),
      typed(['i32.load', ['i32.sub', ['i32.wrap_i64', typed(['local.get', `$${tmp}`], 'i64')], ['i32.const', 8]]], 'i32')
    ]
  }

  // === Emitters for zero-arg functions (return i64) ===
  for (const fn0 of ['otxn_type', 'otxn_burden', 'etxn_burden', 'etxn_generation', 'hook_pos', 'hook_again',
                     'ledger_last_time', 'ledger_seq', 'float_one']) {
    ctx.core.emit[`hook.${fn0}`] = () => typed(['call', `$hook_${fn0}`], 'i64')
  }

  // Scalar argument helpers: call emit() on raw AST args before coercing to i32/i64.
  // Hook API emitters receive raw AST nodes (not pre-emitted IR) from the dispatch
  // path in emit.js. Calling emit() resolves variable references, imports, and literals
  // to proper IR, preventing bare identifier strings in the binary output.
  const e32 = (v) => asI32(emit(v))
  const e64 = (v) => asI64(emit(v))
  const eopt32 = (v, def) => asI32(v != null ? emit(v) : def)

  // etxn_reserve(count: i32) → i64
  ctx.core.emit['hook.etxn_reserve'] = (count) =>
    typed(['call', '$hook_etxn_reserve', e32(count)], 'i64')

  // etxn_nonce() → scratch; etxn_nonce(out_buf) → user buffer
  ctx.core.emit['hook.etxn_nonce'] = (out) => {
    if (out == null) {
      return typed(['call', '$hook_etxn_nonce',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_etxn_nonce', ...hookCapArgs(out)], 'i64')
  }

  // etxn_fee_base(tx_buf) → i64
  ctx.core.emit['hook.etxn_fee_base'] = (txBuf) =>
    typed(['call', '$hook_etxn_fee_base', ...hookBufArgs(txBuf)], 'i64')

  // otxn_slot(slot: i32) → i64
  ctx.core.emit['hook.otxn_slot'] = (slot) =>
    typed(['call', '$hook_otxn_slot', e32(slot)], 'i64')

  // otxn_id(out_buf, flags?) → i64
  ctx.core.emit['hook.otxn_id'] = (out, flags) =>
    typed(['call', '$hook_otxn_id', ...hookCapArgs(out),
      eopt32(flags, ['i32.const', 0])], 'i64')

  // slot_clear, slot_count, slot_size, slot_float, meta_slot (slot: i32) → i64
  for (const fn1 of ['slot_clear', 'slot_count', 'slot_size', 'slot_float', 'meta_slot']) {
    ctx.core.emit[`hook.${fn1}`] = (slot) =>
      typed(['call', `$hook_${fn1}`, e32(slot)], 'i64')
  }

  // xpop_slot(slot_no_in: i32, slot_no_out: i32) → i64
  ctx.core.emit['hook.xpop_slot'] = (slotIn, slotOut) =>
    typed(['call', '$hook_xpop_slot', e32(slotIn), e32(slotOut)], 'i64')

  // float_* two-arg XFL functions
  for (const fn2 of ['float_multiply', 'float_divide', 'float_sum']) {
    ctx.core.emit[`hook.${fn2}`] = (a, b) =>
      typed(['call', `$hook_${fn2}`, e64(a), e64(b)], 'i64')
  }

  ctx.core.emit['hook.float_compare'] = (a, b, mode) =>
    typed(['call', '$hook_float_compare', e64(a), e64(b), eopt32(mode, ['i32.const', 0])], 'i64')

  for (const fn1 of ['float_negate', 'float_invert', 'float_mantissa', 'float_sign', 'float_exponent']) {
    ctx.core.emit[`hook.${fn1}`] = (a) => typed(['call', `$hook_${fn1}`, e64(a)], 'i64')
  }

  ctx.core.emit['hook.float_int'] = (a, dp, abs) =>
    typed(['call', '$hook_float_int', e64(a),
      eopt32(dp, ['i32.const', 0]),
      eopt32(abs, ['i32.const', 0])], 'i64')

  ctx.core.emit['hook.float_set'] = (exp, mant) =>
    typed(['call', '$hook_float_set', e32(exp), e64(mant)], 'i64')

  ctx.core.emit['hook.float_exponent_set'] = (a, exp) =>
    typed(['call', '$hook_float_exponent_set', e64(a), e32(exp)], 'i64')

  ctx.core.emit['hook.float_mantissa_set'] = (a, mant) =>
    typed(['call', '$hook_float_mantissa_set', e64(a), e64(mant)], 'i64')

  // float_log(f: i64) → i64
  ctx.core.emit['hook.float_log'] = (f) => typed(['call', '$hook_float_log', e64(f)], 'i64')

  // float_root(f: i64, n: i32) → i64
  ctx.core.emit['hook.float_root'] = (f, n) => typed(['call', '$hook_float_root', e64(f), e32(n)], 'i64')

  // float_mulratio(f: i64, round_up: i32, numerator: i32, denominator: i32) → i64
  ctx.core.emit['hook.float_mulratio'] = (f, roundUp, num, denom) =>
    typed(['call', '$hook_float_mulratio', e64(f), e32(roundUp), e32(num), e32(denom)], 'i64')

  // float_sto(out, currency_buf, issuer_buf, xfl, field_code) → i64
  ctx.core.emit['hook.float_sto'] = (out, currency, issuer, xfl, fieldCode) =>
    typed(['call', '$hook_float_sto',
      ...hookCapArgs(out), ...hookBufArgs(currency), ...hookBufArgs(issuer),
      e64(xfl), e32(fieldCode)], 'i64')

  // float_sto_set(sto_buf) → i64
  ctx.core.emit['hook.float_sto_set'] = (buf) =>
    typed(['call', '$hook_float_sto_set', ...hookBufArgs(buf)], 'i64')

  // accept(msg, code) → accept(msg_ptr, msg_len, code_i64)
  ctx.core.emit['hook.accept'] = (msg, code) =>
    typed(['call', '$hook_accept', ...hookStrArgs(msg), e64(code)], 'i64')

  // rollback(msg, code) → rollback(msg_ptr, msg_len, code_i64)
  ctx.core.emit['hook.rollback'] = (msg, code) =>
    typed(['call', '$hook_rollback', ...hookStrArgs(msg), e64(code)], 'i64')

  // trace(label, data, ashex)
  ctx.core.emit['hook.trace'] = (label, data, ashex) =>
    typed(['call', '$hook_trace',
      ...hookValArgs(label), ...hookValArgs(data),
      eopt32(ashex, ['i32.const', 0])], 'i64')

  // trace_num(label, num)
  ctx.core.emit['hook.trace_num'] = (label, num) =>
    typed(['call', '$hook_trace_num', ...hookValArgs(label), e64(num)], 'i64')

  // trace_float(label, xfl)
  ctx.core.emit['hook.trace_float'] = (label, xfl) =>
    typed(['call', '$hook_trace_float', ...hookValArgs(label), e64(xfl)], 'i64')

  // state(out_buf, key) → state(wptr, wlen, kptr, klen)
  ctx.core.emit['hook.state'] = (out, key) =>
    typed(['call', '$hook_state', ...hookCapArgs(out), ...hookStrArgs(key)], 'i64')

  // state_set(val_buf, key)
  ctx.core.emit['hook.state_set'] = (val, key) =>
    typed(['call', '$hook_state_set', ...hookValArgs(val), ...hookStrArgs(key)], 'i64')

  // otxn_field(sfField) → scratch; otxn_field(buf, sfField) → user buffer
  ctx.core.emit['hook.otxn_field'] = (arg0, arg1) => {
    if (arg1 == null) {
      return typed(['call', '$hook_otxn_field',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE],
        e32(arg0)], 'i64')
    }
    return typed(['call', '$hook_otxn_field', ...hookCapArgs(arg0), e32(arg1)], 'i64')
  }

  // hook_account() → scratch; hook_account(out_buf) → user buffer
  ctx.core.emit['hook.hook_account'] = (out) => {
    if (out == null) {
      return typed(['call', '$hook_hook_account',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_hook_account', ...hookCapArgs(out)], 'i64')
  }

  // hook_skip(nh: i32, name: i32) → i64
  ctx.core.emit['hook.hook_skip'] = (nh, name) =>
    typed(['call', '$hook_hook_skip', e32(nh), e32(name)], 'i64')

  // hook_param(out_buf, key) → i64
  ctx.core.emit['hook.hook_param'] = (out, key) =>
    typed(['call', '$hook_hook_param', ...hookCapArgs(out), ...hookStrArgs(key)], 'i64')

  // hook_param_set(val, key, hook_hash) → i64
  ctx.core.emit['hook.hook_param_set'] = (val, key, hookHash) =>
    typed(['call', '$hook_hook_param_set',
      ...hookValArgs(val), ...hookStrArgs(key), ...hookBufArgs(hookHash)], 'i64')

  // otxn_param(out_buf, key) → i64
  ctx.core.emit['hook.otxn_param'] = (out, key) =>
    typed(['call', '$hook_otxn_param', ...hookCapArgs(out), ...hookStrArgs(key)], 'i64')

  // ledger_last_hash() → scratch; ledger_last_hash(out_buf) → user buffer
  ctx.core.emit['hook.ledger_last_hash'] = (out) => {
    if (out == null) {
      return typed(['call', '$hook_ledger_last_hash',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_ledger_last_hash', ...hookCapArgs(out)], 'i64')
  }

  // ledger_nonce() → scratch; ledger_nonce(out_buf) → user buffer
  ctx.core.emit['hook.ledger_nonce'] = (out) => {
    if (out == null) {
      return typed(['call', '$hook_ledger_nonce',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_ledger_nonce', ...hookCapArgs(out)], 'i64')
  }

  // ledger_keylet(write_ptr, write_len, keylet_type, read_ptr, read_len, read2_ptr, read2_len) → i64
  ctx.core.emit['hook.ledger_keylet'] = (...args) =>
    typed(['call', '$hook_ledger_keylet', ...args.slice(0, 7).map(v => e32(v))], 'i64')

  // slot(slotNo) → scratch; slot(out_buf, slotNo) → user buffer
  ctx.core.emit['hook.slot'] = (arg0, arg1) => {
    if (arg1 == null) {
      // 1-arg: write to scratch buffer
      return typed(['call', '$hook_slot',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE],
        e32(arg0)], 'i64')
    }
    return typed(['call', '$hook_slot', ...hookCapArgs(arg0), e32(arg1)], 'i64')
  }

  // slot_id(out_buf, slot_no)
  ctx.core.emit['hook.slot_id'] = (out, slotNo) =>
    typed(['call', '$hook_slot_id', ...hookCapArgs(out), e32(slotNo)], 'i64')

  // slot_set(buf, slot_no)
  ctx.core.emit['hook.slot_set'] = (buf, slotNo) =>
    typed(['call', '$hook_slot_set', ...hookBufArgs(buf), e32(slotNo)], 'i64')

  // slot_subfield(parent, field_id, new_slot)
  ctx.core.emit['hook.slot_subfield'] = (parent, fid, newSlot) =>
    typed(['call', '$hook_slot_subfield', e32(parent), e32(fid), e32(newSlot)], 'i64')

  // slot_subarray(parent, array_id, new_slot)
  ctx.core.emit['hook.slot_subarray'] = (parent, aid, newSlot) =>
    typed(['call', '$hook_slot_subarray', e32(parent), e32(aid), e32(newSlot)], 'i64')

  // slot_type(slot_no, flags)
  ctx.core.emit['hook.slot_type'] = (slotNo, flags) =>
    typed(['call', '$hook_slot_type', e32(slotNo),
      eopt32(flags, ['i32.const', 0])], 'i64')

  // util_keylet(out, type, a, b, c, d, e, f)
  ctx.core.emit['hook.util_keylet'] = (out, type, a, b, c, d, ef, ff) =>
    typed(['call', '$hook_util_keylet',
      ...hookCapArgs(out), e32(type),
      eopt32(a, ['i32.const', 0]), eopt32(b, ['i32.const', 0]),
      eopt32(c, ['i32.const', 0]), eopt32(d, ['i32.const', 0]),
      eopt32(ef, ['i32.const', 0]), eopt32(ff, ['i32.const', 0])], 'i64')

  // util_sha512h(out, input)
  ctx.core.emit['hook.util_sha512h'] = (out, input) =>
    typed(['call', '$hook_util_sha512h',
      ...hookCapArgs(out), ...hookBufArgs(input)], 'i64')

  // util_accid(out, raddr_str)
  ctx.core.emit['hook.util_accid'] = (out, raddr) =>
    typed(['call', '$hook_util_accid',
      ...hookCapArgs(out), ...hookStrArgs(raddr)], 'i64')

  // util_raddr(out, accid_buf)
  ctx.core.emit['hook.util_raddr'] = (out, accid) =>
    typed(['call', '$hook_util_raddr',
      ...hookCapArgs(out), ...hookBufArgs(accid)], 'i64')

  // util_verify(sig, data, pubkey)
  ctx.core.emit['hook.util_verify'] = (sig, data, pubkey) =>
    typed(['call', '$hook_util_verify',
      ...hookBufArgs(sig), ...hookBufArgs(data), ...hookBufArgs(pubkey)], 'i64')

  // util_encode(write_ptr, write_len, read_ptr, read_len, type) → i64
  ctx.core.emit['hook.util_encode'] = (...args) =>
    typed(['call', '$hook_util_encode', ...args.slice(0, 5).map(v => e32(v))], 'i64')

  // util_decode(write_ptr, write_len, read_ptr, read_len, type) → i64
  ctx.core.emit['hook.util_decode'] = (...args) =>
    typed(['call', '$hook_util_decode', ...args.slice(0, 5).map(v => e32(v))], 'i64')

  // emit(out_buf, tx_buf)
  ctx.core.emit['hook.emit'] = (out, tx) =>
    typed(['call', '$hook_emit', ...hookCapArgs(out), ...hookBufArgs(tx)], 'i64')

  // etxn_details(out_buf)
  ctx.core.emit['hook.etxn_details'] = (out) =>
    typed(['call', '$hook_etxn_details', ...hookCapArgs(out)], 'i64')

  // sto_subfield(buf, field_id)
  ctx.core.emit['hook.sto_subfield'] = (buf, fid) =>
    typed(['call', '$hook_sto_subfield', ...hookBufArgs(buf), e32(fid)], 'i64')

  // sto_subarray(buf, array_id)
  ctx.core.emit['hook.sto_subarray'] = (buf, aid) =>
    typed(['call', '$hook_sto_subarray', ...hookBufArgs(buf), e32(aid)], 'i64')

  // sto_validate(buf)
  ctx.core.emit['hook.sto_validate'] = (buf) =>
    typed(['call', '$hook_sto_validate', ...hookBufArgs(buf)], 'i64')

  // sto_emplace(write_ptr, write_len, sread_ptr, sread_len, fread_ptr, fread_len, field_id) → i64
  ctx.core.emit['hook.sto_emplace'] = (...args) =>
    typed(['call', '$hook_sto_emplace', ...args.slice(0, 7).map(v => e32(v))], 'i64')

  // sto_erase(write_ptr, write_len, sread_ptr, sread_len, field_id) → i64
  ctx.core.emit['hook.sto_erase'] = (...args) =>
    typed(['call', '$hook_sto_erase', ...args.slice(0, 5).map(v => e32(v))], 'i64')

  // state_foreign(out, key, ns, acc)
  ctx.core.emit['hook.state_foreign'] = (out, key, ns, acc) =>
    typed(['call', '$hook_state_foreign',
      ...hookCapArgs(out), ...hookStrArgs(key),
      ...hookBufArgs(ns), ...hookBufArgs(acc)], 'i64')

  // state_foreign_set(val, key, ns, acc)
  ctx.core.emit['hook.state_foreign_set'] = (val, key, ns, acc) =>
    typed(['call', '$hook_state_foreign_set',
      ...hookValArgs(val), ...hookStrArgs(key),
      ...hookBufArgs(ns), ...hookBufArgs(acc)], 'i64')

  // === Scratch buffer emitters (Change 4) ===
  ctx.core.emit['hook.SCRATCH_PTR'] = () => typed(['i32.const', HOOK_SCRATCH_OFFSET], 'i32')
  ctx.core.emit['hook.SCRATCH_LEN'] = () => typed(['i32.const', HOOK_SCRATCH_SIZE], 'i32')
}
