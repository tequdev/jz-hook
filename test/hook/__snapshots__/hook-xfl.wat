(module
  (import "env" "_g"
    (func $hook__g
      (param i32)
      (param i32)
      (result i32)
    )
  )
  (import "env" "accept"
    (func $hook_accept
      (param i32)
      (param i32)
      (param i64)
      (result i64)
    )
  )
  (import "env" "float_multiply"
    (func $hook_float_multiply
      (param i64)
      (param i64)
      (result i64)
    )
  )
  (import "env" "float_one"
    (func $hook_float_one (result i64))
  )
  (import "env" "float_sum"
    (func $hook_float_sum
      (param i64)
      (param i64)
      (result i64)
    )
  )
  (import "env" "float_int"
    (func $hook_float_int
      (param i64)
      (param i32)
      (param i32)
      (result i64)
    )
  )
  (func $hook
    (export "hook")
    (param $reserved i32)
    (result i64)
    (local $one i64)
    (local $two i64)
    (local $four i64)
    (local $n i64)
    (local $code0 i64)
    (drop
      (call $hook__g
        (i32.const 1)
        (i32.const 1)
      )
    )
    (local.set $one (call $hook_float_one))
    (local.set $two
      (call $hook_float_sum
        (local.get $one)
        (local.get $one)
      )
    )
    (local.set $four
      (call $hook_float_multiply
        (local.get $two)
        (local.get $two)
      )
    )
    (local.set $n
      (call $hook_float_int
        (local.get $four)
        (i32.const 0)
        (i32.const 0)
      )
    )
    (block
      (local.set $code0 (local.get $n))
      (drop
        (call $hook_accept
          (i32.const 0)
          (i32.const 0)
          (local.get $code0)
        )
      )
      (unreachable)
    )
    (i64.const 0)
  )
  (func $cbak
    (export "cbak")
    (param $reserved i32)
    (result i64)
    (local $code0 i64)
    (drop
      (call $hook__g
        (i32.const 1)
        (i32.const 1)
      )
    )
    (block
      (local.set $code0 (i64.const 0))
      (drop
        (call $hook_accept
          (i32.const 0)
          (i32.const 0)
          (local.get $code0)
        )
      )
      (unreachable)
    )
    (i64.const 0)
  )
)