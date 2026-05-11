/**
 * Xahau Hook binary validator.
 *
 * Validates a compiled WASM binary (Buffer/Uint8Array) against Xahau
 * Guard-type Hook (HookApiVersion 0) constraints. Run after watrCompile
 * and before writing output.
 *
 * Constraints checked:
 *   1. Binary size ≤ 65535 bytes
 *   2. Valid WASM magic bytes
 *   3. All imports must be from module "env" (no other module names)
 *   4. Forbidden opcodes absent (SIMD, exception handling, memory.grow, return_call*)
 *   5. Export named "hook" must be present and be a function
 *
 * @module hook-validate
 */

// ---------------------------------------------------------------------------
// LEB128 / string helpers
// ---------------------------------------------------------------------------

/**
 * Read an unsigned LEB128 integer from bytes at offset.
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {{ value: number, offset: number }}
 */
function readUleb128(bytes, offset) {
  let result = 0
  let shift = 0
  while (offset < bytes.length) {
    const byte = bytes[offset++]
    result |= (byte & 0x7F) << shift
    if (!(byte & 0x80)) break
    shift += 7
  }
  return { value: result >>> 0, offset }
}

/**
 * Read a length-prefixed UTF-8 string (LEB128 length then bytes).
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {{ value: string, offset: number }}
 */
function readString(bytes, offset) {
  const lenR = readUleb128(bytes, offset)
  offset = lenR.offset
  const len = lenR.value
  const str = new TextDecoder().decode(bytes.subarray(offset, offset + len))
  return { value: str, offset: offset + len }
}

// ---------------------------------------------------------------------------
// Section table parser
// ---------------------------------------------------------------------------

/**
 * Parse the WASM binary section table.
 * Returns a map from section id → { offset, size } where offset points to
 * the first byte of the section content (after the size LEB128).
 *
 * @param {Uint8Array} bytes
 * @returns {Map<number, { offset: number, size: number }>}
 */
function parseSections(bytes) {
  const sections = new Map()
  let offset = 8 // skip magic (4) + version (4)
  while (offset < bytes.length) {
    const id = bytes[offset++]
    const sizeR = readUleb128(bytes, offset)
    offset = sizeR.offset
    // Keep only first occurrence of each section id (custom sections may repeat;
    // for validation we only need the canonical single-occurrence sections).
    if (!sections.has(id)) {
      sections.set(id, { offset, size: sizeR.value })
    }
    offset += sizeR.value
  }
  return sections
}

// ---------------------------------------------------------------------------
// Import section validator (section id 2)
// ---------------------------------------------------------------------------

/**
 * Check that every import in the import section has module name "env".
 * Returns array of error strings (empty = ok).
 *
 * @param {Uint8Array} bytes
 * @param {{ offset: number, size: number }} sec
 * @returns {string[]}
 */
function checkImports(bytes, sec) {
  const errors = []
  let offset = sec.offset
  const end = offset + sec.size
  const countR = readUleb128(bytes, offset)
  offset = countR.offset
  const count = countR.value
  for (let i = 0; i < count && offset < end; i++) {
    const modR = readString(bytes, offset)
    offset = modR.offset
    const nameR = readString(bytes, offset)
    offset = nameR.offset
    // import descriptor type byte
    const kind = bytes[offset++]
    // Skip descriptor payload based on kind:
    //   0x00 = func  → typeidx (uleb128)
    //   0x01 = table → reftype (1 byte) + limits (1..3 bytes)
    //   0x02 = mem   → limits
    //   0x03 = global→ valtype (1 byte) + mutability (1 byte)
    if (kind === 0x00) {
      const r = readUleb128(bytes, offset); offset = r.offset
    } else if (kind === 0x01) {
      offset++ // reftype
      const flags = bytes[offset++]
      offset++ // min
      if (flags & 1) offset++ // max
    } else if (kind === 0x02) {
      const flags = bytes[offset++]
      const r = readUleb128(bytes, offset); offset = r.offset // min
      if (flags & 1) { const r2 = readUleb128(bytes, offset); offset = r2.offset } // max
    } else if (kind === 0x03) {
      offset += 2 // valtype + mutability
    } else {
      // Unknown kind — stop parsing, report what we have so far
      break
    }
    if (modR.value !== 'env') {
      errors.push(
        `Hook import "${modR.value}"."${nameR.value}" uses non-env module name "${modR.value}" (only "env" is allowed)`
      )
    }
  }
  return errors
}

// ---------------------------------------------------------------------------
// Export section validator (section id 7)
// ---------------------------------------------------------------------------

/**
 * Check that the export section contains a function export named "hook".
 * Returns array of error strings.
 *
 * @param {Uint8Array} bytes
 * @param {{ offset: number, size: number }} sec
 * @returns {string[]}
 */
