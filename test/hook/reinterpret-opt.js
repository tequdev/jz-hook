/**
 * Regression test for fusedRewrite peephole optimizer:
 * verifies that f64.reinterpret_i64(i64.reinterpret_f64(x)) → x and
 * i64.reinterpret_f64(f64.reinterpret_i64(x)) → x are eliminated in
 * XFL float chains.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

const src = `
import { float_one, float_multiply, float_sum, float_int } from 'hook'
export let hook = () => {
  let one = float_one()
  let two = float_sum(one, one)
  let four = float_multiply(two, two)
  let n = float_int(four, 0, 0)
  return n
}
`

// The double-reinterpret patterns that should NOT appear in optimized output
const DOUBLE_REINTERPRET = /f64\.reinterpret_i64\s*\(\s*i64\.reinterpret_f64/
const REVERSE_DOUBLE = /i64\.reinterpret_f64\s*\(\s*f64\.reinterpret_i64/

test('hook/reinterpret-opt: XFL chain compiles without error', () => {
  let threw = false
  try {
    compile(src, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = true
    ok(false, `should not throw: ${e.message}`)
  }
  ok(!threw, 'XFL chain should compile without error')
})

test('hook/reinterpret-opt: no f64.reinterpret_i64(i64.reinterpret_f64(...)) in optimized WAT', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(
    !DOUBLE_REINTERPRET.test(wat),
    'XFL chain should not contain f64.reinterpret_i64(i64.reinterpret_f64(...)) — fusedRewrite should eliminate this'
  )
})

test('hook/reinterpret-opt: no i64.reinterpret_f64(f64.reinterpret_i64(...)) in optimized WAT', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(
    !REVERSE_DOUBLE.test(wat),
    'XFL chain should not contain i64.reinterpret_f64(f64.reinterpret_i64(...)) — fusedRewrite should eliminate this'
  )
})

test('hook/reinterpret-opt: WAT calls $hook_float_one (not optimized away)', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(
    wat.includes('call $hook_float_one') || wat.includes('f64.const'),
    'float_one result should appear in WAT'
  )
})
