/**
 * Tests for PTR.ARRAY → byte-sequence conversion in hookValArgs:
 * state_set accepts numeric arrays and hex-string arrays, resolving them
 * statically to i32.const arguments (no runtime allocation).
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

// ── helpers ───────────────────────────────────────────────────────────────

function hookWat(src) {
  return compile(src, { host: 'hook', wat: true, jzify: true })
}

// ── numeric array [0xde, 0xad, 0xbe, 0xef] ───────────────────────────────

test('hook/state-set-bytes: numeric array resolves to call $hook_state_set', () => {
  const wat = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set([0xde, 0xad, 0xbe, 0xef], 'k') }
  `)
  ok(
    wat.includes('call $hook_state_set'),
    'WAT should contain call $hook_state_set for numeric array arg'
  )
})

test('hook/state-set-bytes: numeric array uses only i32.const args (no runtime ops)', () => {
  const wat = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set([0xde, 0xad, 0xbe, 0xef], 'k') }
  `)
  ok(!wat.includes('local.tee'), 'WAT should not contain local.tee — args are static')
  ok(!wat.includes('i64.reinterpret'), 'WAT should not contain i64.reinterpret — no XFL boxing')
  // All four params (ptr, len, kptr, klen) must be i32.const — they appear after call $hook_state_set
  const callIdx = wat.indexOf('call $hook_state_set')
  const after = wat.slice(callIdx, callIdx + 200)
  const constCount = (after.match(/\(i32\.const /g) || []).length
  ok(constCount >= 4, `WAT should have at least 4 i32.const after the call keyword (got ${constCount})`)
})

// ── hex string array ['DE', 'AD', 'BE', 'EF'] ────────────────────────────

test('hook/state-set-bytes: hex string array resolves to call $hook_state_set', () => {
  const wat = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set(['DE', 'AD', 'BE', 'EF'], 'k') }
  `)
  ok(
    wat.includes('call $hook_state_set'),
    'WAT should contain call $hook_state_set for hex string array arg'
  )
})

test('hook/state-set-bytes: hex string array uses only i32.const args (no runtime ops)', () => {
  const wat = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set(['DE', 'AD', 'BE', 'EF'], 'k') }
  `)
  ok(!wat.includes('local.tee'), 'WAT should not contain local.tee — args are static')
  ok(!wat.includes('i64.reinterpret'), 'WAT should not contain i64.reinterpret — no XFL boxing')
  // All four params (ptr, len, kptr, klen) must be i32.const — they appear after call $hook_state_set
  const callIdx = wat.indexOf('call $hook_state_set')
  const after = wat.slice(callIdx, callIdx + 200)
  const constCount = (after.match(/\(i32\.const /g) || []).length
  ok(constCount >= 4, `WAT should have at least 4 i32.const after the call keyword (got ${constCount})`)
})

// ── byte length parity ────────────────────────────────────────────────────

test('hook/state-set-bytes: numeric array and hex string array both produce len=4', () => {
  const watNum = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set([0xde, 0xad, 0xbe, 0xef], 'k') }
  `)
  const watHex = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set(['DE', 'AD', 'BE', 'EF'], 'k') }
  `)
  ok(
    watNum.includes('(i32.const 4)'),
    'numeric array WAT should contain (i32.const 4) for len=4'
  )
  ok(
    watHex.includes('(i32.const 4)'),
    'hex string array WAT should contain (i32.const 4) for len=4'
  )
})

// ── empty array ───────────────────────────────────────────────────────────

test('hook/state-set-bytes: empty array [] compiles without error', () => {
  let threw = false
  try {
    hookWat(`
      import { state_set } from 'hook'
      export let hook = () => { state_set([], 'k') }
    `)
  } catch (e) {
    threw = true
    ok(false, `should not throw: ${e.message}`)
  }
  ok(!threw, 'state_set([], key) should compile without error')
})

// ── string regression ─────────────────────────────────────────────────────

test('hook/state-set-bytes: string value still resolves statically (regression)', () => {
  const wat = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set('value', 'k') }
  `)
  ok(
    wat.includes('call $hook_state_set'),
    'WAT should contain call $hook_state_set for string arg'
  )
  ok(!wat.includes('local.tee'), 'string WAT should not contain local.tee — static resolution')
})

// ── no __alloc_hdr for array byte patterns ────────────────────────────────

test('hook/state-set-bytes: numeric and hex arrays do not call __alloc_hdr', () => {
  const watNum = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set([0xde, 0xad, 0xbe, 0xef], 'k') }
  `)
  const watHex = hookWat(`
    import { state_set } from 'hook'
    export let hook = () => { state_set(['DE', 'AD', 'BE', 'EF'], 'k') }
  `)
  ok(
    !watNum.includes('__alloc_hdr'),
    'numeric array WAT should not call __alloc_hdr — bytes are static'
  )
  ok(
    !watHex.includes('__alloc_hdr'),
    'hex string array WAT should not call __alloc_hdr — bytes are static'
  )
})
