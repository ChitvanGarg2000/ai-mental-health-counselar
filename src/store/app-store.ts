import type { AppState, MoodCheckIn, Session, SessionListItem, Settings } from '@/types/store'
import type { ActivityLogEntry } from '@/types/activity'
import type { MoodLevel } from '@/types/mood'
import {
  capActivityLog,
  computePracticeStreak,
  groupActivityByDay,
} from '@/store/activity-selectors.ts'

const STORAGE_KEY = 'haven-app-state'
const PERSIST_DELAY_MS = 400

const DEFAULT_SETTINGS: Settings = {
  tone: 'warm',
  name: '',
  motion: 'system',
}

function createEmptyState(): AppState {
  return {
    sessions: {},
    sessionOrder: [],
    moodCheckIns: [],
    activityLog: [],
    settings: { ...DEFAULT_SETTINGS },
  }
}

function loadState(): AppState {
  if (typeof window === 'undefined') return createEmptyState()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createEmptyState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed.sessions || !Array.isArray(parsed.sessionOrder) || !parsed.settings) {
      return createEmptyState()
    }
    return {
      ...createEmptyState(),
      ...parsed,
      moodCheckIns: Array.isArray(parsed.moodCheckIns) ? parsed.moodCheckIns : [],
      activityLog: Array.isArray(parsed.activityLog) ? parsed.activityLog : [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...parsed.settings,
        motion: parsed.settings.motion ?? DEFAULT_SETTINGS.motion,
      },
    }
  } catch {
    return createEmptyState()
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function deriveTitle(messages: Session['messages']): string {
  const firstUser = messages.find((message) => message.role === 'user')
  if (!firstUser) return 'New conversation'
  const snippet = firstUser.text.trim().slice(0, 48)
  return snippet.length < firstUser.text.trim().length ? `${snippet}…` : snippet
}

function derivePreview(messages: Session['messages']): string {
  const last = messages[messages.length - 1]
  if (!last) return 'No messages yet'
  const snippet = last.text.trim().slice(0, 72)
  return snippet.length < last.text.trim().length ? `${snippet}…` : snippet
}

function createStore() {
  let state = loadState()
  const listeners = new Set<() => void>()

  let listSnapshot: SessionListItem[] = []
  let listSnapshotForState: AppState | null = null

  let settingsSnapshot: Settings | null = null
  let settingsSnapshotForState: AppState | null = null

  let moodCheckInsSnapshot: MoodCheckIn[] = []
  let moodCheckInsSnapshotForState: AppState | null = null

  let activityLogSnapshot: ActivityLogEntry[] = []
  let activityLogSnapshotForState: AppState | null = null

  let activityByDaySnapshot: Map<string, ActivityLogEntry[]> = new Map()
  let activityByDaySnapshotForState: AppState | null = null

  let practiceStreakSnapshot = 0
  let practiceStreakSnapshotForState: AppState | null = null

  let persistTimer: ReturnType<typeof setTimeout> | null = null

  function emit() {
    listeners.forEach((listener) => listener())
  }

  function schedulePersist() {
    if (typeof window === 'undefined') return
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      persistTimer = null
    }, PERSIST_DELAY_MS)
  }

  function commit(next: AppState) {
    if (next === state) return
    state = next
    listSnapshotForState = null
    settingsSnapshotForState = null
    moodCheckInsSnapshotForState = null
    activityLogSnapshotForState = null
    activityByDaySnapshotForState = null
    practiceStreakSnapshotForState = null
    emit()
    schedulePersist()
  }

  function subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  function getSnapshot(): AppState {
    return state
  }

  function getSessionListSnapshot(): SessionListItem[] {
    if (listSnapshotForState === state) return listSnapshot

    listSnapshot = state.sessionOrder
      .map((id) => state.sessions[id])
      .filter((session): session is Session => Boolean(session))
      .map((session) => ({
        id: session.id,
        title: session.title,
        updatedAt: session.updatedAt,
        preview: derivePreview(session.messages),
        startingMood: session.startingMood,
      }))

    listSnapshotForState = state
    return listSnapshot
  }

  function getSessionSnapshot(id: string): Session | null {
    return state.sessions[id] ?? null
  }

  function getSettingsSnapshot(): Settings {
    if (settingsSnapshotForState === state && settingsSnapshot) {
      return settingsSnapshot
    }
    settingsSnapshot = state.settings
    settingsSnapshotForState = state
    return settingsSnapshot
  }

  function getMoodCheckInsSnapshot(): MoodCheckIn[] {
    if (moodCheckInsSnapshotForState === state) return moodCheckInsSnapshot
    moodCheckInsSnapshot = state.moodCheckIns
    moodCheckInsSnapshotForState = state
    return moodCheckInsSnapshot
  }

  function getActivityLogSnapshot(): ActivityLogEntry[] {
    if (activityLogSnapshotForState === state) return activityLogSnapshot
    activityLogSnapshot = state.activityLog
    activityLogSnapshotForState = state
    return activityLogSnapshot
  }

  function getActivityByDaySnapshot(): Map<string, ActivityLogEntry[]> {
    if (activityByDaySnapshotForState === state) return activityByDaySnapshot
    activityByDaySnapshot = groupActivityByDay(state.activityLog)
    activityByDaySnapshotForState = state
    return activityByDaySnapshot
  }

  function getPracticeStreakSnapshot(): number {
    if (practiceStreakSnapshotForState === state) return practiceStreakSnapshot
    practiceStreakSnapshot = computePracticeStreak(state.activityLog)
    practiceStreakSnapshotForState = state
    return practiceStreakSnapshot
  }

  type RecordActivityInput =
    | { kind: 'box-breathing'; rounds: number }
    | { kind: 'grounding'; noticedCount: number }

  function recordActivity(input: RecordActivityInput): string {
    const at = new Date().toISOString()
    const id = uid('activity')

    const entry: ActivityLogEntry =
      input.kind === 'box-breathing'
        ? { id, kind: 'box-breathing', at, rounds: input.rounds }
        : { id, kind: 'grounding', at, noticedCount: input.noticedCount }

    commit({
      ...state,
      activityLog: capActivityLog([entry, ...state.activityLog]),
    })

    return id
  }

  interface CreateSessionOptions {
    startingMood?: MoodLevel
  }

  function createSession(
    seedMessages: Session['messages'] = [],
    options: CreateSessionOptions = {},
  ): string {
    const id = uid('session')
    const now = new Date().toISOString()
    const session: Session = {
      id,
      title: deriveTitle(seedMessages),
      createdAt: now,
      updatedAt: now,
      messages: seedMessages,
      startingMood: options.startingMood,
    }

    commit({
      ...state,
      sessions: { ...state.sessions, [id]: session },
      sessionOrder: [id, ...state.sessionOrder],
    })

    return id
  }

  function recordMoodCheckIn(mood: MoodLevel): string {
    const checkIn: MoodCheckIn = {
      id: uid('mood'),
      mood,
      at: new Date().toISOString(),
    }

    commit({
      ...state,
      moodCheckIns: [checkIn, ...state.moodCheckIns].slice(0, 90),
    })

    return checkIn.id
  }

  function appendMessage(sessionId: string, message: Session['messages'][number]) {
    const session = state.sessions[sessionId]
    if (!session) return

    const messages = [...session.messages, message]
    const updatedAt = new Date().toISOString()
    const nextSession: Session = {
      ...session,
      messages,
      updatedAt,
      title: session.title === 'New conversation' ? deriveTitle(messages) : session.title,
    }

    commit({
      ...state,
      sessions: { ...state.sessions, [sessionId]: nextSession },
    })
  }

  function updateMessageText(sessionId: string, messageId: string, text: string) {
    const session = state.sessions[sessionId]
    if (!session) return

    const index = session.messages.findIndex((message) => message.id === messageId)
    if (index === -1) return

    const existing = session.messages[index]!
    if (existing.text === text) return

    const messages = session.messages.slice()
    messages[index] = { ...existing, text }

    const nextSession: Session = {
      ...session,
      messages,
      updatedAt: new Date().toISOString(),
    }

    commit({
      ...state,
      sessions: { ...state.sessions, [sessionId]: nextSession },
    })
  }

  function replaceMessages(sessionId: string, messages: Session['messages']) {
    const session = state.sessions[sessionId]
    if (!session) return

    const nextSession: Session = {
      ...session,
      messages,
      updatedAt: new Date().toISOString(),
      title: deriveTitle(messages),
    }

    commit({
      ...state,
      sessions: { ...state.sessions, [sessionId]: nextSession },
    })
  }

  function updateSettings(patch: Partial<Settings>) {
    const nextSettings = { ...state.settings, ...patch }
    if (
      nextSettings.tone === state.settings.tone &&
      nextSettings.name === state.settings.name &&
      nextSettings.motion === state.settings.motion
    ) {
      return
    }

    commit({
      ...state,
      settings: nextSettings,
    })
  }

  function deleteAllConversations() {
    if (state.sessionOrder.length === 0) return

    commit({
      ...state,
      sessions: {},
      sessionOrder: [],
    })
  }

  function deleteSession(sessionId: string) {
    if (!state.sessions[sessionId]) return

    const { [sessionId]: _removed, ...sessions } = state.sessions
    commit({
      ...state,
      sessions,
      sessionOrder: state.sessionOrder.filter((id) => id !== sessionId),
    })
  }

  function flushPersist() {
    if (typeof window === 'undefined') return
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return {
    subscribe,
    getSnapshot,
    getSessionListSnapshot,
    getSessionSnapshot,
    getSettingsSnapshot,
    getMoodCheckInsSnapshot,
    getActivityLogSnapshot,
    getActivityByDaySnapshot,
    getPracticeStreakSnapshot,
    createSession,
    recordMoodCheckIn,
    recordActivity,
    appendMessage,
    updateMessageText,
    replaceMessages,
    updateSettings,
    deleteAllConversations,
    deleteSession,
    flushPersist,
  }
}

export const appStore = createStore()

export function createMessageId() {
  return uid('m')
}
