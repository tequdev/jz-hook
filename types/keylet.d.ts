declare namespace hook {
  // ---------------------------------------------------------------------------
  // Keylet helpers
  // ---------------------------------------------------------------------------
  export function keylet_account(outBuf: WriteBuf, accountBuf: ReadBuf): I64
  export function keylet_hook(outBuf: WriteBuf, accountBuf: ReadBuf): I64
  export function keylet_hook_state(outBuf: WriteBuf, accountBuf: ReadBuf, stateKeyBuf: ReadBuf): I64
  export function keylet_signers(outBuf: WriteBuf, accountBuf: ReadBuf): I64
  export function keylet_ownerdir(outBuf: WriteBuf, accountBuf: ReadBuf): I64
  export function keylet_line(outBuf: WriteBuf, accountBuf: ReadBuf, issuerBuf: ReadBuf): I64
  export function keylet_offer(outBuf: WriteBuf, accountBuf: ReadBuf, sequenceBuf: ReadBuf): I64
  export function keylet_check(outBuf: WriteBuf, accountBuf: ReadBuf, checkIdBuf: ReadBuf): I64
  export function keylet_quality(outBuf: WriteBuf, qualityBuf: ReadBuf, firstBuf: ReadBuf): I64
  export function keylet_paychan(outBuf: WriteBuf, accountBuf: ReadBuf, dstAccountBuf: ReadBuf): I64
  export function keylet_deposit_preauth(outBuf: WriteBuf, accountBuf: ReadBuf, authAccountBuf: ReadBuf): I64
  export function keylet_trustline(outBuf: WriteBuf, accountBuf: ReadBuf, issuerBuf: ReadBuf): I64

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
