import type { StreamEvent } from '@/types/stream'

export function createNdjsonParser(onMessage: (event: StreamEvent) => void) {
  let buffer = ''

  function parseLine(line: string) {
    const trimmed = line.trim()
    if (!trimmed) return
    onMessage(JSON.parse(trimmed) as StreamEvent)
  }

  return {
    push(chunk: string) {
      buffer += chunk
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        parseLine(line)
      }
    },
    flush() {
      if (buffer.trim()) {
        parseLine(buffer)
      }
      buffer = ''
    },
  }
}
