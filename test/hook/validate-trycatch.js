/**
 * Validation test: try/catch in hook mode must throw a compile-time error.
 * Hook executors do not support WASM exception handling instructions.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

test('hook/validate-trycatch: try/catch throws compile error', () => {
  let threw = false
  try {
    compile(
      `export let hook = () => { try { throw "x" } catch(e) { } }`,
      { host: 'hook', wat: true, jzify: true }
    )
  } catch (e) {
    threw = e.message.includes('try/catch')
  }
  ok(threw, 'try/catch should throw a compile error mentioning "try/catch" in hook mode')
})
