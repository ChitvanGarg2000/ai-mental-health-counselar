import { useEffect, useState } from 'react'
import {
  FALLBACK_CRISIS_DISCLAIMER,
  FALLBACK_CRISIS_RESOURCES,
} from '@/data/crisis-resources-fallback'
import { apiUrl } from '@/lib/api'
import type { SafetyResource } from '@/types/stream'

interface CrisisResourcesResponse {
  disclaimer: string
  resources: SafetyResource[]
}

export function useCrisisResources() {
  const [resources, setResources] = useState<SafetyResource[]>(FALLBACK_CRISIS_RESOURCES)
  const [disclaimer, setDisclaimer] = useState<string>(FALLBACK_CRISIS_DISCLAIMER)
  const [loading, setLoading] = useState(true)
  const [usingFallback, setUsingFallback] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(apiUrl('/api/crisis-resources'))
        if (!response.ok) {
          throw new Error(`Could not load crisis resources (${response.status})`)
        }
        const data = (await response.json()) as CrisisResourcesResponse
        if (cancelled) return
        if (data.resources.length > 0) {
          setResources(data.resources)
          setDisclaimer(data.disclaimer)
          setUsingFallback(false)
        }
      } catch {
        if (cancelled) return
        setUsingFallback(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  return { resources, disclaimer, loading, usingFallback }
}
