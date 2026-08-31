import type { ExpressResponse, StreamHandle } from './types.ts'
import type { Response } from 'express'

export function openStream(res: ExpressResponse): StreamHandle {
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  let closed = false

  return {
    emit(message) {
      if (closed) return
      res.write(`${JSON.stringify(message)}\n`)
      ;(res as Response & { flush?: () => void }).flush?.()
    },
    close() {
      if (closed) return
      closed = true
      res.end()
    },
  }
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

export const uid = () =>
  `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
