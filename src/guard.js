/**
 * WAT IR guard insertion pass for Xahau Hook smart contracts.
 *
 * Xahau Guard-type Hooks (HookApiVersion 0) REQUIRE that every loop body
 * starts with a call to `_g(uniqueId, maxIter)`. Missing guards cause the
 * Hook to be rejected by the ledger.
 *
 * This pass walks the WAT IR tree (S-expression arrays) and inserts a
 * `(drop (call $hook__g (i32.const id) (i32.const maxIter)))` as the first
 * instruction inside every loop node.
 *
 * The `$hook__g` import is registered by module/hook/api.js via
 * `ensureHookImport(ctx, '_g', ['i32', 'i32'], 'i32')` which produces the
 * name `$hook__g`. This pass references that name directly.
 */

import { ctx } from './ctx.js'

/**
 * Insert _g(id, maxIter) guard calls at the start of every loop in the module.
 *
 * @param {object} sec - The compiled module sections object with .funcs, .stdlib, .start arrays.
 */
export function insertGuards(sec) {
  let id = 0
  const defaultMax = ctx.transform.hookMaxIter ?? 65535
  const hints = ctx.runtime.hookLoopHints  // Map<loopLabel, maxIter> from emit phase

  const guardFns = [
    ...(sec.funcs || []),
    ...(sec.stdlib || []),
    ...(sec.start || []),
  ]

  for (const fn of guardFns) walk(fn)

  function walk(node) {
    if (!Array.isArray(node)) return

    if (node[0] === 'loop') {
      id++
      // Determine where the body starts: after optional label string at index 1
      const bodyStart = (typeof node[1] === 'string') ? 2 : 1
      const label = typeof node[1] === 'string' ? node[1] : null
      const maxIter = (label && hints?.get(label)) ?? defaultMax
      const guardCall = ['drop', ['call', '$hook__g', ['i32.const', id], ['i32.const', maxIter]]]
      node.splice(bodyStart, 0, guardCall)
      // Recurse into children starting after the guard we just inserted
      for (let i = bodyStart + 1; i < node.length; i++) walk(node[i])
    } else {
      // Not a loop node — recurse into all children
      for (let i = 1; i < node.length; i++) walk(node[i])
    }
  }
}
