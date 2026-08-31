import type { Tone } from '@/types/store'
import type { MoodLevel } from '@/types/mood'

export interface PeriodSummaryPayload {
  days: number
  activeDays: number
  conversations: number
  exercises: {
    breathing: number
    grounding: number
  }
  moods: Partial<Record<MoodLevel, number>>
  streak: number
}

export interface ReflectRequestBody {
  summary: PeriodSummaryPayload
  tone?: Tone
  name?: string
}

export type ReflectSource = 'model' | 'template'

export interface ReflectResponse {
  reflection: string
  source: ReflectSource
}

export interface ReflectFormState {
  reflection: string | null
  source: ReflectSource | null
  error: string | null
}

export const INITIAL_REFLECT_STATE: ReflectFormState = {
  reflection: null,
  source: null,
  error: null,
}
