/**
 * E2E execution tests for compiled hook WASM binaries.
 *
 * Uses Node.js WebAssembly.instantiate with mock env imports to actually
 * execute compiled hooks and verify observable side-effects:
 *   - accept hook: mock intercepts accept() call and captures args
 *   - throw/rollback hook: mock env intercepts rollback() call
 *   - arithmetic loop hook: executes with _g guard mocks; accept() captures numeric code
 *   - XFL hook: mock float_one/float_sum calls are dispatched correctly
 *
 * Mock env design:
 *   - _g(id: i32, max: i32) → i32  — always returns 1 (allow guard)
 *   - accept/rollback: throw a JS object so tests can intercept the call
 *   - All other Hook API imports return 0n (i64/BigInt)
 *
 * NOTE: hook/cbak functions now always terminate via hook_accept + unreachable (or
 * hook_rollback + unreachable). The mock accept/rollback must throw to prevent the
 * WASM unreachable trap from firing.
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
    // Default accept: throw so WASM unreachable is never reached.
    // Tests that need to intercept accept() args override this.
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

/**
 * Run a hook and capture the accept() call args. Returns { ptr, len, code } from accept.
 * Throws if accept was not called.
 */
async function runHookCapturingAccept(src, envOverrides = {}) {
  let captured = null
  const overrides = {
    ...envOverrides,
    accept: (ptr, len, code) => {
      captured = { ptr, len, code }
      throw Object.assign(new Error('accept'), { type: 'accept', ptr, len, code })
    },
  }
  const instance = await hookInstance(src, overrides)
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  if (captured == null) throw new Error('accept() was not called')
  return { captured, instance }
}

// ---------------------------------------------------------------------------
// hook-accept: simple hook returning a string — accept() is called with ptr/len
// ---------------------------------------------------------------------------
test('hook/e2e: hook-accept compiles and accept() is called', async () => {
  let acceptCalled = false
  const instance = await hookInstance(`export let hook = () => "OK"`, {
    accept: (ptr, len, code) => {
      acceptCalled = true
      throw Object.assign(new Error('accept'), { type: 'accept' })
    },
  })
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  ok(acceptCalled, 'accept() should have been called')
})

test('hook/e2e: hook-accept accept() receives non-zero string length for "OK"', async () => {
  const { captured } = await runHookCapturingAccept(`export let hook = () => "OK"`)
  ok(captured.len > 0, `expected len > 0 for string "OK", got ${captured.len}`)
  equal(captured.len, 2, `expected len=2 for "OK", got ${captured.len}`)
})

test('hook/e2e: hook-accept "OK" memory has correct bytes at ptr', async () => {
  let capturedPtr = null
  let capturedMem = null
  const overrides = {
    accept: (ptr, len, code) => {
      capturedPtr = ptr
      throw Object.assign(new Error('accept'), { type: 'accept' })
    },
  }
  const instance = await hookInstance(`export let hook = () => "OK"`, overrides)
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  capturedMem = new Uint8Array(instance.exports.memory.buffer)
  ok(capturedPtr != null, 'accept should have been called')
  // data layout: mem[ptr-4..ptr-1] = LE u32 length, mem[ptr..] = UTF-8 bytes
  const ptr = capturedPtr
  const len = capturedMem[ptr-4] | (capturedMem[ptr-3]<<8) | (capturedMem[ptr-2]<<16) | (capturedMem[ptr-1]<<24)
  equal(len, 2, `expected length 2 at mem[ptr-4], got ${len}`)
  equal(capturedMem[ptr], 79, `expected 'O' (79) at mem[ptr], got ${capturedMem[ptr]}`)
  equal(capturedMem[ptr+1], 75, `expected 'K' (75) at mem[ptr+1], got ${capturedMem[ptr+1]}`)
})

