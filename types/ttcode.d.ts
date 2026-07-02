/**
 * Xahau transaction-type (tt*) constants for Hook development.
 * Usage: import { ttPAYMENT, ttINVOKE } from 'hook'
 * Each constant is lowered to an i32 constant at compile time.
 *
 * Merged into the `hook` namespace via declaration merging (like sfcode.d.ts /
 * keylet.d.ts). package.json "./types" points only at hook.d.ts; a tsconfig with
 * `"types": ["...node_modules/jz/types/*"]` (or an explicit path include of the
 * types directory) picks up this file alongside the others in the same namespace.
 */
declare namespace hook {
  // ---------------------------------------------------------------------------
  // Transaction types (lowered to i32 constants at compile time)
  // ---------------------------------------------------------------------------
  export const ttPAYMENT: I32
  export const ttESCROW_CREATE: I32
  export const ttESCROW_FINISH: I32
  export const ttACCOUNT_SET: I32
  export const ttESCROW_CANCEL: I32
  export const ttREGULAR_KEY_SET: I32
  export const ttOFFER_CREATE: I32
  export const ttOFFER_CANCEL: I32
  export const ttTICKET_CREATE: I32
  export const ttSIGNER_LIST_SET: I32
  export const ttPAYCHAN_CREATE: I32
  export const ttPAYCHAN_FUND: I32
  export const ttPAYCHAN_CLAIM: I32
  export const ttCHECK_CREATE: I32
  export const ttCHECK_CASH: I32
  export const ttCHECK_CANCEL: I32
  export const ttDEPOSIT_PREAUTH: I32
  export const ttTRUST_SET: I32
  export const ttACCOUNT_DELETE: I32
  export const ttHOOK_SET: I32
  export const ttNFTOKEN_MINT: I32
  export const ttNFTOKEN_BURN: I32
  export const ttNFTOKEN_CREATE_OFFER: I32
  export const ttNFTOKEN_CANCEL_OFFER: I32
  export const ttNFTOKEN_ACCEPT_OFFER: I32
  export const ttCLAWBACK: I32
  export const ttAMM_CLAWBACK: I32
  export const ttAMM_CREATE: I32
  export const ttAMM_DEPOSIT: I32
  export const ttAMM_WITHDRAW: I32
  export const ttAMM_VOTE: I32
  export const ttAMM_BID: I32
  export const ttAMM_DELETE: I32
  export const ttURITOKEN_MINT: I32
  export const ttURITOKEN_BURN: I32
  export const ttURITOKEN_BUY: I32
  export const ttURITOKEN_CREATE_SELL_OFFER: I32
  export const ttURITOKEN_CANCEL_SELL_OFFER: I32
  export const ttXCHAIN_CREATE_CLAIM_ID: I32
  export const ttXCHAIN_COMMIT: I32
  export const ttXCHAIN_CLAIM: I32
  export const ttXCHAIN_ACCOUNT_CREATE_COMMIT: I32
  export const ttXCHAIN_ADD_CLAIM_ATTESTATION: I32
  export const ttXCHAIN_ADD_ACCOUNT_CREATE_ATTESTATION: I32
  export const ttXCHAIN_MODIFY_BRIDGE: I32
  export const ttXCHAIN_CREATE_BRIDGE: I32
  export const ttDID_SET: I32
  export const ttDID_DELETE: I32
  export const ttORACLE_SET: I32
  export const ttORACLE_DELETE: I32
  export const ttLEDGER_STATE_FIX: I32
  export const ttMPTOKEN_ISSUANCE_CREATE: I32
  export const ttMPTOKEN_ISSUANCE_DESTROY: I32
  export const ttMPTOKEN_ISSUANCE_SET: I32
  export const ttMPTOKEN_AUTHORIZE: I32
  export const ttCREDENTIAL_CREATE: I32
  export const ttCREDENTIAL_ACCEPT: I32
  export const ttCREDENTIAL_DELETE: I32
  export const ttNFTOKEN_MODIFY: I32
  export const ttPERMISSIONED_DOMAIN_SET: I32
  export const ttPERMISSIONED_DOMAIN_DELETE: I32
  export const ttCRON: I32
  export const ttCRON_SET: I32
  export const ttREMARKS_SET: I32
  export const ttREMIT: I32
  export const ttGENESIS_MINT: I32
  export const ttIMPORT: I32
  export const ttCLAIM_REWARD: I32
  export const ttINVOKE: I32
  export const ttAMENDMENT: I32
  export const ttFEE: I32
  export const ttUNL_MODIFY: I32
  export const ttEMIT_FAILURE: I32
  export const ttUNL_REPORT: I32
}
