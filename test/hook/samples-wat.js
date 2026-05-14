/**
 * WAT snapshot tests for sample hook programs.
 * Run with UPDATE_SNAPSHOTS=1 to regenerate snapshots.
 */
import test from 'tst'
import { ok, is } from 'tst/assert.js'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { compile } from '../../index.js'

const UPDATE = process.env.UPDATE_SNAPSHOTS === '1' || process.argv.includes('--update-snapshots')
const SNAP_DIR = new URL('__snapshots__/', import.meta.url).pathname
const NAMES = ['hook-accept', 'hook-firewall', 'hook-state-counter', 'hook-xfl']

for (const name of NAMES) {
  test(`hook/samples-wat: ${name} WAT matches snapshot`, () => {
    const src = readFileSync(`samples/${name}.js`, 'utf8')
    const wat = compile(src, { host: 'hook', wat: true, jzify: true })
    const snapPath = `${SNAP_DIR}${name}.wat`

    if (UPDATE) {
      writeFileSync(snapPath, wat)
      ok(true, `${name}.wat snapshot updated`)
      return
    }

    ok(existsSync(snapPath), `snapshot file missing: ${snapPath} (run with UPDATE_SNAPSHOTS=1 to create)`)
    const expected = readFileSync(snapPath, 'utf8')
    is(wat, expected, `${name} WAT does not match snapshot.\n\nExpected:\n${expected}\n\nGot:\n${wat}`)
  })
}
