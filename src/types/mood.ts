export type MoodLevel = 'struggling' | 'low' | 'okay' | 'steady' | 'light'

export const MOOD_LEVELS: MoodLevel[] = [
  'struggling',
  'low',
  'okay',
  'steady',
  'light',
]

export const MOOD_LABELS: Record<MoodLevel, string> = {
  struggling: 'Struggling',
  low: 'Low',
  okay: 'Okay',
  steady: 'Steady',
  light: 'Light',
}

export const MOOD_STEPS: Record<MoodLevel, number> = {
  struggling: 1,
  low: 2,
  okay: 3,
  steady: 4,
  light: 5,
}
