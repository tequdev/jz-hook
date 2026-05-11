/**
 * missing-api test: all 70+ Hook API imports must be resolvable at compile time.
 * Importing all major functions in a single module must not throw "emitter not found".
 */
import test from 'tst'
import { ok } from 'tst/assert.js'
import { compile } from '../../index.js'

const src = `
import {
  hook_account, hook_pos, hook_skip, hook_param,
  state, state_set, state_foreign, state_foreign_set,
  otxn_field, otxn_type, otxn_burden, otxn_slot, otxn_id,
  slot, slot_clear, slot_count, slot_id, slot_set, slot_size, slot_type, slot_float, xpop_slot,
  emit, etxn_reserve, etxn_details, etxn_burden, etxn_nonce, etxn_fee_base,
  sto_subfield, sto_subarray, sto_validate, sto_emplace, sto_erase,
  trace, trace_num, trace_float,
  util_keylet, util_sha512h, util_accid, util_raddr, util_verify, util_encode, util_decode,
  float_set, float_multiply, float_divide, float_one, float_compare, float_sum,
  float_negate, float_mantissa, float_sign, float_int, float_exponent,
  float_exponent_set, float_mantissa_set, float_log, float_root,
  ledger_last_time, ledger_seq, ledger_last_hash, ledger_nonce, ledger_keylet
} from 'hook'
export let hook = () => 1
`

test('hook/missing-api: all major Hook API imports compile without error', () => {
  let threw = false
  let errMsg = ''
  try {
    compile(src, { host: 'hook', wat: true, jzify: true })
  } catch (e) {
    threw = true
    errMsg = e.message
  }
  ok(!threw, `all Hook API imports should compile without error, got: ${errMsg}`)
})
