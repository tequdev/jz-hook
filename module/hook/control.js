/**
 * Hook control flow — Math.random() compile-time error.
 * accept/rollback emitters are registered in api.js.
 */
import { err } from '../../src/ctx.js'

export default (ctx) => {
  // Math.random() is non-deterministic — forbidden in hooks
  ctx.core.emit['Math.random'] = () => {
    err("Math.random() is not allowed in host:'hook' — use ledger_nonce() for randomness")
  }
  ctx.core.emit['math.random'] = ctx.core.emit['Math.random']
}
