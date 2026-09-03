import type { IncomingMessage, ServerResponse } from 'node:http'
import { createApp } from '../server/app.ts'

const app = createApp()

/**
 * Vercel catch-all for /api/*. Express routes are defined as /api/...,
 * but some runtimes pass only the suffix (/chat). Normalize so both work.
 */
function withApiPath(req: IncomingMessage) {
  const raw = req.url ?? '/'
  const q = raw.indexOf('?')
  const path = q === -1 ? raw : raw.slice(0, q)
  const query = q === -1 ? '' : raw.slice(q)

  if (path === '/api' || path.startsWith('/api/')) return

  const suffix = path === '/' ? '' : path
  req.url = `/api${suffix}${query}`
}

export default function handler(req: IncomingMessage, res: ServerResponse) {
  withApiPath(req)
  app(req, res)
}

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: false,
  },
}
