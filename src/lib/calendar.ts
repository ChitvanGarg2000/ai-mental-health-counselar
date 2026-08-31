/** Local calendar day key (YYYY-MM-DD) — always uses the environment timezone. */
export function toLocalDayKeyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function dateFromDayKey(dayKey: string): Date {
  const [year, month, day] = dayKey.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

export const CALENDAR_WEEKS = 6
export const CALENDAR_DAYS = CALENDAR_WEEKS * 7

export const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

export interface CalendarCell {
  date: Date
  dayKey: string
  inMonth: boolean
}

export function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const firstOfMonth = new Date(year, month, 1)
  const leadingDays = firstOfMonth.getDay()
  const gridStart = new Date(year, month, 1 - leadingDays)

  return Array.from({ length: CALENDAR_DAYS }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return {
      date,
      dayKey: toLocalDayKeyFromDate(date),
      inMonth: date.getMonth() === month,
    }
  })
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date)
  const day = next.getDate()
  next.setDate(1)
  next.setMonth(next.getMonth() + months)
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
  next.setDate(Math.min(day, lastDay))
  return next
}

export function startOfWeek(date: Date): Date {
  const start = new Date(date)
  start.setDate(start.getDate() - start.getDay())
  start.setHours(0, 0, 0, 0)
  return start
}

export function endOfWeek(date: Date): Date {
  const end = startOfWeek(date)
  end.setDate(end.getDate() + 6)
  return end
}

export function monthYearLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}
