/**
 * XFL float operations test: float_one, float_sum, float_multiply, float_int
 * chain correctly in hook mode.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

const src = `
import { float_one, float_sum, float_multiply, float_int } from 'hook'
export let hook = () => {
  let one = float_one()
  let two = float_sum(one, one)
  let four = float_multiply(two, two)
  let n = float_int(four, 0, 0)
  return n
}
`

test('hook/xfl: compiles without error', () => {
  let threw = false
  try {
    compile(src, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = true
    ok(false, `should not throw: ${e.message}`)
  }
  ok(!threw, 'XFL chain should compile without error')
})

test('hook/xfl: WAT contains float_one import', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('"float_one"'), `expected float_one import in WAT, got:\n${wat}`)
})

test('hook/xfl: WAT contains float_sum import', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('"float_sum"'), `expected float_sum import in WAT, got:\n${wat}`)
})

test('hook/xfl: WAT contains float_multiply import', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('"float_multiply"'), `expected float_multiply import in WAT, got:\n${wat}`)
})

test('hook/xfl: WAT contains float_int import', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('"float_int"'), `expected float_int import in WAT, got:\n${wat}`)
})

test('hook/xfl: WAT calls $hook_float_one', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('call $hook_float_one'), `expected call $hook_float_one in WAT, got:\n${wat}`)
})

test('hook/xfl: WAT calls $hook_float_sum', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('call $hook_float_sum'), `expected call $hook_float_sum in WAT, got:\n${wat}`)
})

test('hook/xfl: WAT calls $hook_float_multiply', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('call $hook_float_multiply'), `expected call $hook_float_multiply in WAT, got:\n${wat}`)
})

test('hook/xfl: WAT calls $hook_float_int', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('call $hook_float_int'), `expected call $hook_float_int in WAT, got:\n${wat}`)
})
