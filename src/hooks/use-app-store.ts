import { useDebugValue, useSyncExternalStore } from 'react'
import { appStore } from '@/store/app-store'
import type { Session, SessionListItem, Settings } from '@/types/store'

export function useSessionList(): SessionListItem[] {
  const sessions = useSyncExternalStore(
    appStore.subscribe,
    appStore.getSessionListSnapshot,
    appStore.getSessionListSnapshot,
  )

  useDebugValue(sessions, (list) => `SessionList(${list.length})`)

  return sessions
}

export function useSession(sessionId: string | undefined): Session | null {
  return useSyncExternalStore(
    appStore.subscribe,
    () => (sessionId ? appStore.getSessionSnapshot(sessionId) : null),
    () => null,
  )
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    appStore.subscribe,
    appStore.getSettingsSnapshot,
    appStore.getSettingsSnapshot,
  )
}

export function useMoodCheckIns() {
  const checkIns = useSyncExternalStore(
    appStore.subscribe,
    appStore.getMoodCheckInsSnapshot,
    () => [],
  )

  useDebugValue(checkIns, (list) => `MoodCheckIns(${list.length})`)

  return checkIns
}
