/**
 * keylet helper emitters test: keylet_account and friends lower to
 * call $hook_util_keylet with the correct fixed write_len (34) and
 * KEYLET_TYPE constant.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

const src = `
import { keylet_account, otxn_field, sfAccount } from 'hook'
let acc = 'xxxxxxxxxxxxxxxxxxxx'
export let hook = () => {
  let r = otxn_field(acc, sfAccount)
  let n = keylet_account(0, acc)
  return n
}
`

test('hook/keylets-helpers: compiles without error', () => {
  let threw = false
  try {
    compile(src, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = true
    ok(false, `should not throw: ${e.message}`)
  }
  ok(!threw, 'keylet_account hook should compile without error')
})

test('hook/keylets-helpers: WAT contains (import "env" "util_keylet")', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(
    wat.includes('(import "env" "util_keylet"'),
    `expected (import "env" "util_keylet") in WAT, got:\n${wat}`
  )
})

test('hook/keylets-helpers: WAT contains call $hook_util_keylet', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('call $hook_util_keylet'), `expected call $hook_util_keylet in WAT, got:\n${wat}`)
})

test('hook/keylets-helpers: WAT contains i32.const 34 (write_len for keylet)', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('i32.const 34'), `expected i32.const 34 (keylet write_len) in WAT, got:\n${wat}`)
})

test('hook/keylets-helpers: WAT contains KEYLET_ACCOUNT type constant (i32.const 3)', () => {
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('i32.const 3'), `expected i32.const 3 (KEYLET_ACCOUNT) in WAT, got:\n${wat}`)
})
