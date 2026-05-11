/**
 * Validation test: a module without `export let hook` must throw a
 * compile-time error in hook mode.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

test('hook/validate-missing-hook: missing hook export throws error', () => {
  let threw = false
  try {
    compile(`export let foo = () => 1`, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = e.message.includes('hook')
  }
  ok(threw, 'missing hook export should throw a compile error mentioning "hook"')
})
