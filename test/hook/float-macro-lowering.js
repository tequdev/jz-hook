/**
 * Regression test for the previously-missing Hook host functions
 * (hook_hash / fee_base / otxn_generation) and for the float_exponent /
 * float_exponent_set / float_mantissa_set "ghost bindings".
 *
 * The three float_* helpers are hookapi.h C macros, NOT host functions, so they
 * must NOT emit an env import or a `call $hook_float_*`. Instead they lower to
 * inline i64 bit ops. This test guards against the ghost bindings reappearing and
 * verifies the lowered bit ops match the canonical XFL macro semantics numerically.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

// === New host functions: correct import + call, no undeclared references ===

test('hook/float-macro-lowering: hook_hash / fee_base / otxn_generation import + call', () => {
  const src = `
import { hook_hash, fee_base, otxn_generation } from 'hook'
export let hook = () => { hook_hash(); return fee_base() + otxn_generation() }
`
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('"hook_hash"'), `expected hook_hash import, got:\n${wat}`)
  ok(wat.includes('"fee_base"'), `expected fee_base import, got:\n${wat}`)
  ok(wat.includes('"otxn_generation"'), `expected otxn_generation import, got:\n${wat}`)
  ok(wat.includes('call $hook_hook_hash'), 'expected call $hook_hook_hash')
  ok(wat.includes('call $hook_fee_base'), 'expected call $hook_fee_base')
  ok(wat.includes('call $hook_otxn_generation'), 'expected call $hook_otxn_generation')
})

test('hook/float-macro-lowering: hook_hash accepts hook_no', () => {
  const src = `
import { hook_hash } from 'hook'
export let hook = () => hook_hash(undefined, 2)
`
  let threw = false, msg = ''
  try { compile(src, { host: 'hook', wat: true, jzify: true }) }
  catch (e) { threw = true; msg = e.message }
  ok(!threw, `hook_hash(out, hook_no) should compile, got: ${msg}`)
})

// === Ghost binding regression: no undeclared host import / call ===

test('hook/float-macro-lowering: float macros emit no host import or call', () => {
  const src = `
import { float_exponent, float_exponent_set, float_mantissa_set } from 'hook'
export let hook = () => {
  let e = float_exponent(6198187654602866688n)
  let g = float_exponent_set(6198187654602866688n, 5)
  let m = float_mantissa_set(6198187654602866688n, 42n)
  return e + g + m
}
`
  const wat = compile(src, { host: 'hook', wat: true, jzify: true })
  for (const ghost of ['"float_exponent"', '"float_exponent_set"', '"float_mantissa_set"',
                       '$hook_float_exponent', '$hook_float_exponent_set', '$hook_float_mantissa_set']) {
    ok(!wat.includes(ghost), `ghost binding leaked into WAT: ${ghost}\n${wat}`)
  }
})

test('hook/float-macro-lowering: float macros produce a valid binary', () => {
  const src = `
import { float_exponent, float_exponent_set, float_mantissa_set } from 'hook'
export let hook = (f) => float_mantissa_set(float_exponent_set(f, float_exponent(f)), 1n)
`
  // compile() to binary throws if any call targets an undeclared function.
  let threw = false, msg = ''
  try { compile(src, { host: 'hook', jzify: true }) }
  catch (e) { threw = true; msg = e.message }
  ok(!threw, `float-macro binary should compile, got: ${msg}`)
})

// === Numeric verification against the canonical hookapi.h macro semantics ===
// XFL layout: bits 0-53 mantissa, bits 54-61 exponent (biased +97), bit 62 sign.

const ref = {
  float_exponent: (f) => BigInt.asIntN(64, ((f >> 54n) & 0xFFn) - 97n),
  float_exponent_set: (f, e) => BigInt.asIntN(64, (f & ~(0xFFn << 54n)) | (((e + 97n) & 0xFFn) << 54n)),
  float_mantissa_set: (f, m) => BigInt.asIntN(64, (f & ~((1n << 54n) - 1n)) | (m & ((1n << 54n) - 1n))),
}

// Run a `() => <expr>` hook and return the i64 value it accepts with.
async function runHookCode(expr) {
  const src = `import { float_exponent, float_exponent_set, float_mantissa_set } from 'hook'\nexport let hook = () => ${expr}\n`
  const bin = compile(src, { host: 'hook', jzify: true })
  const mod = await WebAssembly.compile(bin)
  const imports = {}
  let captured
  const STOP = Symbol('stop')
  for (const im of WebAssembly.Module.imports(mod)) {
    (imports[im.module] ||= {})[im.name] = () => 0n
  }
  imports.env._g = () => 1
  imports.env.accept = (_p, _l, code) => { captured = BigInt(code); const e = new Error('stop'); e.stop = STOP; throw e }
  const inst = await WebAssembly.instantiate(mod, imports)
  try { inst.exports.hook(0) } catch (e) { if (e.stop !== STOP) throw e }
  return captured
}

const F = 6198187654602866688n
const VECTORS = [
  ['float_exponent', `float_exponent(${F}n)`, ref.float_exponent(F)],
  ['float_exponent_set +5', `float_exponent_set(${F}n, 5)`, ref.float_exponent_set(F, 5n)],
  ['float_exponent_set -20', `float_exponent_set(${F}n, -20)`, ref.float_exponent_set(F, -20n)],
  ['float_exponent_set 0', `float_exponent_set(${F}n, 0)`, ref.float_exponent_set(F, 0n)],
  ['float_mantissa_set 42', `float_mantissa_set(${F}n, 42n)`, ref.float_mantissa_set(F, 42n)],
  ['float_mantissa_set max', `float_mantissa_set(${F}n, 9999999999999999n)`, ref.float_mantissa_set(F, 9999999999999999n)],
  ['float_mantissa_set 0', `float_mantissa_set(${F}n, 0n)`, ref.float_mantissa_set(F, 0n)],
]

for (const [label, expr, expected] of VECTORS) {
  test(`hook/float-macro-lowering: ${label} matches hookapi.h macro`, async () => {
    const got = await runHookCode(expr)
    ok(got === expected, `${label}: got ${got}, expected ${expected}`)
  })
}
