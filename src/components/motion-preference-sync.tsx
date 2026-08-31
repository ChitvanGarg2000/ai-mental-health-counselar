import { useEffect } from 'react'
import { useSettings } from '@/hooks/use-app-store'

/** Syncs the motion preference to `html[data-motion]` for CSS animation overrides. */
export function MotionPreferenceSync() {
  const { motion } = useSettings()

  useEffect(() => {
    const root = document.documentElement
    if (motion === 'system') {
      root.removeAttribute('data-motion')
      return
    }
    root.dataset.motion = motion
  }, [motion])

  return null
}
