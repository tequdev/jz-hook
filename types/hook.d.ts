/**
 * Type declarations for the jz `'hook'` virtual module.
 *
 * These are compile-time stubs consumed by the jz compiler (--host hook).
 * They are NOT real runtime imports — jz lowers each call to the
 * corresponding Xahau Hook WASM host import.
 *
 * Setup — add to tsconfig.json:
 *   "compilerOptions": {
 *     "paths": { "hook": ["./node_modules/jz-hook/types/hook"] }
 *   }
 *
 * Or with triple-slash reference at the top of your hook source file:
 *   /// <reference types="jz-hook/types/hook" />
 */

declare module 'hook' {

  // ---------------------------------------------------------------------------
  // Primitive aliases (documentation only — jz maps these to WASM value types)
  // ---------------------------------------------------------------------------

  /** i64 value: XFL floats, ledger amounts, return codes, API results. */
  type I64 = bigint
  /** i32 value: field codes, slot numbers, counts, boolean flags. */
  type I32 = number
  /** Mutable byte buffer. jz string literals double as fixed-size memory buffers. */
  type Buf = string

  // ---------------------------------------------------------------------------
  // Control
  // ---------------------------------------------------------------------------

  /** Accept the originating transaction. msg is returned in the metadata. */
  export function accept(msg: Buf, code?: I64): I64
  /** Reject the originating transaction. */
  export function rollback(msg: Buf, code?: I64): I64

  // ---------------------------------------------------------------------------
  // Tracing
  // ---------------------------------------------------------------------------

  export function trace(label: string, data: Buf, ashex?: I32): I64
  export function trace_num(label: string, num: I64): I64
  export function trace_float(label: string, xfl: I64): I64

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  export function state(outBuf: Buf, key: Buf): I64
  export function state_set(valBuf: Buf, key: Buf): I64
  export function state_foreign(outBuf: Buf, key: Buf, namespaceBuf: Buf, accountBuf: Buf): I64
  export function state_foreign_set(valBuf: Buf, key: Buf, namespaceBuf: Buf, accountBuf: Buf): I64

  // ---------------------------------------------------------------------------
  // Originating transaction fields
  // ---------------------------------------------------------------------------

  /** Read sfField into scratch (no buf arg) or into outBuf. */
  export function otxn_field(sfField: I32): I64
  export function otxn_field(outBuf: Buf, sfField: I32): I64
  export function otxn_slot(slot: I32): I64
  export function otxn_id(writePtr: I32, writeLen: I32, flags?: I32): I64
  export function otxn_type(): I64
  export function otxn_burden(): I64

  // ---------------------------------------------------------------------------
  // Emitted transaction
  // ---------------------------------------------------------------------------

  export function etxn_reserve(count: I32): I64
  export function etxn_burden(): I64
  export function etxn_generation(): I64
  export function etxn_fee_base(txBuf: Buf): I64
  export function etxn_nonce(writePtr?: I32, writeLen?: I32): I64
  export function etxn_details(outBuf: Buf): I64
  export function emit(outBuf: Buf, txBuf: Buf): I64

  // ---------------------------------------------------------------------------
  // Slots
  // ---------------------------------------------------------------------------

  export function slot(slotNo: I32): I64
  export function slot(outBuf: Buf, slotNo: I32): I64
  export function slot_clear(slot: I32): I64
  export function slot_count(slot: I32): I64
  export function slot_size(slot: I32): I64
  export function slot_float(slot: I32): I64
  export function slot_id(outBuf: Buf, slotNo: I32): I64
  export function slot_set(buf: Buf, slotNo: I32): I64
  export function slot_subfield(parent: I32, fieldId: I32, newSlot: I32): I64
  export function slot_subarray(parent: I32, arrayId: I32, newSlot: I32): I64
  export function slot_type(slotNo: I32, flags?: I32): I64
  export function meta_slot(slot: I32): I64
  export function xpop_slot(slotIn: I32, slotOut: I32): I64

  // ---------------------------------------------------------------------------
  // Ledger
  // ---------------------------------------------------------------------------

