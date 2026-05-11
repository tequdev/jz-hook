/**
 * State counter hook — demonstrates state read/write API.
 * Each time this hook fires, it reads a counter from hook state and accepts
 * with the current count (or 0 if not yet set).
 *
 * Notes:
 *   - state(out_buf, key) reads state into `out_buf` using `key` as the slot key.
 *     Returns bytes written on success, or a negative error code if not found.
 *   - state_set(val_buf, key) writes `val_buf` into the state slot named `key`.
 *     Returns 0 on success.
 *   - String literals are used as fixed-size buffers: 'xxxx' is a 4-byte buffer
 *     suitable for storing a u32 counter value.
 *   - The key must be a fixed string; here we use 'CNTR' (4 bytes).
 *     In production you'd use a 32-byte padded key.
 *
 * Compile:
 *   node cli.js --host hook --wat samples/hook-state-counter.js -o -
 *   node cli.js --host hook samples/hook-state-counter.js -o samples/hook-state-counter.wasm
 */
import { state, state_set } from 'hook'

// 4-byte mutable buffer for the counter value (will hold a u32)
let val = 'xxxx'

// State slot key — 4-byte fixed string identifier
let key = 'CNTR'

export let hook = () => {
  // Read current counter from hook state into val buffer.
  // Returns number of bytes read on success, negative error code if key doesn't exist.
  let r = state(val, key)

  // Write the value back to state (demonstrating state_set round-trip).
  // In a real counter hook you'd increment val in memory first.
  state_set(val, key)

  // Accept with the state read result as the return code.
  // If state was empty (first invocation), r is a negative error code.
  return r
}

export let cbak = () => 0
