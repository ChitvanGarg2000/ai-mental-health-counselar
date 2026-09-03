import express from 'express'
import { health, readChatRequest, streamReply } from './chat-core.ts'
import { corsForFrontend } from './cors.ts'
import { openStream } from './protocol.ts'
import { buildReflection, readSummary } from './reflect.ts'
import { crisisResourcesPayload } from './safety.ts'
import { BadRequest } from './types.ts'

export function createApp() {
  const app = express()
  const frontendOrigin = process.env.FRONTEND_ORIGIN?.trim()

  if (process.env.NODE_ENV === 'production' && !frontendOrigin) {
    console.warn(
      '[server] FRONTEND_ORIGIN is not set. Same-origin clients work; cross-origin browsers will be blocked by CORS.',
    )
  }

  if (frontendOrigin) {
    corsForFrontend(app, frontendOrigin)
    console.log(`[server] CORS allows origin: ${frontendOrigin}`)
  }

  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json(health())
  })

  app.get('/api/crisis-resources', (_req, res) => {
    res.json(crisisResourcesPayload())
  })

  app.post('/api/reflect', async (req, res) => {
    try {
      const summary = readSummary(req.body)
      const result = await buildReflection(summary)
      res.json(result)
    } catch (error) {
      if (error instanceof BadRequest) {
        res.status(400).json({ error: error.message })
        return
      }
      console.error('[reflect] failed:', error)
      res.status(500).json({ error: 'Could not build reflection.' })
    }
  })

  app.post('/api/chat', async (req, res) => {
    let chatRequest

    try {
      chatRequest = readChatRequest(req.body)
    } catch (error) {
      if (error instanceof BadRequest) {
        res.status(400).json({ error: error.message })
        return
      }
      console.error('[chat] bad request:', error)
      res.status(500).json({ error: 'Could not read chat request.' })
      return
    }

    const stream = openStream(res)
    const abortController = new AbortController()

    // Abort when the *response* closes — not the request. The request body stream
    // ends as soon as express.json() finishes parsing, which would abort every reply.
    res.on('close', () => {
      abortController.abort()
    })

    try {
      const result = await streamReply({
        messages: chatRequest.messages,
        tone: chatRequest.tone,
        name: chatRequest.name,
        text: chatRequest.text,
        emit: stream.emit,
        signal: abortController.signal,
      })

      if (result && !abortController.signal.aborted) {
        stream.emit({ type: 'done', message: result })
      }
    } catch (error) {
      if (!abortController.signal.aborted) {
        const message = error instanceof Error ? error.message : 'Stream failed'
        stream.emit({ type: 'error', message })
      }
    } finally {
      stream.close()
    }
  })

  return app
}
