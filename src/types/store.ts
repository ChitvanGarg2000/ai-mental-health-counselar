import type { Message } from './chat'
import type { ActivityLogEntry } from './activity'
import type { MoodLevel } from './mood'

export type Tone = 'warm' | 'direct' | 'quiet'

export interface MoodCheckIn {
  id: string
  mood: MoodLevel
  at: string
}

/** Overrides OS `prefers-reduced-motion` when not `system`. */
export type MotionPreference = 'system' | 'reduce' | 'allow'

export interface Settings {
  tone: Tone
  name: string
  motion: MotionPreference
}

export interface Session {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: Message[]
  startingMood?: MoodLevel
}

export interface SessionListItem {
  id: string
  title: string
  updatedAt: string
  preview: string
  startingMood?: MoodLevel
}

export interface AppState {
  sessions: Record<string, Session>
  sessionOrder: string[]
  moodCheckIns: MoodCheckIn[]
  activityLog: ActivityLogEntry[]
  settings: Settings
}
