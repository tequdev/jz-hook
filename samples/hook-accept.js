/**
 * Minimal Xahau Hook — accepts all incoming transactions.
 * Demonstrates: bare minimum hook structure with export let hook and cbak.
 *
 * Compile:
 *   node cli.js --host hook --wat samples/hook-accept.js -o -
 *   node cli.js --host hook samples/hook-accept.js -o samples/hook-accept.wasm
 */
export let hook = () => "OK: accepted"
export let cbak = () => 0
