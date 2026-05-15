/**
 * Tests for static Array optimization in hook mode:
 * `new Array(N)` with literal integer N should be pre-allocated in the data
 * segment and NaN-boxed as `i64.const` — no runtime `__alloc_hdr` call.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

// ── helpers ───────────────────────────────────────────────────────────────

function hookWat(src) {
  return compile(src, { host: 'hook', wat: true, jzify: true })
}

// ── new Array(4) → i64.const, no __alloc_hdr ─────────────────────────────

test('hook/array-static: new Array(4) compiles without error', () => {
  let threw = false
  try {
    hookWat('export let hook = () => { let a = new Array(4); return a }')
  } catch (e) {
    threw = true
    ok(false, `should not throw: ${e.message}`)
  }
  ok(!threw, 'new Array(4) should compile in hook mode')
})

test('hook/array-static: new Array(4) uses i64.const (static allocation)', () => {
  const wat = hookWat('export let hook = () => { let a = new Array(4); return a }')
  ok(wat.includes('i64.const'), 'WAT should contain i64.const for static NaN-box')
})

test('hook/array-static: new Array(4) does not call __alloc_hdr', () => {
  const wat = hookWat('export let hook = () => { let a = new Array(4); return a }')
  ok(!wat.includes('__alloc_hdr'), 'WAT should not contain __alloc_hdr — static arrays skip runtime allocator')
})

test('hook/array-static: new Array(4) NaN-box has 0x7FF88 prefix', () => {
  const wat = hookWat('export let hook = () => { let a = new Array(4); return a }')
  console.log(wat)
  ok(
    /i64\.const 0x7FF88/i.test(wat),
    'NaN-box value should start with 0x7FF88 (PTR.ARRAY tag)'
  )
})

// ── new Array(0) → also static ────────────────────────────────────────────

test('hook/array-static: new Array(0) compiles without error', () => {
  let threw = false
  try {
    hookWat('export let hook = () => { let a = new Array(0); return a }')
  } catch (e) {
    threw = true
    ok(false, `should not throw: ${e.message}`)
  }
  ok(!threw, 'new Array(0) should compile in hook mode')
})

test('hook/array-static: new Array(0) uses i64.const (static allocation)', () => {
  const wat = hookWat('export let hook = () => { let a = new Array(0); return a }')
  ok(wat.includes('i64.const'), 'WAT should contain i64.const even for empty static array')
})

test('hook/array-static: new Array(0) does not call __alloc_hdr', () => {
  const wat = hookWat('export let hook = () => { let a = new Array(0); return a }')
  ok(!wat.includes('__alloc_hdr'), 'WAT should not call __alloc_hdr for empty static array')
})

// ── variable-length new Array(n) → runtime allocator ─────────────────────

test('hook/array-static: new Array(Math.abs(1)) calls __alloc_hdr (runtime path)', () => {
  // Math.abs(1) prevents constant folding so the compiler sees a non-literal size
  const wat = hookWat('export let hook = () => { let n = Math.abs(1); let a = new Array(n); return a }')
  ok(wat.includes('__alloc_hdr'), 'variable-length Array should fall back to __alloc_hdr at runtime')
})

// ── non-hook mode (wasi) → runtime allocator ──────────────────────────────

test('hook/array-static: new Array(4) in wasi mode calls __alloc_hdr (no static opt)', () => {
  const wat = compile(
    'export let hook = () => { let a = new Array(4); return a }',
    { host: 'wasi', wat: true, jzify: true }
  )
  ok(wat.includes('__alloc_hdr'), 'wasi mode should NOT apply static-array optimization')
})
