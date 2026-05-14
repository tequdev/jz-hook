/**
 * Tests for JS idiom → Hook API mapping correctness.
 *
 * Verifies that when host:'hook' is set, these idioms compile correctly:
 *   - console.log("msg", val) → hook_trace (ptr, len, ...)
 *   - console.log(n) (number) → hook_trace_num
 *   - Date.now() → hook_ledger_last_time() + 946684800
 *   - Math.random() → compile-time error
 */
import test from 'tst'
import { ok, same } from 'tst/assert.js'
const equal = (a, b, msg) => same(a, b, msg)
import { compile } from '../../index.js'

// ---------------------------------------------------------------------------
// WAT-level checks
// ---------------------------------------------------------------------------

test('hook/idiom-map: console.log(string) → WAT contains hook_trace, NOT __print', () => {
  const wat = compile(
    `export let hook = () => { console.log('hello'); return "ok" }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('hook_trace'), `expected hook_trace in WAT, got:\n${wat}`)
  ok(!wat.includes('__print'), `expected no __print in WAT, got:\n${wat}`)
})

test('hook/idiom-map: console.log(number) → WAT contains hook_trace_num, NOT __print', () => {
  const wat = compile(
    `export let hook = () => { console.log(42); return "ok" }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('hook_trace_num'), `expected hook_trace_num in WAT, got:\n${wat}`)
  ok(!wat.includes('__print'), `expected no __print in WAT, got:\n${wat}`)
})

test('hook/idiom-map: Date.now() → WAT contains hook_ledger_last_time AND 946684800', () => {
  const wat = compile(
    `export let hook = () => { return Date.now() }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('hook_ledger_last_time'), `expected hook_ledger_last_time in WAT, got:\n${wat}`)
  ok(wat.includes('946684800'), `expected 946684800 (Ripple epoch offset) in WAT, got:\n${wat}`)
})

test('hook/idiom-map: Math.random() in hook → throws compile-time error', () => {
  let threw = false
  let msg = ''
  try {
    compile(
      `export let hook = () => { return Math.random() }`,
      { host: 'hook', wat: true, jzify: true }
    )
  } catch (e) {
    threw = true
    msg = e.message || String(e)
  }
  ok(threw, 'expected compile to throw for Math.random() in hook mode')
  ok(msg.toLowerCase().includes('random'), `expected error message to mention random, got: ${msg}`)
})

// ---------------------------------------------------------------------------
// E2E checks
// ---------------------------------------------------------------------------

function mockImports(overrides = {}) {
  const base = {
    _g: (id, max) => 1,
    accept: (ptr, len, code) => {
      throw Object.assign(new Error('accept'), { type: 'accept', ptr, len, code })
    },
    rollback: (ptr, len, code) => {
      throw Object.assign(new Error('rollback'), { type: 'rollback', ptr, len, code })
    },
  }
  const merged = { ...base, ...overrides }
  return {
    env: new Proxy(merged, {
      get(obj, key) {
        if (key in obj) return obj[key]
        return () => 0n
      },
    }),
  }
}

async function hookInstance(src, envOverrides = {}) {
  const wasm = compile(src, { host: 'hook', jzify: true })
  const { instance } = await WebAssembly.instantiate(wasm, mockImports(envOverrides))
  return instance
}

async function runHook(src, envOverrides = {}) {
  const instance = await hookInstance(src, envOverrides)
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type === 'accept' || e.type === 'rollback') return e
    throw e
  }
  return null
}

test('hook/idiom-map e2e: console.log(42) → trace_num called with value 42n', async () => {
  let capturedValue = null
  await runHook(
    `export let hook = () => { console.log(42); return "ok" }`,
    {
      trace_num: (labelPtr, labelLen, value) => {
        capturedValue = value
        return 0n
      },
    }
  )
  ok(capturedValue != null, 'trace_num() should have been called')
  equal(capturedValue, 42n, `expected value=42n, got ${capturedValue}`)
})

test('hook/idiom-map e2e: console.log("hi") → trace called with len=2', async () => {
  let capturedDataLen = null
  await runHook(
    `export let hook = () => { console.log('hi'); return "ok" }`,
    {
      trace: (labelPtr, labelLen, dataPtr, dataLen, asHex) => {
        capturedDataLen = dataLen
        return 0n
      },
    }
  )
  ok(capturedDataLen != null, 'trace() should have been called')
  equal(capturedDataLen, 2, `expected data len=2 for "hi", got ${capturedDataLen}`)
})

test('hook/idiom-map e2e: Date.now() with ledger_last_time=0n → accept code=946684800n', async () => {
  let capturedCode = null
  await runHook(
    `export let hook = () => { return Date.now() }`,
    {
      ledger_last_time: () => 0n,
      accept: (ptr, len, code) => {
        capturedCode = code
        throw Object.assign(new Error('accept'), { type: 'accept', ptr, len, code })
      },
    }
  )
  ok(capturedCode != null, 'accept() should have been called')
  equal(capturedCode, 946684800n, `expected code=946684800n (Ripple epoch offset), got ${capturedCode}`)
})
