/**
 * Hook API bindings — maps `import { fn } from 'hook'` to env.* WASM imports.
 * Registers all Xahau Hook API WASM imports and emitter table entries.
 */
import { asI64, asI32, typed } from '../../src/ir.js'
import { inc } from '../../src/ctx.js'
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
  // Ensure stdlib helpers used by hook API emitters land in the binary.
  // hookStrPtr/hookStrLen/hookBufLen call $__ptr_offset, $__str_len, $__len directly;
  // without inc() they'd be absent from sec.stdlib when the user source has no
  // array/string operations that would otherwise trigger their inclusion.
  inc('__ptr_offset', '__str_len', '__len')

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
  ensureHookImport(ctx, 'etxn_nonce', ['i32', 'i32'])
  ensureHookImport(ctx, 'etxn_fee_base', ['i64'])
  ensureHookImport(ctx, 'etxn_manifest', ['i32', 'i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'emit', ['i32', 'i32', 'i32', 'i32'])

  // === Outgoing transaction fields ===
  ensureHookImport(ctx, 'otxn_field', ['i32', 'i32', 'i32'])
  ensureHookImport(ctx, 'otxn_type', [])
  ensureHookImport(ctx, 'otxn_burden', [])
  ensureHookImport(ctx, 'otxn_slot', ['i32'])
  ensureHookImport(ctx, 'otxn_id', ['i32', 'i32', 'i32'])

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

  // Helper: extract (ptr i32, len i32) from NaN-boxed string/buffer.
  // Each helper calls emit(v) to resolve variable references and literal AST nodes
  // to proper IR before coercing, avoiding bare-string identifiers in the output.
  const hookStrPtr = (v) => typed(['call', '$__ptr_offset', asI64(emit(v))], 'i32')
  const hookStrLen = (v) => typed(['call', '$__str_len', asI64(emit(v))], 'i32')
  const hookBufLen = (v) => typed(['call', '$__len', asI64(emit(v))], 'i32')

  // === Emitters for zero-arg functions (return i64) ===
  for (const fn0 of ['otxn_type', 'otxn_burden', 'etxn_burden', 'hook_pos', 'hook_again',
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

  // etxn_nonce() → scratch; etxn_nonce(write_ptr, write_len) → user buffer
  ctx.core.emit['hook.etxn_nonce'] = (wPtr, wLen) => {
    if (wPtr == null) {
      return typed(['call', '$hook_etxn_nonce',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_etxn_nonce', e32(wPtr), e32(wLen)], 'i64')
  }

  // etxn_fee_base(mant: i64) → i64
  ctx.core.emit['hook.etxn_fee_base'] = (mant) =>
    typed(['call', '$hook_etxn_fee_base', e64(mant)], 'i64')

  // etxn_manifest(buf: i32, len: i32, master_acc: i32, master_acc_len: i32) → i64
  ctx.core.emit['hook.etxn_manifest'] = (buf, len, acc, accLen) =>
    typed(['call', '$hook_etxn_manifest', e32(buf), e32(len), e32(acc), e32(accLen)], 'i64')

  // otxn_slot(slot: i32) → i64
  ctx.core.emit['hook.otxn_slot'] = (slot) =>
    typed(['call', '$hook_otxn_slot', e32(slot)], 'i64')

  // otxn_id(write_ptr: i32, write_len: i32, flags: i32) → i64
  ctx.core.emit['hook.otxn_id'] = (wPtr, wLen, flags) =>
    typed(['call', '$hook_otxn_id', e32(wPtr), e32(wLen),
      eopt32(flags, ['i32.const', 0])], 'i64')

  // slot_clear, slot_count, slot_size, slot_float (slot: i32) → i64
  for (const fn1 of ['slot_clear', 'slot_count', 'slot_size', 'slot_float']) {
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

  for (const fn1 of ['float_negate', 'float_mantissa', 'float_sign', 'float_exponent']) {
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

  // accept(msg, code) → accept(msg_ptr, msg_len, code_i64)
  ctx.core.emit['hook.accept'] = (msg, code) =>
    typed(['call', '$hook_accept',
      hookStrPtr(msg), hookStrLen(msg),
      e64(code)], 'i64')

  // rollback(msg, code) → rollback(msg_ptr, msg_len, code_i64)
  ctx.core.emit['hook.rollback'] = (msg, code) =>
    typed(['call', '$hook_rollback',
      hookStrPtr(msg), hookStrLen(msg),
      e64(code)], 'i64')

  // trace(label, data, ashex)
  ctx.core.emit['hook.trace'] = (label, data, ashex) =>
    typed(['call', '$hook_trace',
      hookStrPtr(label), hookStrLen(label),
      hookStrPtr(data), hookBufLen(data),
      eopt32(ashex, ['i32.const', 0])], 'i64')

  // trace_num(label, num)
  ctx.core.emit['hook.trace_num'] = (label, num) =>
    typed(['call', '$hook_trace_num',
      hookStrPtr(label), hookStrLen(label),
      e64(num)], 'i64')

  // trace_float(label, xfl)
  ctx.core.emit['hook.trace_float'] = (label, xfl) =>
    typed(['call', '$hook_trace_float',
      hookStrPtr(label), hookStrLen(label),
      e64(xfl)], 'i64')

  // state(out_buf, key) → state(wptr, wlen, kptr, klen)
  ctx.core.emit['hook.state'] = (out, key) =>
    typed(['call', '$hook_state',
      hookStrPtr(out), hookBufLen(out),
      hookStrPtr(key), hookStrLen(key)], 'i64')

  // state_set(val_buf, key)
  ctx.core.emit['hook.state_set'] = (val, key) =>
    typed(['call', '$hook_state_set',
      hookStrPtr(val), hookBufLen(val),
      hookStrPtr(key), hookStrLen(key)], 'i64')

  // otxn_field(sfField) → scratch; otxn_field(buf, sfField) → user buffer
  ctx.core.emit['hook.otxn_field'] = (arg0, arg1) => {
    if (arg1 == null) {
      // 1-arg: write to scratch buffer
      return typed(['call', '$hook_otxn_field',
        ['i32.const', HOOK_SCRATCH_OFFSET],
        ['i32.const', HOOK_SCRATCH_SIZE],
        e32(arg0)], 'i64')
    }
    // 2-arg: write to user-provided buffer
    return typed(['call', '$hook_otxn_field',
      hookStrPtr(arg0), hookBufLen(arg0),
      e32(arg1)], 'i64')
  }

  // hook_account() → scratch; hook_account(out_buf) → user buffer
  ctx.core.emit['hook.hook_account'] = (wPtr, wLen) => {
    if (wPtr == null) {
      return typed(['call', '$hook_hook_account',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_hook_account', e32(wPtr), e32(wLen)], 'i64')
  }

  // hook_skip(nh: i32, name: i32) → i64
  ctx.core.emit['hook.hook_skip'] = (nh, name) =>
    typed(['call', '$hook_hook_skip', e32(nh), e32(name)], 'i64')

  // hook_param(write_ptr, write_len, read_ptr, read_len) → i64
  ctx.core.emit['hook.hook_param'] = (wPtr, wLen, rPtr, rLen) =>
    typed(['call', '$hook_hook_param', e32(wPtr), e32(wLen), e32(rPtr), e32(rLen)], 'i64')

  // hook_param_set(write_ptr, write_len, read_ptr, read_len, kread_ptr, kread_len) → i64
  ctx.core.emit['hook.hook_param_set'] = (...args) =>
    typed(['call', '$hook_hook_param_set', ...args.slice(0, 6).map(v => e32(v))], 'i64')

  // ledger_last_hash() → scratch; ledger_last_hash(out_buf) → user buffer
  ctx.core.emit['hook.ledger_last_hash'] = (wPtr, wLen) => {
    if (wPtr == null) {
      return typed(['call', '$hook_ledger_last_hash',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_ledger_last_hash', e32(wPtr), e32(wLen)], 'i64')
  }

  // ledger_nonce() → scratch; ledger_nonce(out_buf) → user buffer
  ctx.core.emit['hook.ledger_nonce'] = (wPtr, wLen) => {
    if (wPtr == null) {
      return typed(['call', '$hook_ledger_nonce',
        ['i32.const', HOOK_SCRATCH_OFFSET], ['i32.const', HOOK_SCRATCH_SIZE]], 'i64')
    }
    return typed(['call', '$hook_ledger_nonce', e32(wPtr), e32(wLen)], 'i64')
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
    return typed(['call', '$hook_slot', hookStrPtr(arg0), hookBufLen(arg0), e32(arg1)], 'i64')
  }

  // slot_id(out_buf, slot_no)
  ctx.core.emit['hook.slot_id'] = (out, slotNo) =>
    typed(['call', '$hook_slot_id', hookStrPtr(out), hookBufLen(out), e32(slotNo)], 'i64')

  // slot_set(buf, slot_no)
  ctx.core.emit['hook.slot_set'] = (buf, slotNo) =>
    typed(['call', '$hook_slot_set', hookStrPtr(buf), hookBufLen(buf), e32(slotNo)], 'i64')

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
      hookStrPtr(out), hookBufLen(out),
      e32(type),
      eopt32(a, ['i32.const', 0]),
      eopt32(b, ['i32.const', 0]),
      eopt32(c, ['i32.const', 0]),
      eopt32(d, ['i32.const', 0]),
      eopt32(ef, ['i32.const', 0]),
      eopt32(ff, ['i32.const', 0])], 'i64')

  // util_sha512h(out, input)
  ctx.core.emit['hook.util_sha512h'] = (out, input) =>
    typed(['call', '$hook_util_sha512h',
      hookStrPtr(out), hookBufLen(out),
      hookStrPtr(input), hookBufLen(input)], 'i64')

  // util_accid(out, raddr_str)
  ctx.core.emit['hook.util_accid'] = (out, raddr) =>
    typed(['call', '$hook_util_accid',
      hookStrPtr(out), hookBufLen(out),
      hookStrPtr(raddr), hookStrLen(raddr)], 'i64')

  // util_raddr(out, accid_buf)
  ctx.core.emit['hook.util_raddr'] = (out, accid) =>
    typed(['call', '$hook_util_raddr',
      hookStrPtr(out), hookBufLen(out),
      hookStrPtr(accid), hookBufLen(accid)], 'i64')

  // util_verify(sig, data, pubkey)
  ctx.core.emit['hook.util_verify'] = (sig, data, pubkey) =>
    typed(['call', '$hook_util_verify',
      hookStrPtr(sig), hookBufLen(sig),
      hookStrPtr(data), hookBufLen(data),
      hookStrPtr(pubkey), hookBufLen(pubkey)], 'i64')

  // util_encode(write_ptr, write_len, read_ptr, read_len, type) → i64
  ctx.core.emit['hook.util_encode'] = (...args) =>
    typed(['call', '$hook_util_encode', ...args.slice(0, 5).map(v => e32(v))], 'i64')

  // util_decode(write_ptr, write_len, read_ptr, read_len, type) → i64
  ctx.core.emit['hook.util_decode'] = (...args) =>
    typed(['call', '$hook_util_decode', ...args.slice(0, 5).map(v => e32(v))], 'i64')

  // emit(out_buf, tx_buf)
  ctx.core.emit['hook.emit'] = (out, tx) =>
    typed(['call', '$hook_emit',
      hookStrPtr(out), hookBufLen(out),
      hookStrPtr(tx), hookBufLen(tx)], 'i64')

  // etxn_details(out_buf)
  ctx.core.emit['hook.etxn_details'] = (out) =>
    typed(['call', '$hook_etxn_details', hookStrPtr(out), hookBufLen(out)], 'i64')

  // sto_subfield(buf, field_id)
  ctx.core.emit['hook.sto_subfield'] = (buf, fid) =>
    typed(['call', '$hook_sto_subfield', hookStrPtr(buf), hookBufLen(buf), e32(fid)], 'i64')

  // sto_subarray(buf, array_id)
  ctx.core.emit['hook.sto_subarray'] = (buf, aid) =>
    typed(['call', '$hook_sto_subarray', hookStrPtr(buf), hookBufLen(buf), e32(aid)], 'i64')

  // sto_validate(buf)
  ctx.core.emit['hook.sto_validate'] = (buf) =>
    typed(['call', '$hook_sto_validate', hookStrPtr(buf), hookBufLen(buf)], 'i64')

  // sto_emplace(write_ptr, write_len, sread_ptr, sread_len, fread_ptr, fread_len, field_id) → i64
  ctx.core.emit['hook.sto_emplace'] = (...args) =>
    typed(['call', '$hook_sto_emplace', ...args.slice(0, 7).map(v => e32(v))], 'i64')

  // sto_erase(write_ptr, write_len, sread_ptr, sread_len, field_id) → i64
  ctx.core.emit['hook.sto_erase'] = (...args) =>
    typed(['call', '$hook_sto_erase', ...args.slice(0, 5).map(v => e32(v))], 'i64')

  // state_foreign(out, key, ns, acc)
  ctx.core.emit['hook.state_foreign'] = (out, key, ns, acc) =>
    typed(['call', '$hook_state_foreign',
      hookStrPtr(out), hookBufLen(out),
      hookStrPtr(key), hookStrLen(key),
      hookStrPtr(ns), hookBufLen(ns),
      hookStrPtr(acc), hookBufLen(acc)], 'i64')

  // state_foreign_set(val, key, ns, acc)
  ctx.core.emit['hook.state_foreign_set'] = (val, key, ns, acc) =>
    typed(['call', '$hook_state_foreign_set',
      hookStrPtr(val), hookBufLen(val),
      hookStrPtr(key), hookStrLen(key),
      hookStrPtr(ns), hookBufLen(ns),
      hookStrPtr(acc), hookBufLen(acc)], 'i64')

  // === Scratch buffer emitters (Change 4) ===
  ctx.core.emit['hook.SCRATCH_PTR'] = () => typed(['i32.const', HOOK_SCRATCH_OFFSET], 'i32')
  ctx.core.emit['hook.SCRATCH_LEN'] = () => typed(['i32.const', HOOK_SCRATCH_SIZE], 'i32')
}
