import { Bubble } from '@/components/message/bubble'
import type { Message } from '@/types/chat'
import { cn } from '@/lib/utils'

interface MessageListProps {
  messages: Message[]
  className?: string
}

/** Not memoised — `messages` is a new array reference on every stream token. Bubble is. */
export function MessageList({ messages, className }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Say what&apos;s on your mind — there&apos;s no right way to start.
      </p>
    )
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {messages.map((message) => (
        <Bubble
          key={message.id}
          role={message.role}
          text={message.text}
        />
      ))}
    </div>
  )
}
