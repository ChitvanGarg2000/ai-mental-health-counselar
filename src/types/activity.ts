export type PracticeKind = 'box-breathing' | 'grounding'

export interface BoxBreathingActivity {
  id: string
  kind: 'box-breathing'
  at: string
  rounds: number
}

export interface GroundingActivity {
  id: string
  kind: 'grounding'
  at: string
  noticedCount: number
}

export type ActivityLogEntry = BoxBreathingActivity | GroundingActivity

export const PRACTICE_LABELS: Record<PracticeKind, string> = {
  'box-breathing': 'Box breathing',
  grounding: '5-4-3-2-1 grounding',
}