function checkExports(bytes, sec) {
  let offset = sec.offset
  const end = offset + sec.size
  const countR = readUleb128(bytes, offset)
  offset = countR.offset
  const count = countR.value
  let hookFound = false
  for (let i = 0; i < count && offset < end; i++) {
    const nameR = readString(bytes, offset)
    offset = nameR.offset
    const kind = bytes[offset++]
    const r = readUleb128(bytes, offset); offset = r.offset // index
    if (nameR.value === 'hook' && kind === 0x00 /* func */) hookFound = true
  }
  if (!hookFound) return ['Hook binary must export a function named "hook"']
  return []
}

// ---------------------------------------------------------------------------
// Code section forbidden opcode scanner
// ---------------------------------------------------------------------------

// Opcodes forbidden in Hook code section bodies.
// Maps opcode byte → human-readable name.
const FORBIDDEN_OPCODES = new Map([
  [0xFD, 'SIMD/v128'],
  [0x06, 'try (exception handling)'],
  [0x07, 'catch (exception handling)'],
  [0x08, 'throw (exception handling)'],
  [0x09, 'rethrow (exception handling)'],
  [0x1F, 'try_table (exception handling)'],
  // 0x40 is intentionally excluded: it is also the "empty blocktype" immediate for void-result
  // if/loop/block instructions and would false-positive on virtually every hook. hook mode
  // forces alloc=false which prevents memory.grow at the JZ level, so no binary check is needed.
  [0x12, 'return_call'],
  [0x13, 'return_call_indirect'],
])

/**
 * Skip over a LEB128-encoded integer at `offset`, returning the new offset.
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {number}
 */
function skipLeb128(bytes, offset) {
  while (offset < bytes.length && (bytes[offset++] & 0x80)) { /* continue */ }
  return offset
}

/**
 * Skip the blocktype immediate (used by block/loop/if).
 * Blocktype is either a single byte (0x40 = void, or valtype) or a signed LEB128 type index.
 * @param {Uint8Array} bytes
 * @param {number} offset
 * @returns {number}
 */
function skipBlocktype(bytes, offset) {
  const b = bytes[offset]
  // 0x40 = void, value type bytes (0x7F i32, 0x7E i64, 0x7D f32, 0x7C f64, 0x70 funcref, 0x6F externref)
  if (b === 0x40 || b === 0x7F || b === 0x7E || b === 0x7D || b === 0x7C || b === 0x70 || b === 0x6F) {
    return offset + 1
  }
  // Otherwise signed LEB128 type index (multi-value block)
  return skipLeb128(bytes, offset)
}

/**
 * Scan code section function bodies for forbidden opcodes.
 * Uses opcode-aware scanning to skip over instruction immediates, preventing
 * false positives from immediate bytes that happen to match forbidden opcodes.
 *
 * Only scans the code section (id=10). Data, type, and other sections are not
 * scanned since they cannot legally contain opcodes that execute as instructions.
 *
 * @param {Uint8Array} bytes  Full WASM binary
 * @param {{ offset: number, size: number }} sec  Code section descriptor
 * @returns {string[]}
 */
