/**
 * Hook test runner — imports and runs all hook test modules.
 * Each module registers tests with the `tst` library.
 * Exits with code 1 if any test fails.
 */

const TESTS = [
  'hello',
  'guard',
  'accept-reject',
  'validate-trycatch',
  'validate-missing-hook',
  'keylets',
  'xfl',
  'float-compare',
  'keylets-helpers',
  'missing-api',
  'samples',
  'samples-wat',
  'reinterpret-opt',
  'validate-wasm',
  'e2e',
]

const argFilters = process.argv.slice(2)
  .filter(arg => !arg.startsWith('-'))
  .map(arg => arg.replace(/^test\/hook\//, '').replace(/\.js$/, ''))

const selected = argFilters.length
  ? TESTS.filter(name => argFilters.includes(name))
  : TESTS

if (argFilters.length && selected.length !== argFilters.length) {
  const known = new Set(TESTS)
  const missing = argFilters.filter(name => !known.has(name))
  throw new Error(`Unknown hook test file(s): ${missing.join(', ')}`)
}

for (const name of selected) await import(`./${name}.js`)