  export function ledger_last_hash(writePtr?: I32, writeLen?: I32): I64
  export function ledger_last_time(): I64
  export function ledger_nonce(writePtr?: I32, writeLen?: I32): I64
  export function ledger_seq(): I64
  export function ledger_keylet(
    writePtr: I32, writeLen: I32,
    keyletType: I32,
    r1Ptr: I32, r1Len: I32,
    r2Ptr: I32, r2Len: I32
  ): I64

  // ---------------------------------------------------------------------------
  // Hook metadata
  // ---------------------------------------------------------------------------

  export function hook_account(writePtr?: I32, writeLen?: I32): I64
  export function hook_pos(): I64
  export function hook_again(): I64
  export function hook_skip(numHooks: I32, name: I32): I64
  export function hook_param(writePtr: I32, writeLen: I32, readPtr: I32, readLen: I32): I64
  export function hook_param_set(
    writePtr: I32, writeLen: I32,
    readPtr: I32, readLen: I32,
    kReadPtr: I32, kReadLen: I32
  ): I64

  // ---------------------------------------------------------------------------
  // STO (Serialized Transaction Object)
  // ---------------------------------------------------------------------------

  export function sto_subfield(buf: Buf, fieldId: I32): I64
  export function sto_subarray(buf: Buf, arrayId: I32): I64
  export function sto_validate(buf: Buf): I64
  export function sto_emplace(
    writePtr: I32, writeLen: I32,
    sReadPtr: I32, sReadLen: I32,
    fReadPtr: I32, fReadLen: I32,
    fieldId: I32
  ): I64
  export function sto_erase(
    writePtr: I32, writeLen: I32,
    sReadPtr: I32, sReadLen: I32,
    fieldId: I32
  ): I64

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  export function util_keylet(
    outBuf: Buf,
    type: I32,
    a?: I32, b?: I32, c?: I32, d?: I32, e?: I32, f?: I32
  ): I64
  export function util_sha512h(outBuf: Buf, inputBuf: Buf): I64
  export function util_accid(outBuf: Buf, raddr: string): I64
  export function util_raddr(outBuf: Buf, accidBuf: Buf): I64
  export function util_verify(sigBuf: Buf, dataBuf: Buf, pubkeyBuf: Buf): I64
  export function util_encode(
    writePtr: I32, writeLen: I32,
    readPtr: I32, readLen: I32,
    type: I32
  ): I64
  export function util_decode(
    writePtr: I32, writeLen: I32,
    readPtr: I32, readLen: I32,
    type: I32
  ): I64

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
  export function float_compare(a: I64, b: I64, mode?: I32): I64
  export function float_mantissa(a: I64): I64
  export function float_sign(a: I64): I64
  export function float_exponent(a: I64): I64
  export function float_exponent_set(a: I64, exponent: I32): I64
  export function float_mantissa_set(a: I64, mantissa: I64): I64
  export function float_int(a: I64, decimalPlaces?: I32, absolute?: I32): I64
  export function float_log(f: I64): I64
  export function float_root(f: I64, n: I32): I64
  export function float_mulratio(f: I64, roundUp: I32, numerator: I32, denominator: I32): I64
  export function float_sto(
    outBuf: Buf,
    currencyBuf: Buf,
    issuerBuf: Buf,
    xfl: I64,
    fieldCode: I32
  ): I64
  export function float_sto_set(buf: Buf): I64

  // ---------------------------------------------------------------------------
  // Scratch buffer helpers
  // ---------------------------------------------------------------------------

  /** Returns the scratch buffer start offset (512). */
  export const SCRATCH_PTR: I32
  /** Returns the scratch buffer size (512). */
  export const SCRATCH_LEN: I32

  // ---------------------------------------------------------------------------
  // Keylet helpers
  // ---------------------------------------------------------------------------

