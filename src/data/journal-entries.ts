export type JournalMood = 'struggling' | 'low' | 'okay' | 'steady' | 'light'

export interface JournalEntry {
  id: string
  title: string
  excerpt: string
  mood: JournalMood
  date: string
}

const MOODS: JournalMood[] = ['struggling', 'low', 'okay', 'steady', 'light']

const TITLES = [
  'Morning check-in',
  'After work unwind',
  'Weekend reflection',
  'Sleep thoughts',
  'Conversation recap',
  'Toolkit note',
  'Quiet evening',
  'Midweek pause',
  'Gratitude moment',
  'Heavy afternoon',
]

const EXCERPTS = [
  'Named the anxiety without trying to fix it right away.',
  'Breathing exercise helped before replying to that email.',
  'Felt lighter after writing three sentences.',
  'Still processing the conversation from yesterday.',
  'Noticed tension in shoulders — took a short walk.',
  'Hard to start, but showing up counted.',
  'Mood was low at arrival, steadier by the end.',
  'Journaled about work boundaries again.',
  'Slept poorly but checked in anyway.',
  'Remembered to ask for help from a friend.',
]

function pick<T>(list: T[], index: number): T {
  return list[index % list.length]!
}

/** Seed entries so search/filter has enough rows to feel the defer/transition split. */
export function createJournalEntries(count = 72): JournalEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const day = new Date()
    day.setDate(day.getDate() - index)

    return {
      id: `journal-${index}`,
      title: `${pick(TITLES, index)} #${index + 1}`,
      excerpt: pick(EXCERPTS, index + 3),
      mood: pick(MOODS, index),
      date: day.toISOString().slice(0, 10),
    }
  })
}

export const JOURNAL_ENTRIES = createJournalEntries()

export const MOOD_LABELS: Record<JournalMood, string> = {
  struggling: 'Struggling',
  low: 'Low',
  okay: 'Okay',
  steady: 'Steady',
  light: 'Light',
}

export const MOOD_STEPS: Record<JournalMood, number> = {
  struggling: 1,
  low: 2,
  okay: 3,
  steady: 4,
  light: 5,
}
