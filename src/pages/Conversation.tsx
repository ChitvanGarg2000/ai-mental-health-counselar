import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useReduceMotion } from '@/hooks/use-reduce-motion'
import { SkipLink } from '@/components/a11y/skip-link'
import { ChatComposer } from '@/components/conversation/chat-composer'
import { ChatTranscript } from '@/components/conversation/chat-transcript'
import { ConversationHeader } from '@/components/conversation/conversation-header'
import { useChatStream } from '@/hooks/use-chat-stream'
import { useSession } from '@/hooks/use-app-store'
import { appStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

function Conversation() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const session = useSession(sessionId)
  const { send, stop, isStreaming, status, safety, clearSafety, liveAnnouncement } =
    useChatStream(sessionId)
  const reduceMotion = useReduceMotion()
  const [draft, setDraft] = useState('')
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const autoSendRef = useRef(false)

  useEffect(() => {
    if (!sessionId) {
      const id = appStore.createSession()
      navigate(`/chat/${id}`, { replace: true })
    }
  }, [sessionId, navigate])

  useEffect(() => {
    if (!sessionId || autoSendRef.current) return

    const state = location.state as { autoSend?: boolean; opener?: string } | null
    if (!state?.autoSend || !state.opener?.trim()) return

    navigate(location.pathname, { replace: true, state: {} })

    autoSendRef.current = true
    void send(state.opener.trim())
  }, [sessionId, location.pathname, location.state, navigate, send])

  const lastMessage = session?.messages[session.messages.length - 1]
  const awaitingFirstToken =
    isStreaming && lastMessage?.role === 'assistant' && lastMessage.text === ''

  const handleSend = () => {
    const text = draft.trim()
    if (!text || isStreaming) return
    setDraft('')
    void send(text)
    requestAnimationFrame(() => composerRef.current?.focus())
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <SkipLink href="#chat-composer">Skip to message input</SkipLink>

      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-aura',
          !reduceMotion && 'animate-aura-drift',
        )}
        aria-hidden
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        <ConversationHeader />
        {status ? (
          <p
            className="shrink-0 border-b border-border bg-muted/50 px-4 py-1.5 text-center text-xs text-muted-foreground"
            aria-hidden
          >
            {status}
          </p>
        ) : null}
        <ChatTranscript
          messages={session?.messages ?? []}
          isTyping={awaitingFirstToken}
          isStreaming={isStreaming}
          safety={safety}
          onDismissSafety={clearSafety}
        />
        <ChatComposer
          ref={composerRef}
          id="chat-composer"
          value={draft}
          onChange={setDraft}
          onSend={handleSend}
          onStop={isStreaming ? stop : undefined}
          disabled={!session}
          readOnly={isStreaming}
          placeholder={isStreaming ? 'Haven is replying…' : undefined}
        />
      </div>
    </div>
  )
}

export default Conversation
