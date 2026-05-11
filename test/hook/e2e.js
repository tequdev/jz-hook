/**
 * E2E execution tests for compiled hook WASM binaries.
 *
 * Uses Node.js WebAssembly.instantiate with mock env imports to actually
 * execute compiled hooks and verify observable side-effects:
 *   - accept hook: returns a NaN-boxed string value directly
 *   - throw/rollback hook: mock env intercepts rollback() call
 *   - arithmetic loop hook: executes with _g guard mocks and returns numeric result
 *   - XFL hook: mock float_one/float_sum calls are dispatched correctly
 *
 * Mock env design:
 *   - _g(id: i32, max: i32) → i32  — always returns 1 (allow guard)
 *   - All other Hook API imports return 0n (i64/BigInt)
 *   - accept/rollback: throw a JS object so tests can intercept the call
 */
import test from 'tst'
import { ok, same } from 'tst/assert.js'
const equal = (a, b, msg) => same(a, b, msg)
import { compile } from '../../index.js'

/**
 * Build a mock env object for instantiating a hook WASM binary.
 * Merges custom overrides on top of safe defaults.
 *
 * @param {object} overrides - Override specific env functions.
 * @returns {WebAssembly.ModuleImports}
 */
function mockImports(overrides = {}) {
  const base = {
    _g: (id, max) => 1,   // (i32, i32) → i32
  }
  const merged = { ...base, ...overrides }
  return {
    env: new Proxy(merged, {
      get(obj, key) {
        if (key in obj) return obj[key]
        // Default: all other hook API functions return 0n (i64)
        return () => 0n
      },
    }),
  }
}

/**
 * Compile and instantiate a hook WASM binary with mock env imports.
 *
 * @param {string} src - jz source code
 * @param {object} envOverrides - Optional mock overrides for env imports
 * @returns {WebAssembly.Instance}
 */
async function hookInstance(src, envOverrides = {}) {
  const wasm = compile(src, { host: 'hook', jzify: true })
  const { instance } = await WebAssembly.instantiate(wasm, mockImports(envOverrides))
  return instance
}

// ---------------------------------------------------------------------------
// hook-accept: simple hook returning a string — no env imports needed
// ---------------------------------------------------------------------------
test('hook/e2e: hook-accept compiles and runs without env imports', async () => {
  const instance = await hookInstance(`export let hook = () => "OK"`)
  const result = instance.exports.hook(0)
  // Result is an i64 NaN-boxed string value
  ok(typeof result === 'bigint', `expected BigInt result, got ${typeof result}`)
})

test('hook/e2e: hook-accept returns NaN-boxed string tag=4 (STRING)', async () => {
  const instance = await hookInstance(`export let hook = () => "OK"`)
  const result = instance.exports.hook(0)
  // NaN-box layout: bits 50-47 = type tag, 4 = STRING
  const tag = Number((result >> 47n) & 0xFn)
  equal(tag, 4, `expected STRING tag (4), got ${tag}`)
})

test('hook/e2e: hook-accept "OK" returns SSO string of length 2', async () => {
  const instance = await hookInstance(`export let hook = () => "OK"`)
  const result = instance.exports.hook(0)
  // aux bits 46-32: SSO bit (14) set → inline string, length in bits 2-0
  const aux = Number((result >> 32n) & 0x7FFFn)
  const isSSO = !!(aux & 0x4000)
  const len = aux & 0x7
  ok(isSSO, `expected SSO string, aux=${aux.toString(16)}`)
  equal(len, 2, `expected length 2, got ${len}`)
})

// ---------------------------------------------------------------------------
// hook-loop: arithmetic loop with _g guard — no string operations
// ---------------------------------------------------------------------------
test('hook/e2e: hook-loop executes and returns correct sum', async () => {
  // The compiler constant-folds 0+1+2+3+4 = 10; guard not inserted for const iter
  const instance = await hookInstance(
    `export let hook = () => { let s = 0; for (let i = 0; i < 5; i++) s = s + i; return s }`
  )
  const result = instance.exports.hook(0)
  // Result is i64.reinterpret_f64(f64.convert_i32_s(10)) = f64(10.0) reinterpreted as i64
  const expected = new DataView(new Float64Array([10]).buffer).getBigUint64(0, true)
  equal(result, expected, `expected f64(10) as i64 = ${expected}, got ${result}`)
})

