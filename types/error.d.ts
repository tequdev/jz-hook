/**
 * Xahau Hook API error-code constants for Hook development.
 * Usage: import { DOESNT_EXIST, NO_FREE_SLOTS } from 'hook'
 * Each constant is lowered to an i32 constant at compile time; in hook mode it is
 * sign-extended to i64 when compared against i64 Hook API return values.
 *
 * Merged into the `hook` namespace via declaration merging (like sfcode.d.ts /
 * keylet.d.ts). package.json "./types" points only at hook.d.ts; a tsconfig with
 * `"types": ["...node_modules/jz/types/*"]` (or an explicit path include of the
 * types directory) picks up this file alongside the others in the same namespace.
 */
declare namespace hook {
  // ---------------------------------------------------------------------------
  // Hook API error codes (lowered to i32 constants at compile time)
  // ---------------------------------------------------------------------------
  export const SUCCESS: I32
  export const OUT_OF_BOUNDS: I32
  export const INTERNAL_ERROR: I32
  export const TOO_BIG: I32
  export const TOO_SMALL: I32
  export const DOESNT_EXIST: I32
  export const NO_FREE_SLOTS: I32
  export const INVALID_ARGUMENT: I32
  export const ALREADY_SET: I32
  export const PREREQUISITE_NOT_MET: I32
  export const FEE_TOO_LARGE: I32
  export const EMISSION_FAILURE: I32
  export const TOO_MANY_NONCES: I32
  export const TOO_MANY_EMITTED_TXN: I32
  export const NOT_IMPLEMENTED: I32
  export const INVALID_ACCOUNT: I32
  export const GUARD_VIOLATION: I32
  export const INVALID_FIELD: I32
  export const PARSE_ERROR: I32
  export const RC_ROLLBACK: I32
  export const RC_ACCEPT: I32
  export const NO_SUCH_KEYLET: I32
  export const NOT_AN_ARRAY: I32
  export const NOT_AN_OBJECT: I32
  export const INVALID_FLOAT: I32
  export const DIVISION_BY_ZERO: I32
  export const MANTISSA_OVERSIZED: I32
  export const MANTISSA_UNDERSIZED: I32
  export const EXPONENT_OVERSIZED: I32
  export const EXPONENT_UNDERSIZED: I32
  export const XFL_OVERFLOW: I32
  export const NOT_IOU_AMOUNT: I32
  export const NOT_AN_AMOUNT: I32
  export const CANT_RETURN_NEGATIVE: I32
  export const NOT_AUTHORIZED: I32
  export const PREVIOUS_FAILURE_PREVENTS_RETRY: I32
  export const TOO_MANY_PARAMS: I32
  export const INVALID_TXN: I32
  export const RESERVE_INSUFFICIENT: I32
  export const COMPLEX_NOT_SUPPORTED: I32
  export const DOES_NOT_MATCH: I32
  export const INVALID_KEY: I32
  export const NOT_A_STRING: I32
  export const MEM_OVERLAP: I32
  export const TOO_MANY_STATE_MODIFICATIONS: I32
  export const TOO_MANY_NAMESPACES: I32
}
