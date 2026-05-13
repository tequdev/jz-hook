/**
 * accept/reject test: verify that `throw` in hook mode lowers to
 * `call $hook_rollback` followed by `unreachable`.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

test('hook/accept-reject: throw lowers to call $hook_rollback', () => {
  const wat = compile(
    `export let hook = () => { throw "err" }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('call $hook_rollback'), `expected call $hook_rollback in WAT, got:\n${wat}`)
})

test('hook/accept-reject: throw inserts unreachable after rollback', () => {
  const wat = compile(
    `export let hook = () => { throw "err" }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('unreachable'), `expected unreachable in WAT, got:\n${wat}`)
})

test('hook/accept-reject: return string lowers to call $hook_accept', () => {
  const wat = compile(
    `export let hook = () => { return "ok" }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('call $hook_accept'), `expected call $hook_accept in WAT, got:\n${wat}`)
})

test('hook/accept-reject: expression body lowers to call $hook_accept', () => {
  const wat = compile(
    `export let hook = () => "accepted"`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('call $hook_accept'), `expected call $hook_accept in WAT, got:\n${wat}`)
})

test('hook/accept-reject: cbak return 0 lowers to call $hook_accept', () => {
  const wat = compile(
    `export let hook = () => "ok"\nexport let cbak = () => 0`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('call $hook_accept'), `expected call $hook_accept in WAT, got:\n${wat}`)
})