test('hook/e2e: hook-loop with dynamic bound calls _g guard', async () => {
  // Pass a runtime-dynamic bound through an intermediate function to prevent
  // constant-folding and keep the loop guard instrumentation alive.
  let guardCallCount = 0
  const instance = await hookInstance(
    `
      let sum = (n) => { let s = 0; for (let i = 0; i < n; i++) s = s + i; return s }
      export let hook = () => { let x = 5; return sum(x) }
    `,
    { _g: (id, max) => { guardCallCount++; return 1 } }
  )
  instance.exports.hook(0)
  ok(guardCallCount > 0, `expected _g to be called at least once, got ${guardCallCount} calls`)
})

// ---------------------------------------------------------------------------
// hook-throw: throw lowers to rollback() — mock intercepts the call
// ---------------------------------------------------------------------------
test('hook/e2e: hook-throw calls rollback() in mock env', async () => {
  let rollbackCalled = false
  const instance = await hookInstance(
    `export let hook = () => { throw "err" }`,
    {
      rollback: (ptr, len, code) => {
        rollbackCalled = true
        throw Object.assign(new Error('rollback'), { type: 'rollback', ptr, len, code })
      },
    }
  )
  try {
    instance.exports.hook(0)
    ok(false, 'hook should have triggered rollback')
  } catch (e) {
    ok(rollbackCalled, 'rollback() should have been called')
    equal(e.type, 'rollback', `expected rollback error, got: ${e.message}`)
  }
})

test('hook/e2e: hook-throw rollback() receives non-zero string length for "err"', async () => {
  let capturedLen = null
  const instance = await hookInstance(
    `export let hook = () => { throw "err" }`,
    {
      rollback: (ptr, len, code) => {
        capturedLen = len
        throw Object.assign(new Error('rollback'), { type: 'rollback' })
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'rollback') throw e
  }
  ok(capturedLen != null, 'rollback should have been called')
  ok(capturedLen > 0, `expected len > 0 for string "err", got ${capturedLen}`)
})

// ---------------------------------------------------------------------------
// hook-xfl: XFL float functions dispatch through mock imports
// ---------------------------------------------------------------------------
test('hook/e2e: hook-xfl calls float_one() and float_sum() via mock env', async () => {
  let floatOneCalls = 0
  let floatSumCalls = 0
  const instance = await hookInstance(
    `
      import { float_one, float_sum } from 'hook'
      export let hook = () => { let x = float_one(); return float_sum(x, x) }
    `,
    {
      float_one: () => { floatOneCalls++; return 1n },
      float_sum: (a, b) => { floatSumCalls++; return a + b },
    }
  )
  const result = instance.exports.hook(0)
  equal(floatOneCalls, 1, `expected 1 float_one call, got ${floatOneCalls}`)
  equal(floatSumCalls, 1, `expected 1 float_sum call, got ${floatSumCalls}`)
  // float_one returns 1n, float_sum(1n, 1n) = 2n → reinterpreted as f64 then i64 by wrapper
  ok(typeof result === 'bigint', `expected BigInt return from hook, got ${typeof result}`)
})

test('hook/e2e: hook-xfl result matches float_sum return value', async () => {
  // Use identity-like mocks: float_one returns a sentinel, float_sum adds args
  const SENTINEL = 42n
  const instance = await hookInstance(
    `
      import { float_one, float_sum } from 'hook'
      export let hook = () => { let x = float_one(); return float_sum(x, x) }
    `,
    {
      float_one: () => SENTINEL,
      float_sum: (a, b) => a + b,
    }
  )
  const result = instance.exports.hook(0)
  // float_sum(42n, 42n) = 84n; the hook wrapper does i64.reinterpret_f64(f64.reinterpret_i64(84n))
  // which is a round-trip for non-NaN values: 84n → f64(84n bits) → i64(same bits) = 84n
  equal(result, SENTINEL + SENTINEL, `expected ${SENTINEL + SENTINEL}, got ${result}`)
})
