/**
 * Guard insertion test: verify a hook with a dynamic loop gets _g guard calls
 * inserted at the start of each loop body.
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

test('hook/guard: loop body contains call $hook__g', () => {
  const wat = compile(
    `export let hook = (n) => { let s = 0; for (let i = 0; i < n; i++) s = s + i; return s }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('call $hook__g'), `expected call $hook__g in WAT, got:\n${wat}`)
})

test('hook/guard: _g is imported from env', () => {
  const wat = compile(
    `export let hook = (n) => { let s = 0; for (let i = 0; i < n; i++) s = s + i; return s }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('(import "env" "_g"'), `expected (import "env" "_g") in WAT, got:\n${wat}`)
})

test('hook/guard: static for-loop bound inferred as maxIter (i < 10 → _g(id, 10))', () => {
  const wat = compile(
    `export let hook = () => { let s = 0; for (let i = 0; i < 10; i++) s = s + i; return s }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('i32.const 10'), `expected i32.const 10 as guard maxIter, got:\n${wat}`)
})

test('hook/guard: dynamic loop falls back to hookMaxIter (65535)', () => {
  const wat = compile(
    `export let hook = (n) => { let s = 0; for (let i = 0; i < n; i++) s = s + i; return s }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('i32.const 65535'), `expected i32.const 65535 as fallback maxIter, got:\n${wat}`)
})

test('hook/guard: i <= N inferred as N+1 (i <= 9 → _g(id, 10))', () => {
  const wat = compile(
    `export let hook = () => { let s = 0; for (let i = 0; i <= 9; i++) s = s + i; return s }`,
    { host: 'hook', wat: true, jzify: true }
  )
  ok(wat.includes('i32.const 10'), `expected i32.const 10 for i<=9, got:\n${wat}`)
})
