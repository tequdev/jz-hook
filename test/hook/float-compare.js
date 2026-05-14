/**
 * float_compare test: each valid mode compiles, invalid mode and missing mode throw.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

const validSrc = (mode) => `
import { float_one, float_compare } from 'hook'
export let hook = () => {
  let one = float_one()
  return float_compare(one, one, '${mode}')
}
`

const invalidModeSrc = `
import { float_one, float_compare } from 'hook'
export let hook = () => {
  let one = float_one()
  return float_compare(one, one, 'INVALID')
}
`

const missingModeSrc = `
import { float_one, float_compare } from 'hook'
export let hook = () => {
  let one = float_one()
  return float_compare(one, one)
}
`

for (const mode of ['EQ', 'NE', 'LT', 'GT', 'LE', 'GE']) {
  test(`hook/float-compare: mode '${mode}' compiles without throwing`, () => {
    let threw = false
    try {
      compile(validSrc(mode), { host: 'hook', wat: true, jzify: true })
    } catch (e) {
      threw = true
      ok(false, `should not throw for mode '${mode}': ${e.message}`)
    }
    ok(!threw, `mode '${mode}' should compile without error`)
  })
}

test('hook/float-compare: WAT contains float_compare import', () => {
  const wat = compile(validSrc('EQ'), { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('"float_compare"'), `expected float_compare import in WAT, got:\n${wat}`)
})

test('hook/float-compare: WAT calls $hook_float_compare', () => {
  const wat = compile(validSrc('EQ'), { host: 'hook', wat: true, jzify: true })
  ok(wat.includes('call $hook_float_compare'), `expected call $hook_float_compare in WAT, got:\n${wat}`)
})

test('hook/float-compare: invalid mode throws at compile time', () => {
  let threw = false
  let msg = ''
  try {
    compile(invalidModeSrc, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = true
    msg = e.message
  }
  ok(threw, 'should throw for invalid mode')
  ok(msg.includes('float_compare'), `error message should mention float_compare, got: ${msg}`)
})

test('hook/float-compare: missing mode throws at compile time', () => {
  let threw = false
  let msg = ''
  try {
    compile(missingModeSrc, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = true
    msg = e.message
  }
  ok(threw, 'should throw for missing mode')
  ok(msg.includes('float_compare'), `error message should mention float_compare, got: ${msg}`)
})
