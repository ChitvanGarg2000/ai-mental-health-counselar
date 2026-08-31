import { useCallback, useRef, useState } from 'react'
import { createNdjsonParser } from '@/lib/ndjson'
import { apiUrl } from '@/lib/api'
import { useSettings } from '@/hooks/use-app-store'
import { appStore, createMessageId } from '@/store/app-store'
import type { SafetyAlert, StreamEvent } from '@/types/stream'

function announceReply(content: string): string {
  const trimmed = content.trim()
  if (!trimmed) return 'Haven finished replying.'
  const excerpt = trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed
  return `Haven replied: ${excerpt}`
}

export function useChatStream(sessionId: string | undefined) {
  const settings = useSettings()
  const abortRef = useRef<AbortController | null>(null)
  const streamingRef = useRef(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [safety, setSafety] = useState<SafetyAlert | null>(null)
  const [liveAnnouncement, setLiveAnnouncement] = useState('')

  const clearSafety = useCallback(() => setSafety(null), [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!sessionId || !trimmed || streamingRef.current) return

      const userMessage = {
        id: createMessageId(),
        role: 'user' as const,
        text: trimmed,
      }

      appStore.appendMessage(sessionId, userMessage)

      const apiMessages =
        appStore.getSessionSnapshot(sessionId)?.messages.map((message) => ({
          role: message.role,
          content: message.text,
        })) ?? []

      const assistantId = createMessageId()
      appStore.appendMessage(sessionId, {
        id: assistantId,
        role: 'assistant',
        text: '',
      })

      const controller = new AbortController()
      abortRef.current = controller
      streamingRef.current = true
      setIsStreaming(true)
      setStatus(null)
      setSafety(null)
      setLiveAnnouncement('')

      let assistantText = ''

      try {
        const response = await fetch(apiUrl('/api/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: apiMessages,
            tone: settings.tone,
            name: settings.name,
          }),
          signal: controller.signal,
        })

        if (!response.ok) {
          const detail = await response.text().catch(() => '')
          throw new Error(detail || `Chat request failed (${response.status})`)
        }

        if (!response.body) {
          throw new Error('No response body')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        const parser = createNdjsonParser((event: StreamEvent) => {
          switch (event.type) {
            case 'status':
              setStatus(event.message)
              setLiveAnnouncement(event.message)
              break
            case 'token':
              assistantText += event.text
              appStore.updateMessageText(sessionId, assistantId, assistantText)
              break
            case 'done':
              appStore.updateMessageText(sessionId, assistantId, event.message.content)
              setLiveAnnouncement(announceReply(event.message.content))
              break
            case 'safety':
              setSafety({
                level: event.level,
                message: event.message,
                resources: event.resources,
              })
              setLiveAnnouncement(`Important: ${event.message}`)
              break
            case 'error':
              setLiveAnnouncement(event.message)
              throw new Error(event.message)
          }
        })

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          parser.push(decoder.decode(value, { stream: true }))
        }

        parser.push(decoder.decode())
        parser.flush()

        appStore.flushPersist()
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return
        }

        const message = error instanceof Error ? error.message : 'Something went wrong'
        setStatus(message)
        setLiveAnnouncement(message)
        if (!assistantText) {
          const fallback =
            'Sorry — I could not finish that reply. You can try again.'
          appStore.updateMessageText(sessionId, assistantId, fallback)
          setLiveAnnouncement(fallback)
        } else {
          setLiveAnnouncement(announceReply(assistantText))
        }
      } finally {
        abortRef.current = null
        streamingRef.current = false
        setIsStreaming(false)
      }
    },
    [sessionId, settings.tone, settings.name],
  )

  return { send, stop, isStreaming, status, safety, clearSafety, liveAnnouncement }
}
