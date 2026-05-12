/**
 * Minimal hook test: verify a trivial `export let hook = () => "OK"` compiles
 * to valid hook WAT with the expected export and wrapper function.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

test('hook/hello: compiles without error', () => {
  let wat
  let threw = false
  try {
    wat = compile(`export let hook = () => "OK"`, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = true
    ok(false, `should not throw: ${e.message}`)
  }
  ok(!threw, 'should compile without error')
})

test('hook/hello: WAT contains (export "hook")', () => {
  const wat = compile(`export let hook = () => "OK"`, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('(export "hook")'), `expected (export "hook") in WAT, got:\n${wat}`)
})

test('hook/hello: hook export has (param i32) (result i64) signature — no wrapper', () => {
  const wat = compile(`export let hook = () => "OK"`, { host: 'hook', wat: true, jzify: true })
  // $hook is mutated in-place: no separate $__hook_export_hook wrapper
  ok(!wat.includes('$__hook_export_hook'), `unexpected wrapper $__hook_export_hook in WAT`)
  // The exported $hook function itself must carry the i32 param and i64 result
  ok(
    wat.includes('(param $reserved i32)') || wat.includes('(param i32)'),
    `expected (param i32) in $hook, got:\n${wat}`
  )
  ok(wat.includes('(result i64)'), `expected (result i64) in $hook, got:\n${wat}`)
})
