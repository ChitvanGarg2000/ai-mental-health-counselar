import { computePracticeStreak, toLocalDayKey } from '@/store/activity-selectors'
import { toLocalDayKeyFromDate } from '@/lib/calendar'
import type { ActivityLogEntry } from '@/types/activity'
import type { PeriodSummaryPayload } from '@/types/reflect'
import type { MoodLevel } from '@/types/mood'
import type { MoodCheckIn, SessionListItem } from '@/types/store'

export const REFLECT_PERIOD_DAYS = 7

function periodStart(days: number): Date {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return start
}

function isOnOrAfterPeriodStart(iso: string, start: Date): boolean {
  return new Date(iso) >= start
}

function collectActiveDayKeys(
  sessions: SessionListItem[],
  activities: ActivityLogEntry[],
  moodCheckIns: MoodCheckIn[],
  start: Date,
): Set<string> {
  const keys = new Set<string>()

  for (const session of sessions) {
    if (isOnOrAfterPeriodStart(session.updatedAt, start)) {
      keys.add(toLocalDayKey(session.updatedAt))
    }
  }

  for (const entry of activities) {
    if (isOnOrAfterPeriodStart(entry.at, start)) {
      keys.add(toLocalDayKey(entry.at))
    }
  }

  for (const checkIn of moodCheckIns) {
    if (isOnOrAfterPeriodStart(checkIn.at, start)) {
      keys.add(toLocalDayKey(checkIn.at))
    }
  }

  return keys
}

export function computeActiveDayStreak(
  sessions: SessionListItem[],
  activities: ActivityLogEntry[],
  moodCheckIns: MoodCheckIn[],
): number {
  const keys = new Set<string>()

  for (const session of sessions) {
    keys.add(toLocalDayKey(session.updatedAt))
  }
  for (const entry of activities) {
    keys.add(toLocalDayKey(entry.at))
  }
  for (const checkIn of moodCheckIns) {
    keys.add(toLocalDayKey(checkIn.at))
  }

  if (keys.size === 0) return 0

  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)

  const todayKey = toLocalDayKeyFromDate(cursor)
  if (!keys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1)
    if (!keys.has(toLocalDayKeyFromDate(cursor))) {
      return 0
    }
  }

  let streak = 0
  while (keys.has(toLocalDayKeyFromDate(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function buildPeriodSummary(
  sessions: SessionListItem[],
  activities: ActivityLogEntry[],
  moodCheckIns: MoodCheckIn[],
  days = REFLECT_PERIOD_DAYS,
): PeriodSummaryPayload {
  const start = periodStart(days)

  const activeDayKeys = collectActiveDayKeys(sessions, activities, moodCheckIns, start)

  const conversations = sessions.filter((session) =>
    isOnOrAfterPeriodStart(session.updatedAt, start),
  ).length

  const periodActivities = activities.filter((entry) => isOnOrAfterPeriodStart(entry.at, start))

  const moods: Partial<Record<MoodLevel, number>> = {}
  for (const checkIn of moodCheckIns) {
    if (!isOnOrAfterPeriodStart(checkIn.at, start)) continue
    moods[checkIn.mood] = (moods[checkIn.mood] ?? 0) + 1
  }

  return {
    days,
    activeDays: activeDayKeys.size,
    conversations,
    exercises: {
      breathing: periodActivities.filter((entry) => entry.kind === 'box-breathing').length,
      grounding: periodActivities.filter((entry) => entry.kind === 'grounding').length,
    },
    moods,
    streak: Math.max(
      computeActiveDayStreak(sessions, activities, moodCheckIns),
      computePracticeStreak(activities),
    ),
  }
}
