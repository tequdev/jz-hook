<img src="jz.svg" alt="jz-hook logo" width="120"/>

## ![stability](https://img.shields.io/badge/stability-experimental-black) [![npm](https://img.shields.io/npm/v/jz-hook?color=gray)](http://npmjs.org/jz-hook) [![test](https://github.com/dy/jz/actions/workflows/test.yml/badge.svg)](https://github.com/dy/jz/actions/workflows/test.yml)

**JZ-Hook** is a minimal functional JS subset that compiles to WASM optimized for **[Xahau](https://xahau.network/) Hook smart contracts**.

```js
import { otxn_field, sfAccount, trace_num } from 'hook'

export let hook = () => {
  let acc = otxn_field(sfAccount)
  trace_num("account-tag", acc)
  return "OK"  // auto-lowered to accept("OK", 0)
}
```

```sh
$ jz-hook --host hook hello.js -o hello.wasm
hello.js → hello.wasm (842 bytes, validated, 12 imports, 3 guards)
```

## Why?

Write plain JS, compile to a valid [Xahau Hook](https://docs.xahau.network/technical/hooks). JZ-Hook:

* **Enforces Hook constraints** — WASM binary ≤65 535 bytes, automatic guard insertion, no SIMD/exception/grow
* **Maps JS idioms to Hook API** — `console.log` → `trace`, `throw` → `rollback`, `return "OK"` → `accept`
* **Stays upstream-compatible** — forked from [jz](https://github.com/dy/jz), existing `host:'js'`/`host:'wasi'` modes are preserved

## Usage

```sh
npm install -g jz-hook

# Compile a Hook
jz-hook --host hook hook.js -o hook.wasm

# View generated WAT
jz-hook --host hook --wat hook.js

# Validate output meets Hook constraints
jz-hook --host hook --validate hook.js -o hook.wasm
```

### Options

| Option | Description |
|--------|-------------|
| `--host hook` | Compile for Xahau Hook (Guard-type v0) |
| `--hook-on <hex>` | `sfHookOn` bitmask (default: all enabled) |
| `--namespace <hex>` | `sfHookNamespace` (32-byte hex) |
| `--max-iter <n>` | Default loop guard iteration cap (default: 65535) |
| `--validate` | Verify output WASM meets Hook constraints |

## Hook Language

### Entry points

```js
// Required export
export let hook = (/* implicit reserved: uint32 */) => {
  // main hook logic — called on matching transactions
  return "OK"  // → accept("OK", 0)
}

// Optional
export let cbak = () => {
  // callback — called when emitted tx settles
}
```

### Hook API imports

```js
import {
  // Control
  accept, rollback,
  // Transaction
  otxn_field, otxn_type, otxn_burden, otxn_slot,
  // State
  state, state_set, state_foreign, state_foreign_set,
  // Emission
  etxn_reserve, emit, etxn_details, etxn_burden,
  // Slots
  slot, slot_subfield, slot_subarray, slot_count, slot_size, slot_type,
  // Utilities
  util_keylet, util_sha512h, util_accid, util_raddr,
  // Hooks
  hook_account, hook_pos, ledger_last_time,
  // Constants
  sfAccount, sfAmount, sfDestination, /* ... 300+ sf* constants */
} from 'hook'
```

### JS idiom → Hook API mapping

| JS | Hook |
|----|------|
| `console.log("msg", val)` | `trace("msg", 0, val, 0, 0)` |
| `console.log(n)` (number) | `trace_num("", 0, n)` |
| `throw "error"` | `rollback("error", 0)` |
| `return "OK"` at hook() | `accept("OK", 0)` |
| `Date.now()` | `ledger_last_time()` |
| `Math.random()` | **compile-time error** (non-deterministic) |

### Supported subset

- ✅ `Math.*` (sin, cos, sqrt, abs, floor, ceil, min, max, pow, log, ...)
- ✅ `Number`, bitwise operators, typed arrays
- ✅ Strings (SSO inline for ≤4 ASCII chars, heap for larger)
- ✅ Arrays, objects (fixed-layout, no dynamic keys)
- ✅ `import/export`, `let/const`, arrows, destructuring, spread
- ❌ `Math.random` (non-deterministic — use `etxn_burden() % N`)
- ❌ `setTimeout/setInterval` (no event loop in Hook)
- ❌ `RegExp`, `JSON`, `Map`, `Set` (exceed 65KB budget when combined)
- ❌ `async/await`, generators, classes (not in JZ core)
- ❌ Closures (require indirect calls, forbidden in Hook Phase 1)

## How guards work

All loops automatically get a `_g(id, max)` guard call inserted by the compiler:

```js
// Source
for (let i = 0; i < 100; i++) { ... }

// Compiled (WAT, simplified)
(loop $L1
  (call $_g (i32.const 1) (i32.const 100))  ;; auto-inserted
  ...)
```

The `--max-iter <n>` flag sets the cap for dynamically-bounded loops (default 65535).

## Hook constraints enforced at compile time

| Constraint | Enforcement |
|-----------|-------------|
| Binary ≤65 535 bytes | Error if exceeded with `--validate` |
| All loops have guards | `src/guard.js` inserts `_g()`; `src/hook-validate.js` checks |
| No SIMD (v128.*) | Vectorization disabled |
| No exceptions | `try/catch/throw` → `rollback` lowering |
| No `memory.grow` | Fixed 8-page arena allocator |
| No `return_call` | `noTailCall: true` default |
| Imports ⊆ env.* (Hook API) | `__ext_*` dynamic dispatch forbidden |
| Exports exactly `hook` [+ `cbak`] | Enforced by compiler |

## Upstream / Fork

This is a fork of [jz](https://github.com/dy/jz) by Dmitry Iv. Existing `host:'js'` and `host:'wasi'` modes are fully preserved. Hook-specific code lives in:
- `src/guard.js` — guard insertion pass
- `src/hook-validate.js` — constraint checker
- `module/hook/` — Hook API bindings
- `test/hook/` — Hook test suite

To track upstream: `git remote add upstream https://github.com/dy/jz.git`

See [README.upstream.md](README.upstream.md) for the original JZ documentation.

---

MIT • [ॐ](https://github.com/krishnized/license/)
