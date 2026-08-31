import type { ActivityLogEntry } from '@/types/activity'

const ACTIVITY_LOG_CAP = 500

/** Local calendar day key (YYYY-MM-DD) for grouping. */
export function toLocalDayKey(iso: string): string {
  const date = new Date(iso)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function groupActivityByDay(entries: ActivityLogEntry[]): Map<string, ActivityLogEntry[]> {
  const map = new Map<string, ActivityLogEntry[]>()

  for (const entry of entries) {
    const key = toLocalDayKey(entry.at)
    const bucket = map.get(key)
    if (bucket) {
      bucket.push(entry)
    } else {
      map.set(key, [entry])
    }
  }

  return map
}

export function computePracticeStreak(entries: ActivityLogEntry[]): number {
  if (entries.length === 0) return 0

  const daysWithPractice = new Set(entries.map((entry) => toLocalDayKey(entry.at)))

  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  const todayKey = toLocalDayKey(cursor.toISOString())
  if (!daysWithPractice.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!daysWithPractice.has(toLocalDayKey(cursor.toISOString()))) {
      return 0
    }
  }

  let streak = 0
  while (daysWithPractice.has(toLocalDayKey(cursor.toISOString()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function capActivityLog(entries: ActivityLogEntry[]): ActivityLogEntry[] {
  return entries.length > ACTIVITY_LOG_CAP ? entries.slice(0, ACTIVITY_LOG_CAP) : entries
}

export function activitySummary(entry: ActivityLogEntry): string {
  if (entry.kind === 'box-breathing') {
    return `${entry.rounds} round${entry.rounds === 1 ? '' : 's'}`
  }
  return `${entry.noticedCount} thing${entry.noticedCount === 1 ? '' : 's'} noticed`
}
