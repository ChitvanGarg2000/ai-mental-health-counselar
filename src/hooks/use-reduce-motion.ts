import { useSyncExternalStore } from 'react'
import { useSettings } from '@/hooks/use-app-store'

const MEDIA_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToOsMotionPreference(listener: () => void) {
  const media = window.matchMedia(MEDIA_QUERY)
  media.addEventListener('change', listener)
  return () => media.removeEventListener('change', listener)
}

function getOsMotionPreference() {
  return window.matchMedia(MEDIA_QUERY).matches
}

/** User motion setting layered on top of the OS `prefers-reduced-motion` preference. */
export function useReduceMotion(): boolean {
  const { motion } = useSettings()
  const osPrefersReduce = useSyncExternalStore(
    subscribeToOsMotionPreference,
    getOsMotionPreference,
    () => false,
  )

  if (motion === 'reduce') return true
  if (motion === 'allow') return false
  return osPrefersReduce
}
