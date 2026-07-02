/**
 * Xahau transaction-type (tt*) and Hook API error-code constants for Hook development.
 * Usage: import { ttPAYMENT, ttINVOKE, DOESNT_EXIST } from 'hook'
 * Each constant is lowered to an i32.const at compile time (identical to how a plain
 * numeric literal is emitted in hook mode). Error codes are negative; in hook mode
 * asI64 sign-extends i32→i64, so they compare directly against i64 Hook API return
 * values (e.g. `state(...) == DOESNT_EXIST`).
 *
 * Values verified against the canonical Xahau sources:
 *   - tt*: hook/tts.h and include/xrpl/protocol/detail/transactions.macro (github.com/Xahau/xahaud)
 *   - error codes: hook/error.h (github.com/Xahau/xahaud)
 */
import { typed } from '../../src/ir.js'

// Transaction types (Xahau tts.h / transactions.macro). Naming matches the C headers.
export const TT_CODES = {
  ttPAYMENT: 0,
  ttESCROW_CREATE: 1,
  ttESCROW_FINISH: 2,
  ttACCOUNT_SET: 3,
  ttESCROW_CANCEL: 4,
  ttREGULAR_KEY_SET: 5,
  ttOFFER_CREATE: 7,
  ttOFFER_CANCEL: 8,
  ttTICKET_CREATE: 10,
  ttSIGNER_LIST_SET: 12,
  ttPAYCHAN_CREATE: 13,
  ttPAYCHAN_FUND: 14,
  ttPAYCHAN_CLAIM: 15,
  ttCHECK_CREATE: 16,
  ttCHECK_CASH: 17,
  ttCHECK_CANCEL: 18,
  ttDEPOSIT_PREAUTH: 19,
  ttTRUST_SET: 20,
  ttACCOUNT_DELETE: 21,
  ttHOOK_SET: 22,
  ttNFTOKEN_MINT: 25,
  ttNFTOKEN_BURN: 26,
  ttNFTOKEN_CREATE_OFFER: 27,
  ttNFTOKEN_CANCEL_OFFER: 28,
  ttNFTOKEN_ACCEPT_OFFER: 29,
  ttCLAWBACK: 30,
  ttAMM_CLAWBACK: 31,
  ttAMM_CREATE: 35,
  ttAMM_DEPOSIT: 36,
  ttAMM_WITHDRAW: 37,
  ttAMM_VOTE: 38,
  ttAMM_BID: 39,
  ttAMM_DELETE: 40,
  ttURITOKEN_MINT: 45,
  ttURITOKEN_BURN: 46,
  ttURITOKEN_BUY: 47,
  ttURITOKEN_CREATE_SELL_OFFER: 48,
  ttURITOKEN_CANCEL_SELL_OFFER: 49,
  ttXCHAIN_CREATE_CLAIM_ID: 50,
  ttXCHAIN_COMMIT: 51,
  ttXCHAIN_CLAIM: 52,
  ttXCHAIN_ACCOUNT_CREATE_COMMIT: 53,
  ttXCHAIN_ADD_CLAIM_ATTESTATION: 54,
  ttXCHAIN_ADD_ACCOUNT_CREATE_ATTESTATION: 55,
  ttXCHAIN_MODIFY_BRIDGE: 56,
  ttXCHAIN_CREATE_BRIDGE: 57,
  ttDID_SET: 58,
  ttDID_DELETE: 59,
  ttORACLE_SET: 60,
  ttORACLE_DELETE: 61,
  ttLEDGER_STATE_FIX: 62,
  ttMPTOKEN_ISSUANCE_CREATE: 63,
  ttMPTOKEN_ISSUANCE_DESTROY: 64,
  ttMPTOKEN_ISSUANCE_SET: 65,
  ttMPTOKEN_AUTHORIZE: 66,
  ttCREDENTIAL_CREATE: 67,
  ttCREDENTIAL_ACCEPT: 68,
  ttCREDENTIAL_DELETE: 69,
  ttNFTOKEN_MODIFY: 70,
  ttPERMISSIONED_DOMAIN_SET: 71,
  ttPERMISSIONED_DOMAIN_DELETE: 72,
  ttCRON: 92,
  ttCRON_SET: 93,
  ttREMARKS_SET: 94,
  ttREMIT: 95,
  ttGENESIS_MINT: 96,
  ttIMPORT: 97,
  ttCLAIM_REWARD: 98,
  ttINVOKE: 99,
  ttAMENDMENT: 100,
  ttFEE: 101,
  ttUNL_MODIFY: 102,
  ttEMIT_FAILURE: 103,
  ttUNL_REPORT: 104,
}

// Hook API error codes (Xahau hook/error.h). Returned as negative i64 values by API calls.
export const ERROR_CODES = {
  SUCCESS: 0,
  OUT_OF_BOUNDS: -1,
  INTERNAL_ERROR: -2,
  TOO_BIG: -3,
  TOO_SMALL: -4,
  DOESNT_EXIST: -5,
  NO_FREE_SLOTS: -6,
  INVALID_ARGUMENT: -7,
  ALREADY_SET: -8,
  PREREQUISITE_NOT_MET: -9,
  FEE_TOO_LARGE: -10,
  EMISSION_FAILURE: -11,
  TOO_MANY_NONCES: -12,
  TOO_MANY_EMITTED_TXN: -13,
  NOT_IMPLEMENTED: -14,
  INVALID_ACCOUNT: -15,
  GUARD_VIOLATION: -16,
  INVALID_FIELD: -17,
  PARSE_ERROR: -18,
  RC_ROLLBACK: -19,
  RC_ACCEPT: -20,
  NO_SUCH_KEYLET: -21,
  NOT_AN_ARRAY: -22,
  NOT_AN_OBJECT: -23,
  INVALID_FLOAT: -10024,
  DIVISION_BY_ZERO: -25,
  MANTISSA_OVERSIZED: -26,
  MANTISSA_UNDERSIZED: -27,
  EXPONENT_OVERSIZED: -28,
  EXPONENT_UNDERSIZED: -29,
  XFL_OVERFLOW: -30,
  NOT_IOU_AMOUNT: -31,
  NOT_AN_AMOUNT: -32,
  CANT_RETURN_NEGATIVE: -33,
  NOT_AUTHORIZED: -34,
  PREVIOUS_FAILURE_PREVENTS_RETRY: -35,
  TOO_MANY_PARAMS: -36,
  INVALID_TXN: -37,
  RESERVE_INSUFFICIENT: -38,
  COMPLEX_NOT_SUPPORTED: -39,
  DOES_NOT_MATCH: -40,
  INVALID_KEY: -41,
  NOT_A_STRING: -42,
  MEM_OVERLAP: -43,
  TOO_MANY_STATE_MODIFICATIONS: -44,
  TOO_MANY_NAMESPACES: -45,
}

export default (ctx) => {
  // Register all tt* and error-code names as compile-time i32 constants.
  for (const [name, val] of Object.entries(TT_CODES)) {
    ctx.core.emit[`hook.${name}`] = () => typed(['i32.const', val], 'i32')
  }
  for (const [name, val] of Object.entries(ERROR_CODES)) {
    ctx.core.emit[`hook.${name}`] = () => typed(['i32.const', val], 'i32')
  }
}
