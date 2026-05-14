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
  (import "env" "state"
    (func $hook_state
      (param i32)
      (param i32)
      (param i32)
      (param i32)
      (result i64)
    )
  )
  (import "env" "state_set"
    (func $hook_state_set
      (param i32)
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
    (local $code0 i64)
    (drop
      (call $hook__g
        (i32.const 1)
        (i32.const 1)
      )
    )
    (local.set $r
      (call $hook_state
        (i32.const 0)
        (i32.load (i32.const -4))
        (i32.const 0)
        (i32.load (i32.const -4))
      )
    )
    (call $hook_state_set
      (i32.const 0)
      (i32.load (i32.const -8))
      (i32.const 0)
      (i32.load (i32.const -4))
    ) drop
    (block
      (local.set $code0 (local.get $r))
      (drop
        (call $hook_accept
          (i32.const 0)
          (i32.const 0)
          (local.get $code0)
        )
      )
      (unreachable)
    )
    (drop
      (call $hook_accept
        (i32.const 0)
        (i32.const 0)
        (i64.const 0)
      )
    )
    (unreachable)
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
    "\00\00\00\04\00\00\00xxxx\04\00\00\00CNTR"
  )
)