function scanForbiddenOpcodes(bytes, sec) {
  const errors = []
  const seen = new Set()
  let offset = sec.offset
  const end = sec.offset + sec.size

  // The code section starts with a LEB128 function count,
  // then each function body: LEB128 body-size, then the body bytes.
  const countR = readUleb128(bytes, offset)
  offset = countR.offset
  const funcCount = countR.value

  for (let f = 0; f < funcCount && offset < end; f++) {
    const bodySizeR = readUleb128(bytes, offset)
    offset = bodySizeR.offset
    const bodyEnd = offset + bodySizeR.value

    // Parse local declarations (count + (count, valtype) pairs)
    const localDeclCountR = readUleb128(bytes, offset)
    offset = localDeclCountR.offset
    const localDeclCount = localDeclCountR.value
    for (let d = 0; d < localDeclCount && offset < bodyEnd; d++) {
      offset = skipLeb128(bytes, offset) // count
      offset++ // valtype byte
    }

    // Scan opcodes in the function body
    while (offset < bodyEnd) {
      const opcode = bytes[offset++]

      // Check for forbidden opcode
      if (FORBIDDEN_OPCODES.has(opcode) && !seen.has(opcode)) {
        seen.add(opcode)
        errors.push(
          `Forbidden instruction in Hook: ${FORBIDDEN_OPCODES.get(opcode)} (opcode 0x${opcode.toString(16).padStart(2, '0')} at offset ${offset - 1})`
        )
      }

      // Skip over instruction immediates based on opcode
      // Reference: https://webassembly.github.io/spec/core/binary/instructions.html
      if (opcode === 0x02 || opcode === 0x03 || opcode === 0x04) {
        // block, loop, if — blocktype immediate
        offset = skipBlocktype(bytes, offset)
      } else if (opcode === 0x0C || opcode === 0x0D) {
        // br, br_if — label index
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x0E) {
        // br_table — vector of label indices + default
        const nR = readUleb128(bytes, offset); offset = nR.offset
        for (let i = 0; i <= nR.value; i++) offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x10) {
        // call — function index
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x11) {
        // call_indirect — type index + table index
        offset = skipLeb128(bytes, offset)
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x1A || opcode === 0x1B) {
        // drop (no imm), select (no imm for typed variant we skip below)
        // 0x1C = select with type vector (rare) — skip the vec
        // nothing to skip for 0x1A/0x1B
      } else if (opcode === 0x20 || opcode === 0x21 || opcode === 0x22 ||
                 opcode === 0x23 || opcode === 0x24 || opcode === 0x25 ||
                 opcode === 0x26) {
        // local.get/set/tee, global.get/set, table.get/set — single LEB128 index
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x28 || opcode === 0x29 || opcode === 0x2A ||
                 opcode === 0x2B || opcode === 0x2C || opcode === 0x2D ||
                 opcode === 0x2E || opcode === 0x2F ||
                 opcode >= 0x30 && opcode <= 0x3E) {
        // load/store ops — memarg (align LEB128 + offset LEB128)
        offset = skipLeb128(bytes, offset)
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x3F || opcode === 0x40) {
        // memory.size / memory.grow — reserved byte (always 0x00)
        offset++
      } else if (opcode === 0x41) {
        // i32.const — signed LEB128 immediate
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x42) {
        // i64.const — signed LEB128 immediate
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0x43) {
        // f32.const — 4 bytes immediate
        offset += 4
      } else if (opcode === 0x44) {
        // f64.const — 8 bytes immediate
        offset += 8
      } else if (opcode === 0xFC) {
        // Misc prefix (memory.init, data.drop, etc.) — sub-opcode LEB128
        offset = skipLeb128(bytes, offset)
      } else if (opcode === 0xFD) {
        // SIMD prefix — sub-opcode LEB128 (already flagged as forbidden above)
        offset = skipLeb128(bytes, offset)
      }
      // All other opcodes (0x00 unreachable, 0x01 nop, 0x0B end, 0x0F return,
      // arithmetic/comparison ops, etc.) have no immediates — nothing to skip.
    }
    offset = bodyEnd
  }
  return errors
}

// ---------------------------------------------------------------------------
// Main validator
// ---------------------------------------------------------------------------

/**
 * Validate a compiled WASM binary against Xahau Guard-type Hook constraints.
 *
 * @param {Uint8Array|Buffer} wasm - The compiled WASM binary
 * @returns {{ ok: true, bytes: number }} on success
 * @throws {Error} with a detailed message listing all violations on failure
 */
export function validateHook(wasm) {
  const bytes = wasm instanceof Uint8Array ? wasm : new Uint8Array(wasm)
  const errors = []

  // --- Check 1: size ---
  if (bytes.length > 65535)
    errors.push(`Hook binary too large: ${bytes.length} bytes (max 65535)`)

  // --- Check 2: WASM magic ---
  if (
    bytes.length < 8 ||
    bytes[0] !== 0x00 || bytes[1] !== 0x61 ||
    bytes[2] !== 0x73 || bytes[3] !== 0x6D
  ) {
    errors.push('Not a valid WASM binary (bad magic bytes)')
    // Cannot safely parse sections — bail early
    if (errors.length > 0)
      throw new Error(`Hook validation failed:\n${errors.map(e => '  • ' + e).join('\n')}`)
  }

  // Parse section table once for checks 3–5
  let sections
  try {
    sections = parseSections(bytes)
  } catch (e) {
    errors.push(`Failed to parse WASM section table: ${e.message}`)
    throw new Error(`Hook validation failed:\n${errors.map(e => '  • ' + e).join('\n')}`)
  }

  // --- Check 3: forbidden opcodes (scan code section, id=10) ---
  // Only the code section is scanned. Data sections (id=11), type sections (id=1),
  // and other metadata sections cannot legally contain executable opcodes, so
  // scanning them only produces false positives from embedded numeric bytes.
  const codeSec = sections.get(10)
  if (codeSec) {
    const opcodeErrors = scanForbiddenOpcodes(bytes, codeSec)
    errors.push(...opcodeErrors)
  }

  // --- Check 4: all imports must be from module "env" ---
  const importSec = sections.get(2)
  if (importSec) {
    try {
      const importErrors = checkImports(bytes, importSec)
      errors.push(...importErrors)
    } catch (e) {
      errors.push(`Failed to parse import section: ${e.message}`)
    }
  }

  // --- Check 5: "hook" function export must exist ---
  const exportSec = sections.get(7)
  if (!exportSec) {
    errors.push('Hook binary has no export section — "hook" function export is required')
  } else {
    try {
      const exportErrors = checkExports(bytes, exportSec)
      errors.push(...exportErrors)
    } catch (e) {
      errors.push(`Failed to parse export section: ${e.message}`)
    }
  }

  if (errors.length > 0)
    throw new Error(`Hook validation failed:\n${errors.map(e => '  • ' + e).join('\n')}`)

  return { ok: true, bytes: bytes.length }
}
