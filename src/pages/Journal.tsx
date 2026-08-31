import { lazy, Suspense, useDeferredValue, useMemo, useState, useTransition } from 'react'
import { Link } from 'react-router-dom'
import { Hand, Loader2, MessageCircle, Search, Wind } from 'lucide-react'
import { MoodSparkline } from '@/components/mood-sparkline'
import { JournalReflectCard } from '@/components/journal/journal-reflect-card'
import {
  JournalCalendarFallback,
  SecondaryPageHeader,
} from '@/components/layout/page-shell'
import { Button } from '@/components/ui/button'
import { activitySummary } from '@/store/activity-selectors'
import { useActivityLog, usePracticeStreak } from '@/hooks/use-activity-log'
import { useMoodCheckIns, useSessionList } from '@/hooks/use-app-store'
import { MOOD_LABELS, MOOD_STEPS, type MoodLevel } from '@/types/mood'
import { PRACTICE_LABELS } from '@/types/activity'
import type { ActivityLogEntry } from '@/types/activity'
import type { SessionListItem } from '@/types/store'
import { cn } from '@/lib/utils'

const JournalCalendar = lazy(() =>
  import('@/components/journal/journal-calendar').then((module) => ({
    default: module.JournalCalendar,
  })),
)

type MoodFilter = 'all' | MoodLevel

type JournalItem =
  | { type: 'conversation'; at: string; session: SessionListItem }
  | { type: 'practice'; at: string; entry: ActivityLogEntry }

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function buildJournalItems(
  sessions: SessionListItem[],
  activities: ActivityLogEntry[],
): JournalItem[] {
  const items: JournalItem[] = [
    ...sessions.map(
      (session): JournalItem => ({
        type: 'conversation',
        at: session.updatedAt,
        session,
      }),
    ),
    ...activities.map(
      (entry): JournalItem => ({
        type: 'practice',
        at: entry.at,
        entry,
      }),
    ),
  ]

  return items.sort((a, b) => b.at.localeCompare(a.at))
}

function filterJournalItems(
  items: JournalItem[],
  query: string,
  mood: MoodFilter,
): JournalItem[] {
  const needle = query.trim().toLowerCase()

  return items.filter((item) => {
    if (item.type === 'conversation') {
      if (mood !== 'all' && item.session.startingMood !== mood) return false
      if (!needle) return true

      const when = formatWhen(item.session.updatedAt).toLowerCase()
      return (
        item.session.title.toLowerCase().includes(needle) ||
        item.session.preview.toLowerCase().includes(needle) ||
        when.includes(needle) ||
        'conversation'.includes(needle)
      )
    }

    if (mood !== 'all') return false
    if (!needle) return true

    const label = PRACTICE_LABELS[item.entry.kind].toLowerCase()
    const summary = activitySummary(item.entry).toLowerCase()
    const when = formatWhen(item.entry.at).toLowerCase()

    return (
      label.includes(needle) ||
      summary.includes(needle) ||
      when.includes(needle) ||
      'practice'.includes(needle) ||
      'toolkit'.includes(needle)
    )
  })
}

function Journal() {
  const sessions = useSessionList()
  const activities = useActivityLog()
  const checkIns = useMoodCheckIns()
  const streak = usePracticeStreak()
  const [query, setQuery] = useState('')
  const [moodFilter, setMoodFilter] = useState<MoodFilter>('all')
  const [isMoodPending, startMoodTransition] = useTransition()

  const deferredQuery = useDeferredValue(query)
  const isSearchStale = query !== deferredQuery

  const items = useMemo(
    () => buildJournalItems(sessions, activities),
    [sessions, activities],
  )

  const filtered = useMemo(
    () => filterJournalItems(items, deferredQuery, moodFilter),
    [items, deferredQuery, moodFilter],
  )

  const handleMoodFilter = (next: MoodFilter) => {
    startMoodTransition(() => {
      setMoodFilter(next)
    })
  }

  return (
    <div className="min-h-dvh bg-background">
      <SecondaryPageHeader
        title="Journal"
        subtitle="Conversations, toolkit practice, and how you’ve been arriving"
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <MoodSparkline checkIns={checkIns} />
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-sm font-medium text-foreground">Practice streak</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-primary">
              {streak}
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                day{streak === 1 ? '' : 's'}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Consecutive days with a finished toolkit exercise
            </p>
          </div>
        </div>

        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations and practice…"
            className={cn(
              'w-full rounded-xl border border-input bg-card py-2.5 pr-3 pl-9 text-sm',
              'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
            )}
            aria-label="Search journal"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'struggling', 'low', 'okay', 'steady', 'light'] as const).map((mood) => (
            <Button
              key={mood}
              type="button"
              size="sm"
              variant={moodFilter === mood ? 'default' : 'outline'}
              onClick={() => handleMoodFilter(mood)}
            >
              {mood === 'all' ? 'All' : MOOD_LABELS[mood]}
            </Button>
          ))}
          {isMoodPending ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
              Updating…
            </span>
          ) : null}
        </div>

        <ul
          className={cn(
            'space-y-2 transition-opacity duration-200',
            (isSearchStale || isMoodPending) && 'opacity-50',
          )}
          aria-busy={isSearchStale || isMoodPending}
        >
          {filtered.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">
              {items.length === 0
                ? 'Nothing here yet. Chat from home or finish a toolkit exercise.'
                : 'Nothing matches your search.'}
            </li>
          ) : (
            filtered.map((item) =>
              item.type === 'conversation' ? (
                <li key={`chat-${item.session.id}`}>
                  <Link
                    to={`/chat/${item.session.id}`}
                    className="block rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-start gap-3">
                      <MessageCircle
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">{item.session.title}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {item.session.preview}
                            </p>
                          </div>
                          {item.session.startingMood ? (
                            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-foreground">
                              <span
                                aria-hidden
                                className="size-2.5 rounded-full ring-1 ring-border"
                                style={{
                                  backgroundColor: `var(--mood-${MOOD_STEPS[item.session.startingMood]})`,
                                }}
                              />
                              {MOOD_LABELS[item.session.startingMood]}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Conversation · {formatWhen(item.session.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ) : (
                <li
                  key={`practice-${item.entry.id}`}
                  className="rounded-xl border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    {item.entry.kind === 'box-breathing' ? (
                      <Wind className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <Hand className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {PRACTICE_LABELS[item.entry.kind]}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {activitySummary(item.entry)}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Practice · {formatWhen(item.entry.at)}
                      </p>
                    </div>
                  </div>
                </li>
              ),
            )
          )}
        </ul>

        <Suspense fallback={<JournalCalendarFallback />}>
          <JournalCalendar sessions={sessions} activities={activities} />
        </Suspense>

        <JournalReflectCard />
      </main>
    </div>
  )
}

export default Journal
