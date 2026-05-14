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
  (func $hook
    (export "hook")
    (param $reserved i32)
    (result i64)
    (local $msg0 i64)
    (drop
      (call $hook__g
        (i32.const 1)
        (i32.const 1)
      )
    )
    (block
      (local.set $msg0 (i64.const 0x7FFA000000000007))
      (drop
        (call $hook_accept
          (i32.wrap_i64 (local.get $msg0))
          (i32.load
            (i32.sub
              (i32.wrap_i64 (local.get $msg0))
              (i32.const 4)
            )
          )
          (i64.const 0)
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
  (memory (export "memory") 1)
  (data
    (i32.const 0)
    "\00\00\00\0c\00\00\00OK: accepted"
  )
)