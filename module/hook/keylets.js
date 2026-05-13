/**
 * Xahau sfcodes and keylet type constants for Hook development.
 * Usage: import { sfAccount, sfDestination, KEYLET_ACCOUNT } from 'hook'
 * Each constant is lowered to an i32.const at compile time.
 */
import { asI32, asI64, typed } from '../../src/ir.js'
import { emit as emitNode } from '../../src/emit.js'

export const SF_CODES = {
  sfInvalid: -1,
  sfGeneric: 0,
  sfLedgerEntry: 0x0100,
  sfTransaction: 0x0200,
  sfValidation: 0x0300,
  sfMetadata: 0x0400,
  sfUInt16: 0x0002,
  sfUInt32: 0x0003,
  sfUInt64: 0x0004,
  sfHash128: 0x0005,
  sfHash256: 0x0006,
  sfAmount: 0x0060,
  sfCurrency: 0x0070,
  sfHash160: 0x0110,
  sfBlob: 0x0700,
  sfAccountID: 0x0800,
  sfSTObject: 0x0e00,
  sfSTArray: 0x0f00,
  sfCloseTime: 0x2102,
  sfParentCloseTime: 0x2103,
  sfSigningTime: 0x2104,
  sfExpiration: 0x2a02,
  sfTransferRate: 0x2a03,
  sfQualityIn: 0x2a04,
  sfQualityOut: 0x2a05,
  sfLowQualityIn: 0x2a06,
  sfLowQualityOut: 0x2a07,
  sfLedgerSequence: 0x2602,
  sfIndexNext: 0x6102,
  sfIndexPrevious: 0x6103,
  sfOwnerCount: 0x6104,
  sfDestinationTag: 0x2e02,
  sfSourceTag: 0x2e03,
  sfSequence: 0x2604,
  sfLastLedgerSequence: 0x2620,
  sfFlags: 0x2202,
  sfTransactionType: 0x0001,
  sfAccount: 0x8001,
  sfOwner: 0x8002,
  sfDestination: 0x8003,
  sfIssuer: 0x8004,
  sfAuthorize: 0x8007,
  sfUnauthorize: 0x8008,
  sfTakerPays: 0x6401,
  sfTakerGets: 0x6402,
  sfLowLimit: 0x6403,
  sfHighLimit: 0x6404,
  sfFee: 0x6408,
  sfSendMax: 0x6409,
  sfDeliverMin: 0x640a,
  sfDeliveredAmount: 0x6413,
  sfBalance: 0x6460,
  sfLimitAmount: 0x6462,
  sfSigningPubKey: 0x7301,
  sfTxnSignature: 0x7303,
  sfDomain: 0x7709,
  sfEmailHash: 0x0500,
  sfMessageKey: 0x710c,
  sfTransactionHash: 0x0501,
  sfNFTokenID: 0x0a02,
}

export const KEYLET_TYPES = {
  KEYLET_HOOK: 1,
  KEYLET_HOOK_STATE: 2,
  KEYLET_ACCOUNT: 3,
  KEYLET_AMENDMENTS: 4,
  KEYLET_CHILD: 5,
  KEYLET_SKIP: 6,
  KEYLET_LEDGER_HASHES: 7,
  KEYLET_UNCHECKED: 8,
  KEYLET_OWNERDIR: 9,
  KEYLET_PAGE: 10,
  KEYLET_QUALITY: 11,
  KEYLET_OFFER: 12,
  KEYLET_CHECK: 13,
  KEYLET_DEPOSIT_PREAUTH: 14,
  KEYLET_UNCHECKED_DEPOSIT_PREAUTH: 15,
  KEYLET_TRUSTLINE: 16,
  KEYLET_LINE: 17,
  KEYLET_PAYCHAN: 18,
  KEYLET_SIGNERS: 19,
  KEYLET_NFT_OFFER: 20,
  KEYLET_EMITTED_DIR: 21,
  KEYLET_EMITTED_TXN: 22,
  KEYLET_NFTOKEN_MINT: 23,
}

export default (ctx) => {
  // Extract the low 32 bits (heap ptr) from a NaN-boxed buffer/string or integer arg.
  // For buffers/strings: low 32 bits of i64 NaN-box = heap address.
  // For integer 0: i32.wrap_i64(i64.reinterpret_f64(0.0)) = 0.
  const eptr = (v) => typed(['i32.wrap_i64', asI64(emitNode(v))], 'i32')

  // Register all sfcodes as compile-time i32 constants
  for (const [name, val] of Object.entries(SF_CODES)) {
    ctx.core.emit[`hook.${name}`] = () => typed(['i32.const', val], 'i32')
  }

  // Register keylet type constants
  for (const [name, val] of Object.entries(KEYLET_TYPES)) {
    ctx.core.emit[`hook.${name}`] = () => typed(['i32.const', val], 'i32')
  }

  // High-level keylet helpers: keylet_*(out_buf_ptr, arg1_ptr[, arg2_ptr])
  // Each calls util_keylet with fixed-size args appropriate for the keylet type.
  // out_buf_ptr must point to a 34-byte writable buffer; returns i64 (34 = success).
  //
  // Spec: [jsName, KEYLET_TYPE value, requiresSecondArg, arg1Len, arg2Len]
  const KEYLET_SPECS = [
    // name,              type,                        twoArg, arg1Len, arg2Len
    ['account',    KEYLET_TYPES.KEYLET_ACCOUNT,        false,  20,  0],
    ['hook',       KEYLET_TYPES.KEYLET_HOOK,           false,  20,  0],
    ['hook_state', KEYLET_TYPES.KEYLET_HOOK_STATE,     true,   20, 32],
    ['line',       KEYLET_TYPES.KEYLET_LINE,           true,   20, 20],
    ['offer',      KEYLET_TYPES.KEYLET_OFFER,          true,   20,  4],
    ['check',      KEYLET_TYPES.KEYLET_CHECK,          true,   20,  4],
    ['quality',    KEYLET_TYPES.KEYLET_QUALITY,        true,   34,  8],
    ['paychan',    KEYLET_TYPES.KEYLET_PAYCHAN,        true,   20, 32],
    ['signers',    KEYLET_TYPES.KEYLET_SIGNERS,        false,  20,  0],
    ['ownerdir',   KEYLET_TYPES.KEYLET_OWNERDIR,       false,  20,  0],
    ['deposit_preauth', KEYLET_TYPES.KEYLET_DEPOSIT_PREAUTH, true, 20, 20],
    ['trustline',  KEYLET_TYPES.KEYLET_TRUSTLINE,      true,   20, 20],
  ]

  for (const [name, type, twoArg, arg1Len, arg2Len] of KEYLET_SPECS) {
    if (twoArg) {
      ctx.core.emit[`hook.keylet_${name}`] = (wPtr, arg1Ptr, arg2Ptr) =>
        typed(['call', '$hook_util_keylet',
          eptr(wPtr), ['i32.const', 34],
          ['i32.const', type],
          eptr(arg1Ptr), ['i32.const', arg1Len],
          eptr(arg2Ptr), ['i32.const', arg2Len],
          ['i32.const', 0], ['i32.const', 0]], 'i64')
    } else {
      ctx.core.emit[`hook.keylet_${name}`] = (wPtr, arg1Ptr) =>
        typed(['call', '$hook_util_keylet',
          eptr(wPtr), ['i32.const', 34],
          ['i32.const', type],
          eptr(arg1Ptr), ['i32.const', arg1Len],
          ['i32.const', 0], ['i32.const', 0],
          ['i32.const', 0], ['i32.const', 0]], 'i64')
    }
  }
}