// ---------------------------------------------------------------------------
// hook-loop: arithmetic loop with _g guard — accept() receives the numeric code
// ---------------------------------------------------------------------------
test('hook/e2e: hook-loop accept() receives correct sum as code', async () => {
  // The compiler constant-folds 0+1+2+3+4 = 10; guard not inserted for const iter
  const { captured } = await runHookCapturingAccept(
    `export let hook = () => { let s = 0; for (let i = 0; i < 5; i++) s = s + i; return s }`
  )
  // accept(ptr=0, len=0, code=10i64) — numeric return lowers to accept(0, 0, value)
  equal(captured.ptr, 0, `expected ptr=0 for numeric accept, got ${captured.ptr}`)
  equal(captured.len, 0, `expected len=0 for numeric accept, got ${captured.len}`)
  // code is i64 BigInt; the value 10 is passed as an i64
  ok(captured.code === 10n || Number(captured.code) === 10, `expected code=10, got ${captured.code}`)
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
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
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
  let acceptCalled = false
  const instance = await hookInstance(
    `
      import { float_one, float_sum } from 'hook'
      export let hook = () => { let x = float_one(); return float_sum(x, x) }
    `,
    {
      float_one: () => { floatOneCalls++; return 1n },
      float_sum: (a, b) => { floatSumCalls++; return a + b },
      accept: (ptr, len, code) => {
        acceptCalled = true
        throw Object.assign(new Error('accept'), { type: 'accept', code })
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  equal(floatOneCalls, 1, `expected 1 float_one call, got ${floatOneCalls}`)
  equal(floatSumCalls, 1, `expected 1 float_sum call, got ${floatSumCalls}`)
  ok(acceptCalled, `expected accept() to be called`)
})

test('hook/e2e: hook-xfl accept() receives float_sum return value as code', async () => {
  // Use identity-like mocks: float_one returns a sentinel, float_sum adds args
  const SENTINEL = 42n
  let capturedCode = null
  const instance = await hookInstance(
    `
      import { float_one, float_sum } from 'hook'
      export let hook = () => { let x = float_one(); return float_sum(x, x) }
    `,
    {
      float_one: () => SENTINEL,
      float_sum: (a, b) => a + b,
      accept: (ptr, len, code) => {
        capturedCode = code
        throw Object.assign(new Error('accept'), { type: 'accept' })
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  // float_sum(42n, 42n) = 84n passed as code to accept(0, 0, 84n)
  ok(capturedCode != null, 'accept() should have been called')
  equal(capturedCode, SENTINEL + SENTINEL, `expected code=${SENTINEL + SENTINEL}, got ${capturedCode}`)
})

// ---------------------------------------------------------------------------
// trace: label/data args len must reflect string byte length when label/data is a string
// ---------------------------------------------------------------------------
test('hook/e2e: trace(label, string, ashex) passes correct label len', async () => {
  let capturedLabelLen = null
  const instance = await hookInstance(
    `import { trace } from 'hook'; export let hook = () => { trace('ABCD', 'ABCD', false); return "ok" }`,
    {
      trace: (lPtr, lLen, dPtr, dLen, asHex) => {
        capturedLabelLen = lLen
        return 0n
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  ok(capturedLabelLen != null, 'trace() should have been called')
  equal(capturedLabelLen, 4, `expected label len=4 for "ABCD", got ${capturedLabelLen}`)
})

test('hook/e2e: trace(label, string, ashex) passes correct data len', async () => {
  let capturedDataLen = null
  const instance = await hookInstance(
    `import { trace } from 'hook'; export let hook = () => { trace('lbl', 'ABCD', false); return "ok" }`,
    {
      trace: (lPtr, lLen, dPtr, dLen, asHex) => {
        capturedDataLen = dLen
        return 0n
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  ok(capturedDataLen != null, 'trace() should have been called')
  equal(capturedDataLen, 4, `expected data len=4 for "ABCD", got ${capturedDataLen}`)
})

// ---------------------------------------------------------------------------
// state_set: string val arg — len must equal string byte length, not buf offset
// ---------------------------------------------------------------------------
test('hook/e2e: state_set(string, string) passes correct val len to state_set', async () => {
  let capturedValLen = null
  const instance = await hookInstance(
    `import { state_set } from 'hook'; export let hook = () => { state_set('DEADBEEF', '00123456'); return "ok" }`,
    {
      state_set: (vPtr, vLen, kPtr, kLen) => {
        capturedValLen = vLen
        return 0n
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  ok(capturedValLen != null, 'state_set() should have been called')
  equal(capturedValLen, 8, `expected val len=8 for "DEADBEEF", got ${capturedValLen}`)
})

// ---------------------------------------------------------------------------
// trace_hex / trace_utf8: helpers delegate to trace, not a separate import
// ---------------------------------------------------------------------------
test('hook/e2e: trace_hex(label, data) calls trace with as_hex=1', async () => {
  let capturedAsHex = null
  const instance = await hookInstance(
    `import { trace_hex } from 'hook'; export let hook = () => { trace_hex('lbl', 'data'); return "ok" }`,
    {
      trace: (lPtr, lLen, dPtr, dLen, asHex) => {
        capturedAsHex = asHex
        return 0n
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  ok(capturedAsHex != null, 'trace() should have been called (not a separate trace_hex import)')
  equal(capturedAsHex, 1, `expected as_hex=1 for trace_hex, got ${capturedAsHex}`)
})

test('hook/e2e: trace_utf8(label, data) calls trace with as_hex=0', async () => {
  let capturedAsHex = null
  const instance = await hookInstance(
    `import { trace_utf8 } from 'hook'; export let hook = () => { trace_utf8('lbl', 'data'); return "ok" }`,
    {
      trace: (lPtr, lLen, dPtr, dLen, asHex) => {
        capturedAsHex = asHex
        return 0n
      },
    }
  )
  try {
    instance.exports.hook(0)
  } catch (e) {
    if (e.type !== 'accept') throw e
  }
  ok(capturedAsHex != null, 'trace() should have been called (not a separate trace_utf8 import)')
  equal(capturedAsHex, 0, `expected as_hex=0 for trace_utf8, got ${capturedAsHex}`)
})

test('hook/e2e: trace_hex WAT has no trace_hex import — only trace', () => {
  const wat = compile(
    `import { trace_hex } from 'hook'; export let hook = () => { trace_hex('lbl', 'data'); return "ok" }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(!wat.includes('"trace_hex"'), `expected no trace_hex import in WAT, got:\n${wat}`)
  ok(wat.includes('"trace"'), `expected trace import in WAT, got:\n${wat}`)
})

test('hook/e2e: trace_utf8 WAT has no trace_utf8 import — only trace', () => {
  const wat = compile(
    `import { trace_utf8 } from 'hook'; export let hook = () => { trace_utf8('lbl', 'data'); return "ok" }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(!wat.includes('"trace_utf8"'), `expected no trace_utf8 import in WAT, got:\n${wat}`)
  ok(wat.includes('"trace"'), `expected trace import in WAT, got:\n${wat}`)
})
