import { memo } from 'react'
import { motion } from 'motion/react'
import { useReduceMotion } from '@/hooks/use-reduce-motion'
import type { MessageRole } from '@/types/chat'
import { cn } from '@/lib/utils'

export interface BubbleProps {
  role: MessageRole
  text: string
}

/**
 * Memoised on primitive props only (`role`, `text`). During streaming, only the
 * assistant bubble whose `text` is growing gets new props — every other bubble
 * keeps the same strings and skips re-render.
 */
export const Bubble = memo(function Bubble({ role, text }: BubbleProps) {
  const reduceMotion = useReduceMotion()
  const isUser = role === 'user'
  const speakerLabel = isUser ? 'You' : 'Haven'

  return (
    <div
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
      role="group"
      aria-label={`${speakerLabel} said`}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { duration: 0.32, ease: [0.25, 0.1, 0.25, 1] }
        }
        className={cn(
          'max-w-[60ch] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
          isUser
            ? 'bg-chat-user text-chat-user-foreground'
            : 'bg-chat-assistant text-chat-assistant-foreground ring-1 ring-border',
        )}
      >
        <span className="mb-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-inherit/80">
          {speakerLabel}
        </span>
        {text}
      </motion.div>
    </div>
  )
})
