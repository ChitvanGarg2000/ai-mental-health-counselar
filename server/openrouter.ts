import type { ChatMessage, EmitFn } from './types.ts'

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'

const FREE_MODELS = [
  process.env.OPENROUTER_MODEL,
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'openai/gpt-oss-20b:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'inclusionai/ling-3.0-flash:free',
].filter((model): model is string => Boolean(model))

export function aiEnabled(): boolean {
  return Boolean(process.env.OPEN_ROUTER_API_KEY)
}

async function readSse(
  response: Response,
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error('OpenRouter response had no body')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    if (signal?.aborted) {
      await reader.cancel().catch(() => {})
      return
    }

    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue

      const payload = trimmed.slice(5).trim()
      if (!payload || payload === '[DONE]') continue

      try {
        const parsed = JSON.parse(payload) as {
          choices?: Array<{ delta?: { content?: string } }>
        }
        const delta = parsed.choices?.[0]?.delta?.content
        if (delta) onDelta(delta)
      } catch {
        // Keep-alive or comment line.
      }
    }
  }
}

interface StreamModelOptions {
  apiKey: string
  model: string
  messages: ChatMessage[]
  systemPrompt: string
  emit: EmitFn
  signal?: AbortSignal
}

async function streamModel({
  apiKey,
  model,
  messages,
  systemPrompt,
  emit,
  signal,
}: StreamModelOptions): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_PUBLIC_URL ?? 'http://localhost:5173',
      'X-Title': 'Haven AI support companion',
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.75,
      max_tokens: 320,
      reasoning: { enabled: false, exclude: true },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter responded ${response.status} for ${model}`)
  }

  let full = ''

  await readSse(
    response,
    (delta) => {
      full += delta
      emit({ type: 'token', text: delta })
    },
    signal,
  )

  return full.trim()
}

interface StreamModelReplyOptions {
  messages: ChatMessage[]
  systemPrompt: string
  emit: EmitFn
  signal?: AbortSignal
}

export async function streamModelReply({
  messages,
  systemPrompt,
  emit,
  signal,
}: StreamModelReplyOptions): Promise<string> {
  const apiKey = process.env.OPEN_ROUTER_API_KEY
  if (!apiKey) throw new Error('OPEN_ROUTER_API_KEY is missing')

  let lastError: Error | undefined

  for (const model of FREE_MODELS) {
    if (signal?.aborted) return ''

    emit({ type: 'status', message: 'Haven is thinking…' })

    try {
      const reply = await streamModel({
        apiKey,
        model,
        messages,
        systemPrompt,
        emit,
        signal,
      })
      if (reply) return reply
      lastError = new Error(`${model} returned an empty reply`)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return ''
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError ?? new Error('No model returned a reply')
}

interface CompleteModelReplyOptions {
  messages: ChatMessage[]
  systemPrompt: string
  signal?: AbortSignal
}

export async function completeModelReply({
  messages,
  systemPrompt,
  signal,
}: CompleteModelReplyOptions): Promise<string> {
  const apiKey = process.env.OPEN_ROUTER_API_KEY
  if (!apiKey) throw new Error('OPEN_ROUTER_API_KEY is missing')

  let lastError: Error | undefined

  for (const model of FREE_MODELS) {
    if (signal?.aborted) return ''

    try {
      const reply = await completeModel({
        apiKey,
        model,
        messages,
        systemPrompt,
        signal,
      })
      if (reply) return reply
      lastError = new Error(`${model} returned an empty reply`)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return ''
      lastError = error instanceof Error ? error : new Error(String(error))
    }
  }

  throw lastError ?? new Error('No model returned a reply')
}

async function completeModel({
  apiKey,
  model,
  messages,
  systemPrompt,
  signal,
}: Omit<StreamModelOptions, 'emit'>): Promise<string> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    signal,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.APP_PUBLIC_URL ?? 'http://localhost:5173',
      'X-Title': 'Haven AI support companion',
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0.7,
      max_tokens: 120,
      reasoning: { enabled: false, exclude: true },
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(({ role, content }) => ({ role, content })),
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter responded ${response.status} for ${model}`)
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }

  return payload.choices?.[0]?.message?.content?.trim() ?? ''
}
