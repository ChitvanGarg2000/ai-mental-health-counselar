import type { Response } from 'express'

export type RiskLevel = 'crisis' | 'distress' | 'ok'
export type Tone = 'warm' | 'direct' | 'quiet'
export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  role: MessageRole
  content: string
}

export interface AssistantMessage extends ChatMessage {
  id: string
  role: 'assistant'
  at: string
  risk: RiskLevel
}

export interface CrisisResource {
  id: string
  region: string
  name: string
  contact: string
  href: string
  detail: string
  priority?: boolean
}

export type StreamMessage =
  | { type: 'status'; message: string }
  | { type: 'token'; text: string }
  | {
      type: 'safety'
      level: 'crisis'
      message: string
      resources: CrisisResource[]
    }
  | { type: 'done'; message: AssistantMessage }
  | { type: 'error'; message: string }

export type EmitFn = (message: StreamMessage) => void

export interface StreamHandle {
  emit: EmitFn
  close: () => void
}

export type ExpressResponse = Response

export interface PeriodSummary {
  days: number
  activeDays: number
  conversations: number
  exercises: {
    breathing: number
    grounding: number
  }
  moods: Partial<Record<'struggling' | 'low' | 'okay' | 'steady' | 'light', number>>
  streak: number
  tone: Tone
  name: string
}

export class BadRequest extends Error {
  status = 400

  constructor(message: string) {
    super(message)
    this.name = 'BadRequest'
  }
}
