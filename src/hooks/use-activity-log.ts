import { useDebugValue, useSyncExternalStore } from 'react'
import { appStore } from '@/store/app-store'
import { activitySummary } from '@/store/activity-selectors'
import type { ActivityLogEntry } from '@/types/activity'

export function useActivityLog(): ActivityLogEntry[] {
  const log = useSyncExternalStore(
    appStore.subscribe,
    appStore.getActivityLogSnapshot,
    () => [],
  )

  useDebugValue(log, (entries) =>
    entries.length === 0
      ? 'ActivityLog(0)'
      : `ActivityLog(${entries.length}) · latest ${activitySummary(entries[0]!)}`,
  )

  return log
}

export function useActivityLogByDay(): Map<string, ActivityLogEntry[]> {
  const byDay = useSyncExternalStore(
    appStore.subscribe,
    appStore.getActivityByDaySnapshot,
    () => new Map(),
  )

  useDebugValue(byDay, (map) => `ActivityByDay(${map.size} days)`)

  return byDay
}

export function usePracticeStreak(): number {
  const streak = useSyncExternalStore(
    appStore.subscribe,
    appStore.getPracticeStreakSnapshot,
    () => 0,
  )

  useDebugValue(streak, (days) => `PracticeStreak(${days} day${days === 1 ? '' : 's'})`)

  return streak
}
