export type Evaluation = {
  output: string
  error?: string
}

type ParsedCommand =
  | { kind: 'substitute'; address?: number; pattern: RegExp; replacement: string }
  | { kind: 'delete' | 'print'; address?: number }

const MAX_INPUT_LENGTH = 10_000
const MAX_LINES = 500
const MAX_PATTERN_LENGTH = 120

function parseAddress(command: string): { address?: number; body: string } {
  const match = command.match(/^(\d+)(.*)$/)
  if (!match) return { body: command }
  return { address: Number(match[1]), body: match[2] }
}

function safePattern(source: string): boolean {
  if (!source || source.length > MAX_PATTERN_LENGTH) return false
  if (/[(){}|+?]/.test(source) || /\\[1-9]/.test(source)) return false
  if ((source.match(/\*/g) ?? []).length > 1 || source.includes('.*')) return false

  let inClass = false
  let escaped = false
  for (const character of source) {
    if (escaped) {
      escaped = false
      continue
    }
    if (character === '\\') {
      escaped = true
    } else if (character === '[') {
      if (inClass) return false
      inClass = true
    } else if (character === ']') {
      if (!inClass) return false
      inClass = false
    }
  }
  return !inClass && !escaped
}

function splitSubstitution(body: string): string[] | null {
  const delimiter = body[1]
  if (!delimiter || /[\w\s\\]/.test(delimiter)) return null

  const parts: string[] = []
  let current = ''
  let escaped = false
  for (let index = 2; index < body.length; index += 1) {
    const character = body[index]
    if (escaped) {
      current += character === delimiter ? delimiter : `\\${character}`
      escaped = false
    } else if (character === '\\') {
      escaped = true
    } else if (character === delimiter) {
      parts.push(current)
      current = ''
    } else {
      current += character
    }
  }
  parts.push(current)
  return parts.length === 3 ? parts : null
}

function parseCommand(command: string): ParsedCommand {
  const { address, body } = parseAddress(command.trim())

  if (body === 'd' || body === 'p') return { kind: body === 'd' ? 'delete' : 'print', address }
  if (!body.startsWith('s')) throw new Error('Supported commands are s (substitute), d (delete), and p (print).')

  const parts = splitSubstitution(body)
  if (!parts) throw new Error('Use substitution syntax like s/old/new/g.')
  const [source, replacement, flags] = parts
  if (!safePattern(source)) {
    throw new Error('For safety, patterns support literals, ., *, ^, $, and character classes only.')
  }
  if (!/^[gi]*$/.test(flags) || new Set(flags).size !== flags.length) {
    throw new Error('Only the g (global) and i (case-insensitive) flags are supported.')
  }

  return {
    kind: 'substitute',
    address,
    pattern: new RegExp(source, flags),
    replacement: replacement.replaceAll('$', () => '$$').replaceAll('&', () => '$&'),
  }
}

export function evaluateSed(input: string, command: string, quiet = false): Evaluation {
  if (input.length > MAX_INPUT_LENGTH) return { output: '', error: 'Input is limited to 10,000 characters.' }
  const lines = input.split('\n')
  if (lines.length > MAX_LINES) return { output: '', error: 'Input is limited to 500 lines.' }

  try {
    const parsed = parseCommand(command)
    const output: string[] = []

    lines.forEach((line, index) => {
      const selected = parsed.address === undefined || parsed.address === index + 1
      if (parsed.kind === 'delete' && selected) return

      const transformed =
        parsed.kind === 'substitute' && selected ? line.replace(parsed.pattern, parsed.replacement) : line
      if (!quiet) output.push(transformed)
      if (parsed.kind === 'print' && selected) output.push(transformed)
    })

    return { output: output.join('\n') }
  } catch (error) {
    return { output: '', error: error instanceof Error ? error.message : 'Unable to evaluate this command.' }
  }
}