  export function keylet_account(outBuf: Buf, accountBuf: Buf): I64
  export function keylet_hook(outBuf: Buf, accountBuf: Buf): I64
  export function keylet_hook_state(outBuf: Buf, accountBuf: Buf, stateKeyBuf: Buf): I64
  export function keylet_signers(outBuf: Buf, accountBuf: Buf): I64
  export function keylet_ownerdir(outBuf: Buf, accountBuf: Buf): I64
  export function keylet_line(outBuf: Buf, accountBuf: Buf, issuerBuf: Buf): I64
  export function keylet_offer(outBuf: Buf, accountBuf: Buf, sequenceBuf: Buf): I64
  export function keylet_check(outBuf: Buf, accountBuf: Buf, checkIdBuf: Buf): I64
  export function keylet_quality(outBuf: Buf, qualityBuf: Buf, firstBuf: Buf): I64
  export function keylet_paychan(outBuf: Buf, accountBuf: Buf, dstAccountBuf: Buf): I64
  export function keylet_deposit_preauth(outBuf: Buf, accountBuf: Buf, authAccountBuf: Buf): I64
  export function keylet_trustline(outBuf: Buf, accountBuf: Buf, issuerBuf: Buf): I64

  // ---------------------------------------------------------------------------
  // SField codes (lowered to i32 constants at compile time)
  // ---------------------------------------------------------------------------

  export const sfInvalid: I32
  export const sfGeneric: I32
  export const sfLedgerEntry: I32
  export const sfTransaction: I32
  export const sfValidation: I32
  export const sfMetadata: I32
  export const sfUInt16: I32
  export const sfUInt32: I32
  export const sfUInt64: I32
  export const sfHash128: I32
  export const sfHash256: I32
  export const sfAmount: I32
  export const sfCurrency: I32
  export const sfHash160: I32
  export const sfBlob: I32
  export const sfAccountID: I32
  export const sfSTObject: I32
  export const sfSTArray: I32
  export const sfCloseTime: I32
  export const sfParentCloseTime: I32
  export const sfSigningTime: I32
  export const sfExpiration: I32
  export const sfTransferRate: I32
  export const sfQualityIn: I32
  export const sfQualityOut: I32
  export const sfLowQualityIn: I32
  export const sfLowQualityOut: I32
  export const sfLedgerSequence: I32
  export const sfIndexNext: I32
  export const sfIndexPrevious: I32
  export const sfOwnerCount: I32
  export const sfDestinationTag: I32
  export const sfSourceTag: I32
  export const sfSequence: I32
  export const sfLastLedgerSequence: I32
  export const sfFlags: I32
  export const sfTransactionType: I32
  export const sfAccount: I32
  export const sfOwner: I32
  export const sfDestination: I32
  export const sfIssuer: I32
  export const sfAuthorize: I32
  export const sfUnauthorize: I32
  export const sfTakerPays: I32
  export const sfTakerGets: I32
  export const sfLowLimit: I32
  export const sfHighLimit: I32
  export const sfFee: I32
  export const sfSendMax: I32
  export const sfDeliverMin: I32
  export const sfDeliveredAmount: I32
  export const sfBalance: I32
  export const sfLimitAmount: I32
  export const sfSigningPubKey: I32
  export const sfTxnSignature: I32
  export const sfDomain: I32
  export const sfEmailHash: I32
  export const sfMessageKey: I32
  export const sfTransactionHash: I32
  export const sfNFTokenID: I32

  // ---------------------------------------------------------------------------
  // Keylet type constants (lowered to i32 constants at compile time)
  // ---------------------------------------------------------------------------

  export const KEYLET_HOOK: I32
  export const KEYLET_HOOK_STATE: I32
  export const KEYLET_ACCOUNT: I32
  export const KEYLET_AMENDMENTS: I32
  export const KEYLET_CHILD: I32
  export const KEYLET_SKIP: I32
  export const KEYLET_LEDGER_HASHES: I32
  export const KEYLET_UNCHECKED: I32
  export const KEYLET_OWNERDIR: I32
  export const KEYLET_PAGE: I32
  export const KEYLET_QUALITY: I32
  export const KEYLET_OFFER: I32
  export const KEYLET_CHECK: I32
  export const KEYLET_DEPOSIT_PREAUTH: I32
  export const KEYLET_UNCHECKED_DEPOSIT_PREAUTH: I32
  export const KEYLET_TRUSTLINE: I32
  export const KEYLET_LINE: I32
  export const KEYLET_PAYCHAN: I32
  export const KEYLET_SIGNERS: I32
  export const KEYLET_NFT_OFFER: I32
  export const KEYLET_EMITTED_DIR: I32
  export const KEYLET_EMITTED_TXN: I32
  export const KEYLET_NFTOKEN_MINT: I32
}
