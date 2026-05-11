/**
 * Firewall hook — reads the originating transaction's sfAccount field and
 * rejects the hook execution if the field cannot be read.
 * Demonstrates: otxn_field, sfAccount constant, conditional rollback via throw.
 *
 * Notes:
 *   - otxn_field(buf, field_id) writes the field bytes into `buf` and returns
 *     the number of bytes written, or a negative error code on failure.
 *   - sfAccount is inlined as an i32 constant (0x8001 = 32769) at compile time.
 *   - `throw "msg"` lowers to call $hook_rollback + unreachable in hook mode.
 *   - A 26-byte buffer is enough for an AccountID (20 bytes).
 *
 * Compile:
 *   node cli.js --host hook --wat samples/hook-firewall.js -o -
 *   node cli.js --host hook samples/hook-firewall.js -o samples/hook-firewall.wasm
 */
import { otxn_field, sfAccount } from 'hook'

// 26-byte output buffer for the AccountID field (20 bytes needed)
let buf = 'xxxxxxxxxxxxxxxxxxxxxxxxxx'

export let hook = () => {
  let r = otxn_field(buf, sfAccount)
  if (r < 0) throw "could not read sender"
  return "accepted"
}

export let cbak = () => 0
