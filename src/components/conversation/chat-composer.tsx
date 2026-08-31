import { forwardRef, useId, useRef } from 'react'
import { motion } from 'motion/react'
import { useReduceMotion } from '@/hooks/use-reduce-motion'
import { SendHorizontal, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  id?: string
}

export const ChatComposer = forwardRef<HTMLTextAreaElement, ChatComposerProps>(
  function ChatComposer(
    {
      value,
      onChange,
      onSend,
      onStop,
      disabled = false,
      readOnly = false,
      placeholder = 'Write what you’re feeling…',
      id: idProp,
    },
    ref,
  ) {
    const reduceMotion = useReduceMotion()
    const generatedId = useId()
    const textareaId = idProp ?? generatedId
    const hintId = `${textareaId}-hint`
    const internalRef = useRef<HTMLTextAreaElement>(null)

    const setTextareaRef = (node: HTMLTextAreaElement | null) => {
      internalRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) ref.current = node
    }

    const submit = () => {
      if (!value.trim() || disabled) return
      onSend()
      requestAnimationFrame(() => internalRef.current?.focus())
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      submit()
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        submit()
      }
    }

    return (
      <footer className="shrink-0 border-t border-border bg-background/95 backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-2xl flex-col gap-1.5 px-4 py-3"
        >
          <label htmlFor={textareaId} className="text-sm font-medium text-foreground">
            Your message
          </label>
          <p id={hintId} className="sr-only">
            Press Enter to send. Press Shift plus Enter for a new line.
          </p>
          <div className="flex items-end gap-2">
            <textarea
              ref={setTextareaRef}
              id={textareaId}
              rows={1}
              value={value}
              disabled={disabled}
              readOnly={readOnly}
              placeholder={placeholder}
              aria-describedby={hintId}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                'max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-input bg-card px-3 py-2.5',
                'text-sm text-foreground placeholder:text-muted-foreground',
                'outline-none disabled:cursor-not-allowed disabled:opacity-50',
                reduceMotion
                  ? 'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40'
                  : [
                      'transition-[box-shadow,border-color] duration-300',
                      'focus-visible:border-primary/40',
                      'focus-visible:ring-2 focus-visible:ring-primary/20',
                      'focus-visible:shadow-[0_0_0_1px_var(--primary),0_0_20px_oklch(0.45_0.06_155/0.12)]',
                    ],
              )}
            />
            {onStop ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={onStop}
                aria-label="Stop reply"
              >
                <Square className="size-3.5 fill-current" />
              </Button>
            ) : (
              <motion.div
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
                transition={{ duration: 0.1 }}
              >
                <Button
                  type="submit"
                  size="icon"
                  disabled={disabled || !value.trim()}
                  aria-label="Send message"
                >
                  <SendHorizontal className="size-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </form>
      </footer>
    )
  },
)
