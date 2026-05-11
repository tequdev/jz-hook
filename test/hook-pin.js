/**
 * Hook binary size regression guard.
 * Compiles all samples/ hook programs and asserts their WASM binary sizes
 * don't exceed established baselines by more than 10%.
 *
 * Baseline sizes are established empirically and represent the current best
 * achievable sizes with JZ's optimizer. A regression means either the
 * optimizer got worse or new overhead was accidentally added.
 *
 * Run: node test/hook-pin.js
 */
import { readFileSync } from 'fs'
import { compile } from '../index.js'
import assert from 'node:assert'

// Tolerance factor: fail if binary grows by more than this fraction
const TOLERANCE = 0.10  // 10%

// Baseline sizes (bytes) — established from the current build
// Update these when intentional size increases are made
const BASELINES = {
  'hook-accept':         108,
  'hook-firewall':       801,
  'hook-xfl':            215,
  'hook-state-counter':  710,
}

let pass = 0, fail = 0

for (const [name, baseline] of Object.entries(BASELINES)) {
  const src = readFileSync(`samples/${name}.js`, 'utf8')
  let result
  try {
    result = compile(src, { host: 'hook', jzify: true })
  } catch (e) {
    console.error(`✗ ${name}: compile error — ${e.message}`)
    fail++
    continue
  }

  const bytes = result.byteLength
  const limit = Math.ceil(baseline * (1 + TOLERANCE))
  const status = bytes <= limit ? '✓' : '✗'
  const diff = bytes - baseline
  const diffStr = diff === 0 ? '(no change)' : diff > 0 ? `(+${diff} bytes)` : `(${diff} bytes)`

  console.log(`${status} ${name}: ${bytes} bytes ${diffStr} [baseline: ${baseline}, limit: ${limit}]`)

  if (bytes <= limit) pass++
  else {
    console.error(`  REGRESSION: ${bytes} > ${limit} (${Math.round((bytes/baseline - 1) * 100)}% over baseline)`)
    fail++
  }
}

// Also test that all samples are below the Hook hard limit
console.log('\n— Hard limit check (≤65535 bytes) —')
for (const [name, baseline] of Object.entries(BASELINES)) {
  const src = readFileSync(`samples/${name}.js`, 'utf8')
  const result = compile(src, { host: 'hook', jzify: true })
  assert(result.byteLength <= 65535, `${name} exceeds 65535 byte Hook limit`)
  console.log(`✓ ${name}: ${result.byteLength} ≤ 65535`)
}

console.log(`\n# pass ${pass}`)
if (fail > 0) {
  console.error(`# fail ${fail}`)
  process.exit(1)
}
