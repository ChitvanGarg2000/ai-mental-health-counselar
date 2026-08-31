import { useSyncExternalStore } from 'react'
import { onlineStore } from '@/store/online-store'

export function useOnline(): boolean {
  return useSyncExternalStore(
    onlineStore.subscribe,
    onlineStore.getSnapshot,
    () => true,
  )
}
