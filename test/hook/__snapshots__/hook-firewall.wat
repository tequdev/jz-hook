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
  (import "env" "rollback"
    (func $hook_rollback
      (param i32)
      (param i32)
      (param i64)
      (result i64)
    )
  )
  (import "env" "otxn_field"
    (func $hook_otxn_field
      (param i32)
      (param i32)
      (param i32)
      (result i64)
    )
  )
  (func $hook
    (export "hook")
    (param $reserved i32)
    (result i64)
    (local $r i64)
    (local $0 i64)
    (local $msg1 i64)
    (drop
      (call $hook__g
        (i32.const 1)
        (i32.const 1)
      )
    )
    (local.set $r
      (call $hook_otxn_field
        (i32.const 0)
        (i32.load (i32.const -4))
        (i32.const 524289)
      )
    )
    (if
      (i64.lt_s (local.get $r) (i64.const 0))
      (then
        (block
          (local.set $0 (i64.const 0x7FFA000000000007))
          (drop
            (call $hook_rollback
              (i32.wrap_i64 (local.get $0))
              (i32.load
                (i32.sub
                  (i32.wrap_i64 (local.get $0))
                  (i32.const 4)
                )
              )
              (i64.const 0)
            )
          )
          (unreachable)
        )
      )
    )
    (block
      (local.set $msg1 (i64.const 0x7FFA000000000023))
      (drop
        (call $hook_accept
          (i32.wrap_i64 (local.get $msg1))
          (i32.load
            (i32.sub
              (i32.wrap_i64 (local.get $msg1))
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
    "\00\00\00\15\00\00\00could not read sender\00\00\00\08\00\00\00accepted\1a\00\00\00xxxxxxxxxxxxxxxxxxxxxxxxxx"
  )
)