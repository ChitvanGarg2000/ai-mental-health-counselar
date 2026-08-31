import { activitySummary, toLocalDayKey } from '@/store/activity-selectors'
import type { ActivityLogEntry, PracticeKind } from '@/types/activity'
import { PRACTICE_LABELS } from '@/types/activity'
import { MOOD_LABELS, type MoodLevel } from '@/types/mood'
import type { SessionListItem } from '@/types/store'
import { dateFromDayKey } from '@/lib/calendar'

export interface JournalDayData {
  conversations: SessionListItem[]
  practices: ActivityLogEntry[]
}

export function buildJournalDayMap(
  sessions: SessionListItem[],
  activities: ActivityLogEntry[],
): Map<string, JournalDayData> {
  const map = new Map<string, JournalDayData>()

  const ensure = (dayKey: string): JournalDayData => {
    const existing = map.get(dayKey)
    if (existing) return existing
    const created: JournalDayData = { conversations: [], practices: [] }
    map.set(dayKey, created)
    return created
  }

  for (const session of sessions) {
    ensure(toLocalDayKey(session.updatedAt)).conversations.push(session)
  }

  for (const entry of activities) {
    ensure(toLocalDayKey(entry.at)).practices.push(entry)
  }

  for (const bucket of map.values()) {
    bucket.conversations.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    bucket.practices.sort((a, b) => b.at.localeCompare(a.at))
  }

  return map
}

function conversationAriaPhrase(session: SessionListItem): string {
  if (session.startingMood) {
    return `${MOOD_LABELS[session.startingMood]} mood conversation, ${session.title}`
  }
  return `conversation, ${session.title}`
}

function practiceAriaPhrase(entry: ActivityLogEntry): string {
  return `${PRACTICE_LABELS[entry.kind]}, ${activitySummary(entry)}`
}

export function formatDayAriaLabel(dayKey: string, data: JournalDayData | undefined): string {
  const date = dateFromDayKey(dayKey)
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!data || (data.conversations.length === 0 && data.practices.length === 0)) {
    return `${dateLabel}. Nothing recorded.`
  }

  const parts: string[] = [dateLabel]

  if (data.conversations.length > 0) {
    const count = data.conversations.length
    const list = data.conversations.map(conversationAriaPhrase).join('; ')
    parts.push(
      `${count} conversation${count === 1 ? '' : 's'}: ${list}`,
    )
  }

  if (data.practices.length > 0) {
    const count = data.practices.length
    const list = data.practices.map(practiceAriaPhrase).join('; ')
    parts.push(`${count} toolkit practice${count === 1 ? '' : 'es'}: ${list}`)
  }

  return parts.join('. ')
}

export function practiceMarkLabel(kind: PracticeKind): string {
  return PRACTICE_LABELS[kind]
}

export function moodDotLabel(mood: MoodLevel | undefined): string {
  return mood ? MOOD_LABELS[mood] : 'No mood recorded'
}
