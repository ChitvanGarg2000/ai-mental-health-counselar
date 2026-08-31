import { uid } from './protocol.ts'
import {
  buildSystemPrompt,
  crisisStreamEvent,
  listCrisisResources,
  scanMessageKeywords,
} from './safety.ts'
import { aiEnabled, streamModelReply } from './openrouter.ts'
import { streamCompanionReply } from './companion.ts'
import {
  BadRequest,
  type AssistantMessage,
  type ChatMessage,
  type EmitFn,
  type Tone,
} from './types.ts'

const MAX_MESSAGE_LENGTH = 2000
const MAX_HISTORY = 24

const TONES: Tone[] = ['warm', 'direct', 'quiet']

interface RawChatBody {
  messages?: Array<{ role?: string; content?: unknown }>
  tone?: string
  name?: unknown
}

interface ChatRequest {
  messages: ChatMessage[]
  tone: Tone
  name: string
  text: string
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

export function readChatRequest(body: unknown): ChatRequest {
  const raw: RawChatBody =
    typeof body === 'string' ? (safeParse(body) as RawChatBody) : (body as RawChatBody)

  const messages = Array.isArray(raw?.messages) ? raw.messages : null
  if (!messages || messages.length === 0) {
    throw new BadRequest('Send at least one message.')
  }

  const cleaned = messages
    .filter(
      (message): message is { role: 'user' | 'assistant'; content: unknown } =>
        Boolean(message) &&
        (message.role === 'user' || message.role === 'assistant'),
    )
    .map((message) => ({
      role: message.role,
      content: String(message.content ?? '').slice(0, MAX_MESSAGE_LENGTH),
    }))
    .filter((message) => message.content.trim().length > 0)
    .slice(-MAX_HISTORY)

  if (cleaned.length === 0) {
    throw new BadRequest('Send at least one message with content.')
  }

  const last = cleaned[cleaned.length - 1]!
  if (last.role !== 'user') {
    throw new BadRequest('The last message should be from the user.')
  }

  const tone = TONES.includes(raw?.tone as Tone) ? (raw.tone as Tone) : 'warm'
  const name = String(raw?.name ?? '')
    .slice(0, 40)
    .trim()

  return { messages: cleaned, tone, name, text: last.content }
}

interface StreamReplyOptions {
  messages: ChatMessage[]
  tone: Tone
  name: string
  text: string
  emit: EmitFn
  signal?: AbortSignal
}

export async function streamReply({
  messages,
  tone,
  name,
  text,
  emit,
  signal,
}: StreamReplyOptions): Promise<AssistantMessage | null> {
  const risk = scanMessageKeywords(text)

  // Emit helplines before any model tokens — the scan is heuristic; showing numbers is safe.
  if (risk === 'crisis') {
    emit(crisisStreamEvent())
  }

  const systemPrompt = buildSystemPrompt({ risk, tone, name })

  let content: string | undefined

  if (aiEnabled()) {
    try {
      content = await streamModelReply({ messages, systemPrompt, emit, signal })
    } catch (error) {
      if (signal?.aborted) return null
      const message = error instanceof Error ? error.message : String(error)
      console.error('[chat] model path failed:', message)
      emit({
        type: 'status',
        message: 'Model unavailable — staying with you using the built-in companion.',
      })
      content = await streamCompanionReply({ text, risk, history: messages, emit, signal })
    }
  } else {
    content = await streamCompanionReply({ text, risk, history: messages, emit, signal })
  }

  if (signal?.aborted) return null
  if (!content) return null

  return {
    id: uid(),
    role: 'assistant',
    content,
    at: new Date().toISOString(),
    risk,
  }
}

export function health() {
  const keyConfigured = Boolean(process.env.OPEN_ROUTER_API_KEY?.trim())
  return {
    ok: true,
    companion: keyConfigured ? 'openrouter' : 'built-in',
    openRouterKeyConfigured: keyConfigured,
    model: keyConfigured ? (process.env.OPENROUTER_MODEL ?? 'free-model rotation') : null,
    resources: listCrisisResources().length,
    disclaimer:
      'Haven is a supportive companion, not a therapist, and not a crisis service.',
  }
}

