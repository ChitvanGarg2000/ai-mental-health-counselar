import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type KeyboardEvent,
} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { JournalDayPanel } from '@/components/journal/journal-day-panel'
import {
  addDays,
  addMonths,
  buildCalendarGrid,
  CALENDAR_DAYS,
  dateFromDayKey,
  endOfWeek,
  monthYearLabel,
  startOfWeek,
  toLocalDayKeyFromDate,
  WEEKDAY_HEADERS,
} from '@/lib/calendar'
import {
  buildJournalDayMap,
  formatDayAriaLabel,
  type JournalDayData,
} from '@/lib/journal-day-bucket'
import { MOOD_STEPS } from '@/types/mood'
import type { ActivityLogEntry } from '@/types/activity'
import type { SessionListItem } from '@/types/store'
import { cn } from '@/lib/utils'

interface JournalCalendarProps {
  sessions: SessionListItem[]
  activities: ActivityLogEntry[]
}

interface ViewMonth {
  year: number
  month: number
}

function todayParts(): ViewMonth {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() }
}

function DayMarks({ data }: { data: JournalDayData | undefined }) {
  if (!data || (data.conversations.length === 0 && data.practices.length === 0)) {
    return null
  }

  return (
    <div className="mt-1 flex flex-wrap justify-center gap-0.5" aria-hidden>
      {data.conversations.map((session) => (
        <span
          key={session.id}
          className="size-1.5 rounded-full ring-1 ring-border/60"
          style={{
            backgroundColor: session.startingMood
              ? `var(--mood-${MOOD_STEPS[session.startingMood]})`
              : 'var(--muted-foreground)',
          }}
        />
      ))}
      {data.practices.map((entry) => (
        <span
          key={entry.id}
          className="size-1.5 rotate-45 rounded-[1px] bg-primary ring-1 ring-primary/30"
        />
      ))}
    </div>
  )
}

export function JournalCalendar({ sessions, activities }: JournalCalendarProps) {
  const dayMap = useMemo(
    () => buildJournalDayMap(sessions, activities),
    [sessions, activities],
  )

  const [viewMonth, setViewMonth] = useState<ViewMonth>(todayParts)
  const [focusedDayKey, setFocusedDayKey] = useState(() => toLocalDayKeyFromDate(new Date()))
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)
  const [isMonthPending, startMonthTransition] = useTransition()

  const gridRef = useRef<HTMLDivElement>(null)
  const cellRefs = useRef<Map<string, HTMLDivElement>>(new Map())

  const cells = useMemo(
    () => buildCalendarGrid(viewMonth.year, viewMonth.month),
    [viewMonth.year, viewMonth.month],
  )

  const monthLabel = monthYearLabel(viewMonth.year, viewMonth.month)

  const moveToDate = useCallback((date: Date) => {
    const dayKey = toLocalDayKeyFromDate(date)
    startMonthTransition(() => {
      setViewMonth({ year: date.getFullYear(), month: date.getMonth() })
      setFocusedDayKey(dayKey)
    })
  }, [])

  const shiftMonth = useCallback(
    (delta: number) => {
      const focused = dateFromDayKey(focusedDayKey)
      moveToDate(addMonths(focused, delta))
    },
    [focusedDayKey, moveToDate],
  )

  useEffect(() => {
    const node = cellRefs.current.get(focusedDayKey)
    node?.focus()
  }, [focusedDayKey, viewMonth.year, viewMonth.month])

  const handleGridKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const focused = dateFromDayKey(focusedDayKey)

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        moveToDate(addDays(focused, -1))
        return
      case 'ArrowRight':
        event.preventDefault()
        moveToDate(addDays(focused, 1))
        return
      case 'ArrowUp':
        event.preventDefault()
        moveToDate(addDays(focused, -7))
        return
      case 'ArrowDown':
        event.preventDefault()
        moveToDate(addDays(focused, 7))
        return
      case 'Home':
        event.preventDefault()
        moveToDate(startOfWeek(focused))
        return
      case 'End':
        event.preventDefault()
        moveToDate(endOfWeek(focused))
        return
      case 'PageUp':
        event.preventDefault()
        shiftMonth(-1)
        return
      case 'PageDown':
        event.preventDefault()
        shiftMonth(1)
        return
      case 'Enter':
      case ' ':
        event.preventDefault()
        setSelectedDayKey(focusedDayKey)
        return
      case 'Escape':
        setSelectedDayKey(null)
        return
      default:
        return
    }
  }

  const weeks = useMemo(() => {
    const rows: (typeof cells)[] = []
    for (let index = 0; index < CALENDAR_DAYS; index += 7) {
      rows.push(cells.slice(index, index + 7))
    }
    return rows
  }, [cells])

  return (
    <section className="space-y-3" aria-label="Journal calendar">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">{monthLabel}</h2>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Previous month"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              moveToDate(today)
              setSelectedDayKey(toLocalDayKeyFromDate(today))
            }}
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Next month"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={monthLabel}
        aria-busy={isMonthPending}
        onKeyDown={handleGridKeyDown}
        className={cn(
          'rounded-xl border border-border bg-card p-2 transition-opacity duration-200',
          isMonthPending && 'pointer-events-none opacity-40',
        )}
      >
        <div role="row" className="grid grid-cols-7 gap-1">
          {WEEKDAY_HEADERS.map((label) => (
            <div
              key={label}
              role="columnheader"
              className="py-1 text-center text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>

        <div role="rowgroup">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} role="row" className="mt-1 grid grid-cols-7 gap-1">
              {week.map((cell) => {
                const data = dayMap.get(cell.dayKey)
                const isFocused = focusedDayKey === cell.dayKey
                const isSelected = selectedDayKey === cell.dayKey
                const isToday = cell.dayKey === toLocalDayKeyFromDate(new Date())

                return (
                  <div
                    key={cell.dayKey}
                    ref={(node) => {
                      if (node) cellRefs.current.set(cell.dayKey, node)
                      else cellRefs.current.delete(cell.dayKey)
                    }}
                    role="gridcell"
                    tabIndex={isFocused ? 0 : -1}
                    aria-label={formatDayAriaLabel(cell.dayKey, data)}
                    aria-selected={isSelected}
                    onClick={() => {
                      setFocusedDayKey(cell.dayKey)
                      setSelectedDayKey(cell.dayKey)
                      startMonthTransition(() => {
                        setViewMonth({
                          year: cell.date.getFullYear(),
                          month: cell.date.getMonth(),
                        })
                      })
                    }}
                    onFocus={() => setFocusedDayKey(cell.dayKey)}
                    className={cn(
                      'flex min-h-14 flex-col items-center rounded-lg px-0.5 py-1 text-center outline-none',
                      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                      cell.inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                      isSelected && 'bg-primary/10 ring-1 ring-primary/30',
                      isToday && !isSelected && 'ring-1 ring-border',
                    )}
                  >
                    <span className="text-xs font-medium tabular-nums">{cell.date.getDate()}</span>
                    <DayMarks data={data} />
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>

      {selectedDayKey ? (
        <JournalDayPanel
          dayKey={selectedDayKey}
          data={dayMap.get(selectedDayKey)}
          onClose={() => setSelectedDayKey(null)}
        />
      ) : null}
    </section>
  )
}
