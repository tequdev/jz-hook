/**
 * Type declarations for the jz `'hook'` virtual module.
 *
 * These are compile-time stubs consumed by the jz compiler (--host hook).
 * They are NOT real runtime imports — jz lowers each call to the
 * corresponding Xahau Hook WASM host import.
 *
 * Setup — add to tsconfig.json:
 *   "compilerOptions": {
 *     "paths": { "hook": ["jz-hook/types"] }
 *   }
 */

declare module 'hook' {

  // ---------------------------------------------------------------------------
  // Primitive aliases (documentation only — jz maps these to WASM value types)
  // ---------------------------------------------------------------------------

  /** i64 value: XFL floats, ledger amounts, return codes, API results. */
  type I64 = number
  /** i32 value: field codes, slot numbers, counts, boolean flags. */
  type I32 = number
  /** Read buffer: string literals or byte arrays passed as input to host functions. */
  type ReadBuf = string | Uint8Array
  /** Write buffer: mutable Uint8Array that receives output from host functions. */
  type WriteBuf = Uint8Array

  // ---------------------------------------------------------------------------
  // Control
  // ---------------------------------------------------------------------------

  /** Accept the originating transaction. msg is returned in the metadata. */
  export function accept(msg: ReadBuf, code?: I64): I64
  /** Reject the originating transaction. */
  export function rollback(msg: ReadBuf, code?: I64): I64

  // ---------------------------------------------------------------------------
  // Tracing
  // ---------------------------------------------------------------------------

  export function trace(label: string, data: ReadBuf, ashex?: boolean): I64
  export function trace_hex(label: string, data: ReadBuf): I64
  export function trace_utf8(label: string, data: ReadBuf): I64
  export function trace_num(label: string, num: I64): I64
  export function trace_float(label: string, xfl: I64): I64

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  export function state(outBuf: WriteBuf | undefined, key: ReadBuf): I64
  export function state_set(valBuf: ReadBuf, key: ReadBuf): I64
  export function state_foreign(outBuf: WriteBuf | undefined, key: ReadBuf, namespaceBuf: ReadBuf, accountBuf: ReadBuf): I64
  export function state_foreign_set(valBuf: ReadBuf, key: ReadBuf, namespaceBuf: ReadBuf, accountBuf: ReadBuf): I64

  // ---------------------------------------------------------------------------
  // Originating transaction fields
  // ---------------------------------------------------------------------------

  /** Read sfField into scratch (no buf arg) or into outBuf. */
  export function otxn_field(sfField: I32): I64
  export function otxn_field(outBuf: WriteBuf | undefined, sfField: I32): I64
  export function otxn_slot(slot: I32): I64
  export function otxn_id(outBuf: WriteBuf, flags?: I32): I64
  export function otxn_type(): I64
  export function otxn_burden(): I64

  // ---------------------------------------------------------------------------
  // Emitted transaction
  // ---------------------------------------------------------------------------

  export function etxn_reserve(count: I32): I64
  export function etxn_burden(): I64
  export function etxn_generation(): I64
  export function etxn_fee_base(txBuf: ReadBuf): I64
  export function etxn_nonce(outBuf: WriteBuf): I64
  export function etxn_details(outBuf: WriteBuf): I64
  export function emit(outBuf: WriteBuf, txBuf: ReadBuf): I64

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  export function slot(slotNo: I32): I64
  export function slot(outBuf: WriteBuf | undefined, slotNo: I32): I64
  export function slot_clear(slot: I32): I64
  export function slot_count(slot: I32): I64
  export function slot_size(slot: I32): I64
  export function slot_float(slot: I32): I64
  export function slot_id(outBuf: WriteBuf, slotNo: I32): I64
  export function slot_set(buf: ReadBuf, slotNo: I32): I64
  export function slot_subfield(parent: I32, fieldId: I32, newSlot: I32): I64
  export function slot_subarray(parent: I32, arrayId: I32, newSlot: I32): I64
  export function slot_type(slotNo: I32, flags?: I32): I64
  export function meta_slot(slot: I32): I64
  export function xpop_slot(slotIn: I32, slotOut: I32): I64

