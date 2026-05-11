/**
 * samples test: all sample Hook files compile to valid WASM within size limits.
 * Each sample must compile without error and produce a non-empty binary ≤65535 bytes.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { readFileSync } from 'fs'
import { compile } from '../../index.js'

const SAMPLE_NAMES = ['hook-accept', 'hook-firewall', 'hook-xfl']

for (const name of SAMPLE_NAMES) {
  test(`hook/samples: ${name}.js compiles without error`, () => {
    const src = readFileSync(`samples/${name}.js`, 'utf8')
    let result
    let threw = false
    try {
      result = compile(src, { host: 'hook', jzify: true })
    } catch (e) {
      threw = true
      ok(false, `${name}.js should not throw: ${e.message}`)
    }
    ok(!threw, `${name}.js should compile without error`)
  })

  test(`hook/samples: ${name}.wasm is non-empty`, () => {
    const src = readFileSync(`samples/${name}.js`, 'utf8')
    const result = compile(src, { host: 'hook', jzify: true })
    ok(result.byteLength > 0, `${name}.wasm should not be empty, got ${result.byteLength} bytes`)
  })

  test(`hook/samples: ${name}.wasm is ≤65535 bytes`, () => {
    const src = readFileSync(`samples/${name}.js`, 'utf8')
    const result = compile(src, { host: 'hook', jzify: true })
    ok(
      result.byteLength <= 65535,
      `${name}.wasm should be ≤65535 bytes, got ${result.byteLength}`
    )
  })
}
