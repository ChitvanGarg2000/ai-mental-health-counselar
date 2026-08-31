export interface SafetyResource {
  id: string
  region?: string
  name: string
  contact: string
  href: string
  detail: string
}

export interface SafetyAlert {
  level: 'crisis'
  message: string
  resources: SafetyResource[]
}

export type StreamEvent =
  | { type: 'status'; message: string }
  | { type: 'token'; text: string }
  | {
      type: 'done'
      message: {
        id: string
        role: 'assistant'
        content: string
        at: string
      }
    }
  | { type: 'error'; message: string }
  | {
      type: 'safety'
      level: 'crisis'
      message: string
      resources: SafetyResource[]
    }