  // ---------------------------------------------------------------------------
  // Ledger
  // ---------------------------------------------------------------------------

  export function ledger_last_hash(outBuf?: WriteBuf): I64
  export function ledger_last_time(): I64
  export function ledger_nonce(outBuf?: WriteBuf): I64
  export function ledger_seq(): I64
  export function ledger_keylet(outBuf: WriteBuf, keyletType: I32, r1Buf: ReadBuf, r2Buf: ReadBuf): I64

  // ---------------------------------------------------------------------------
  // Hook metadata
  // ---------------------------------------------------------------------------

  export function hook_account(outBuf?: WriteBuf): I64
  export function hook_pos(): I64
  export function hook_again(): I64
  export function hook_skip(numHooks: I32, name: I32): I64
  export function hook_param(outBuf: WriteBuf, keyBuf: ReadBuf): I64
  export function hook_param_set(outBuf: WriteBuf, valBuf: ReadBuf, keyBuf: ReadBuf): I64

  // ---------------------------------------------------------------------------
  // STO (Serialized Transaction Object)
  // ---------------------------------------------------------------------------

  export function sto_subfield(buf: ReadBuf, fieldId: I32): I64
  export function sto_subarray(buf: ReadBuf, arrayId: I32): I64
  export function sto_validate(buf: ReadBuf): I64
  export function sto_emplace(outBuf: WriteBuf, stoBuf: ReadBuf, fieldBuf: ReadBuf, fieldId: I32): I64
  export function sto_erase(outBuf: WriteBuf, stoBuf: ReadBuf, fieldId: I32): I64

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  export function util_keylet(
    outBuf: WriteBuf,
    type: I32,
    a?: I32, b?: I32, c?: I32, d?: I32, e?: I32, f?: I32
  ): I64
  export function util_sha512h(outBuf: WriteBuf, inputBuf: ReadBuf): I64
  export function util_accid(outBuf: WriteBuf, raddr: string): I64
  export function util_raddr(outBuf: WriteBuf, accidBuf: ReadBuf): I64
  export function util_verify(sigBuf: ReadBuf, dataBuf: ReadBuf, pubkeyBuf: ReadBuf): I64

  // ---------------------------------------------------------------------------
  // XFL (Xahau Floating-point Library)
  // ---------------------------------------------------------------------------

  export function float_one(): I64
  export function float_set(exponent: I32, mantissa: I64): I64
  export function float_multiply(a: I64, b: I64): I64
  export function float_divide(a: I64, b: I64): I64
  export function float_sum(a: I64, b: I64): I64
  export function float_negate(a: I64): I64
  export function float_invert(a: I64): I64
  export function float_compare(a: I64, b: I64, mode: 'EQ' | 'NE' | 'LT' | 'GT' | 'LE' | 'GE'): I64
  export function float_mantissa(a: I64): I64
  export function float_sign(a: I64): I64
  export function float_int(a: I64, decimalPlaces?: I32, absolute?: I32): I64
  export function float_log(f: I64): I64
  export function float_root(f: I64, n: I32): I64
  export function float_mulratio(f: I64, roundUp: I32, numerator: I32, denominator: I32): I64
  export function float_sto(
    outBuf: WriteBuf,
    currencyBuf: ReadBuf,
    issuerBuf: ReadBuf,
    xfl: I64,
    fieldCode: I32
  ): I64
  export function float_sto_set(buf: ReadBuf): I64

  // ---------------------------------------------------------------------------
  // Scratch buffer helpers
  // ---------------------------------------------------------------------------

  /** Returns the scratch buffer start offset (512). */
  export const SCRATCH_PTR: I32
  /** Returns the scratch buffer size (512). */
  export const SCRATCH_LEN: I32

}
