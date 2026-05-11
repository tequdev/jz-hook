/**
 * XFL arithmetic demo hook.
 * Demonstrates: float_one, float_sum, float_multiply, float_int operations.
 *
 * Computes 2 * 2 = 4 using XFL (Xahau Floating-point Library) arithmetic
 * and returns the integer result via float_int.
 *
 * Notes:
 *   - float_one() → XFL encoding of 1.0
 *   - float_sum(a, b) → XFL addition
 *   - float_multiply(a, b) → XFL multiplication
 *   - float_int(xfl, decimal_places, absolute) → i64 integer
 *   - All XFL values are i64 (passed/returned as i64 in WASM)
 *
 * Compile:
 *   node cli.js --host hook --wat samples/hook-xfl.js -o -
 *   node cli.js --host hook samples/hook-xfl.js -o samples/hook-xfl.wasm
 */
import { float_one, float_multiply, float_sum, float_int } from 'hook'

export let hook = () => {
  let one = float_one()
  let two = float_sum(one, one)
  let four = float_multiply(two, two)
  // float_int(xfl, decimal_places, absolute) → i64 integer value
  let n = float_int(four, 0, 0)
  return n
}

export let cbak = () => 0
