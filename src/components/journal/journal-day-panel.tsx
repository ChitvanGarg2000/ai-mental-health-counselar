import { Link } from 'react-router-dom'
import { Hand, MessageCircle, Wind, X } from 'lucide-react'
import { activitySummary } from '@/store/activity-selectors'
import { Button } from '@/components/ui/button'
import { dateFromDayKey } from '@/lib/calendar'
import type { JournalDayData } from '@/lib/journal-day-bucket'
import { PRACTICE_LABELS } from '@/types/activity'
import { MOOD_LABELS, MOOD_STEPS } from '@/types/mood'

interface JournalDayPanelProps {
  dayKey: string
  data: JournalDayData | undefined
  onClose: () => void
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function JournalDayPanel({ dayKey, data, onClose }: JournalDayPanelProps) {
  const date = dateFromDayKey(dayKey)
  const heading = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const conversations = data?.conversations ?? []
  const practices = data?.practices ?? []
  const empty = conversations.length === 0 && practices.length === 0

  return (
    <section
      className="rounded-xl border border-border bg-card p-4"
      aria-label={`Activity for ${heading}`}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={onClose}
          aria-label="Close day details"
        >
          <X className="size-4" aria-hidden />
        </Button>
      </div>

      {empty ? (
        <p className="mt-3 text-sm text-muted-foreground">Nothing recorded this day.</p>
      ) : (
        <div className="mt-3 space-y-4">
          {conversations.length > 0 ? (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Conversations
              </h3>
              <ul className="mt-2 space-y-2">
                {conversations.map((session) => (
                  <li key={session.id}>
                    <Link
                      to={`/chat/${session.id}`}
                      className="flex items-start gap-2 rounded-lg border border-border px-3 py-2 transition-colors hover:bg-muted/40"
                    >
                      <MessageCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          {session.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {session.preview}
                        </span>
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {session.startingMood
                            ? `${MOOD_LABELS[session.startingMood]} mood · `
                            : ''}
                          {formatTime(session.updatedAt)}
                        </span>
                      </span>
                      {session.startingMood ? (
                        <span
                          aria-hidden
                          className="ml-auto size-2.5 shrink-0 rounded-full ring-1 ring-border"
                          style={{
                            backgroundColor: `var(--mood-${MOOD_STEPS[session.startingMood]})`,
                          }}
                        />
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {practices.length > 0 ? (
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Toolkit practice
              </h3>
              <ul className="mt-2 space-y-2">
                {practices.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-start gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    {entry.kind === 'box-breathing' ? (
                      <Wind className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <Hand className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    )}
                    <span>
                      <span className="block text-sm font-medium text-foreground">
                        {PRACTICE_LABELS[entry.kind]}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {activitySummary(entry)} · {formatTime(entry.at)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  )
}
