/**
 * Guard insertion test: verify a hook with a dynamic loop gets _g guard calls
 * inserted at the start of each loop body.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

test('hook/guard: loop body contains call $hook__g', () => {
  const wat = compile(
    `export let hook = (n) => { let s = 0; for (let i = 0; i < n; i++) s = s + i; return s }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('call $hook__g'), `expected call $hook__g in WAT, got:\n${wat}`)
})

test('hook/guard: _g is imported from env', () => {
  const wat = compile(
    `export let hook = (n) => { let s = 0; for (let i = 0; i < n; i++) s = s + i; return s }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('(import "env" "_g"'), `expected (import "env" "_g") in WAT, got:\n${wat}`)
})
