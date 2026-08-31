import type { ReflectFormState, ReflectRequestBody, ReflectResponse } from '@/types/reflect'
import { INITIAL_REFLECT_STATE } from '@/types/reflect'
import { apiUrl } from '@/lib/api'

export async function reflectAction(
  _previousState: ReflectFormState,
  formData: FormData,
): Promise<ReflectFormState> {
  const raw = formData.get('payload')
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return {
      ...INITIAL_REFLECT_STATE,
      error: 'Could not read your activity counts.',
    }
  }

  let body: ReflectRequestBody
  try {
    body = JSON.parse(raw) as ReflectRequestBody
  } catch {
    return {
      ...INITIAL_REFLECT_STATE,
      error: 'Could not read your activity counts.',
    }
  }

  try {
    const response = await fetch(apiUrl('/api/reflect'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const detail = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(detail?.error ?? `Reflection failed (${response.status})`)
    }

    const result = (await response.json()) as ReflectResponse
    return {
      reflection: result.reflection,
      source: result.source,
      error: null,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not build reflection.'
    return {
      ...INITIAL_REFLECT_STATE,
      error: message,
    }
  }
}
