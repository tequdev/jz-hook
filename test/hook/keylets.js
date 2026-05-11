/**
 * sfcode constants test: sfAccount and similar constants from module/hook/keylets.js
 * should be inlined as compile-time constants (no runtime call).
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

test('hook/keylets: sfAccount is inlined as a constant', () => {
  const wat = compile(`
import { sfAccount } from 'hook'
export let hook = () => sfAccount
`, { host: 'hook', wat: true, jzify: true })
  // The constant (0x8001 = 32769) must appear inline — no function call.
  // In jz, integer constants are represented as f64 or i32 depending on context.
  ok(
    wat.includes('f64.const') || wat.includes('i32.const') || wat.includes('i64.const'),
    `expected an inlined numeric constant in WAT, got:\n${wat}`
  )
  // Must not contain a call instruction for sfAccount (it should be a compile-time const)
  ok(!wat.includes('call $sfAccount'), `sfAccount should be inlined, not called, got:\n${wat}`)
})

test('hook/keylets: sfAccount value is 0x8001 = 32769', () => {
  const wat = compile(`
import { sfAccount } from 'hook'
export let hook = () => sfAccount
`, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('32769'), `expected 32769 (0x8001) in WAT, got:\n${wat}`)
})
