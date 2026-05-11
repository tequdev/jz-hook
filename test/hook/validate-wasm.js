/**
 * wasm-validate integration test: verify that compiled hook binaries
 * pass the WebAssembly binary format validator.
 *
 * Uses /opt/homebrew/bin/wasm-validate (wabt) to validate each sample.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { execFileSync } from 'child_process'
import { writeFileSync } from 'fs'
import { compile } from '../../index.js'
import { tmpdir } from 'os'
import { join } from 'path'

const WASM_VALIDATE = '/opt/homebrew/bin/wasm-validate'

function validateBinary(src, name) {
  const wasm = compile(src, { host: 'hook', jzify: true })
  const tmpPath = join(tmpdir(), `jz-hook-${name}.wasm`)
  writeFileSync(tmpPath, wasm)
  try {
    execFileSync(WASM_VALIDATE, [tmpPath], { stdio: 'pipe' })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.stderr?.toString() || e.message }
  }
}

const SAMPLES = [
  {
    name: 'hook-accept',
    src: `export let hook = () => "OK"`,
  },
  {
    name: 'hook-loop',
    src: `export let hook = () => { let s = 0; for (let i = 0; i < 5; i++) s = s + i; return s }`,
  },
  {
    name: 'hook-throw',
    src: `export let hook = () => { throw "err" }`,
  },
  {
    name: 'hook-xfl',
    src: `
      import { float_one, float_sum } from 'hook'
      export let hook = () => { let x = float_one(); return float_sum(x, x) }
    `,
  },
]

for (const { name, src } of SAMPLES) {
  test(`hook/validate-wasm: ${name} passes wasm-validate`, () => {
    const result = validateBinary(src, name)
    ok(result.ok, `${name}: wasm-validate failed:\n${result.error}`)
  })
}
