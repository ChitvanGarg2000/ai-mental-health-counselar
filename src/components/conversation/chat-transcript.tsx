import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useReduceMotion } from '@/hooks/use-reduce-motion'
import { ChevronDown } from 'lucide-react'
import { MessageList } from '@/components/message/message-list'
import { TypingIndicator } from '@/components/message/typing-indicator'
import { SafetyCard } from '@/components/conversation/safety-card'
import { Button } from '@/components/ui/button'
import { fadeRise } from '@/lib/motion-presets'
import type { Message } from '@/types/chat'
import type { SafetyAlert } from '@/types/stream'

const NEAR_BOTTOM_PX = 80
const LOG_LABEL_ID = 'conversation-log-label'

function isNearBottom(container: HTMLElement): boolean {
  const distance = container.scrollHeight - container.scrollTop - container.clientHeight
  return distance <= NEAR_BOTTOM_PX
}

interface ChatTranscriptProps {
  messages: Message[]
  isTyping?: boolean
  isStreaming?: boolean
  safety?: SafetyAlert | null
  onDismissSafety?: () => void
}

export function ChatTranscript({
  messages,
  isTyping = false,
  isStreaming = false,
  safety = null,
  onDismissSafety,
}: ChatTranscriptProps) {
  const reduceMotion = useReduceMotion()
  const overlayMotion = fadeRise(reduceMotion)
  const logLabelId = useId()
  const resolvedLogLabelId = logLabelId || LOG_LABEL_ID

  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const [pinnedToBottom, setPinnedToBottom] = useState(true)

  const lastMessage = messages[messages.length - 1]
  const hideEmptyAssistant =
    isTyping &&
    lastMessage?.role === 'assistant' &&
    lastMessage.text === ''
  const visibleMessages = hideEmptyAssistant ? messages.slice(0, -1) : messages

  const showJumpToLatest = !pinnedToBottom && (isTyping || isStreaming)

  const handleScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    setPinnedToBottom(isNearBottom(container))
  }, [])

  const jumpToLatest = useCallback(() => {
    setPinnedToBottom(true)
    bottomRef.current?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'end',
    })
    scrollRef.current?.focus()
  }, [reduceMotion])

  useLayoutEffect(() => {
    const container = scrollRef.current
    if (!container) return

    if (pinnedToBottom || isNearBottom(container)) {
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'auto' })
    }
  }, [messages, isTyping, isStreaming, safety, pinnedToBottom])

  return (
    <div className="relative min-h-0 flex-1">
      <h2 id={resolvedLogLabelId} className="sr-only">
        Conversation transcript
      </h2>

      <div
        ref={scrollRef}
        tabIndex={0}
        onScroll={handleScroll}
        className="h-full min-h-0 overflow-y-auto overscroll-contain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        role="log"
        aria-labelledby={resolvedLogLabelId}
      >
        <div className="mx-auto max-w-2xl px-4 py-4">
          <AnimatePresence mode="sync">
            {safety ? (
              <motion.div key="safety-card" className="mb-3" {...overlayMotion}>
                <SafetyCard alert={safety} onDismiss={onDismissSafety} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <MessageList messages={visibleMessages} />

          <AnimatePresence mode="sync">
            {isTyping ? (
              <motion.div key="typing-indicator" className="mt-3" {...overlayMotion}>
                <TypingIndicator />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div ref={bottomRef} aria-hidden />
        </div>
      </div>

      {showJumpToLatest ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="absolute bottom-4 left-1/2 -translate-x-1/2 shadow-md"
          onClick={jumpToLatest}
        >
          <ChevronDown className="size-4" aria-hidden />
          Jump to latest
        </Button>
      ) : null}
    </div>
  )
}
