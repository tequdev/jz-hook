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

test('hook/hello: WAT contains $__hook_export_hook wrapper', () => {
  const wat = compile(`export let hook = () => "OK"`, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('$__hook_export_hook'), `expected $__hook_export_hook in WAT, got:\n${wat}`)
})

test('hook/hello: hook export wrapper has (param i32) (result i64) signature', () => {
  const wat = compile(`export let hook = () => "OK"`, { host: 'hook', wat: true, jzify: true })
  // The wrapper function must accept i32 (reserved arg from executor) and return i64
  ok(
    wat.includes('(param $reserved i32)') || wat.includes('(param i32)'),
    `expected (param i32) in wrapper, got:\n${wat}`
  )
  ok(wat.includes('(result i64)'), `expected (result i64) in wrapper, got:\n${wat}`)
})
