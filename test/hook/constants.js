/**
 * tt* transaction-type and Hook API error-code constants (module/hook/constants.js)
 * should be inlined as compile-time constants (no runtime call).
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

const compileHook = src => compile(src, { host: 'hook', wat: true, jzify: true })

test('hook/constants: ttINVOKE is inlined as constant 99', () => {
  const wat = compileHook(`
import { ttINVOKE } from 'hook'
export let hook = () => ttINVOKE
`)
  ok(wat.includes('99'), `expected 99 (ttINVOKE) in WAT, got:\n${wat}`)
  ok(!wat.includes('call $ttINVOKE'), `ttINVOKE should be inlined, not called, got:\n${wat}`)
})

test('hook/constants: ttPAYMENT is 0', () => {
  const wat = compileHook(`
import { ttPAYMENT } from 'hook'
export let hook = () => ttPAYMENT
`)
  ok(wat.includes('i32.const 0') || wat.includes('i64.const 0'),
    `expected a zero constant (ttPAYMENT) in WAT, got:\n${wat}`)
})

test('hook/constants: ttREMIT is 95', () => {
  const wat = compileHook(`
import { ttREMIT } from 'hook'
export let hook = () => ttREMIT
`)
  ok(wat.includes('95'), `expected 95 (ttREMIT) in WAT, got:\n${wat}`)
})

test('hook/constants: DOESNT_EXIST is -5', () => {
  const wat = compileHook(`
import { DOESNT_EXIST } from 'hook'
export let hook = () => DOESNT_EXIST
`)
  ok(wat.includes('-5'), `expected -5 (DOESNT_EXIST) in WAT, got:\n${wat}`)
  ok(!wat.includes('call $DOESNT_EXIST'), `DOESNT_EXIST should be inlined, not called, got:\n${wat}`)
})

test('hook/constants: INVALID_FLOAT is -10024', () => {
  const wat = compileHook(`
import { INVALID_FLOAT } from 'hook'
export let hook = () => INVALID_FLOAT
`)
  ok(wat.includes('-10024'), `expected -10024 (INVALID_FLOAT) in WAT, got:\n${wat}`)
})

test('hook/constants: error code compares against i64 API return', () => {
  // otxn_type() returns i64; comparing against a tt* constant must compile cleanly.
  const wat = compileHook(`
import { otxn_type, ttINVOKE, accept, DOESNT_EXIST } from 'hook'
export let hook = () => {
  if (otxn_type() == ttINVOKE) { accept('ok', 0) }
  return DOESNT_EXIST
}
`)
  ok(wat.includes('99'), `expected ttINVOKE (99) in comparison WAT, got:\n${wat}`)
})
