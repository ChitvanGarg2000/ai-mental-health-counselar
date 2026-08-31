import { buildBoundedPrompt } from './safety.ts'
import { aiEnabled, completeModelReply } from './openrouter.ts'
import {
  BadRequest,
  type PeriodSummary,
  type Tone,
} from './types.ts'

const MOODS = ['struggling', 'low', 'okay', 'steady', 'light'] as const
type Mood = (typeof MOODS)[number]

const TONES: Tone[] = ['warm', 'direct', 'quiet']

interface RawSummaryBody {
  summary?: {
    days?: unknown
    activeDays?: unknown
    conversations?: unknown
    exercises?: {
      breathing?: unknown
      grounding?: unknown
    }
    moods?: Partial<Record<Mood, unknown>>
    streak?: unknown
  }
  tone?: string
  name?: unknown
}

function safeParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return undefined
  }
}

export function readSummary(body: unknown): PeriodSummary {
  const raw: RawSummaryBody =
    typeof body === 'string' ? (safeParse(body) as RawSummaryBody) : (body as RawSummaryBody)
  const summary = raw?.summary

  if (!summary || typeof summary !== 'object') {
    throw new BadRequest('Send a summary of the period to reflect on.')
  }

  const int = (value: unknown, max: number) =>
    Math.max(0, Math.min(max, Math.round(Number(value) || 0)))

  const moodCounts: PeriodSummary['moods'] = {}
  for (const mood of MOODS) {
    const count = int(summary.moods?.[mood], 200)
    if (count > 0) moodCounts[mood] = count
  }

  return {
    days: int(summary.days, 366) || 7,
    activeDays: int(summary.activeDays, 366),
    conversations: int(summary.conversations, 500),
    exercises: {
      breathing: int(summary.exercises?.breathing, 500),
      grounding: int(summary.exercises?.grounding, 500),
    },
    moods: moodCounts,
    streak: int(summary.streak, 366),
    tone: TONES.includes(raw?.tone as Tone) ? (raw.tone as Tone) : 'warm',
    name: String(raw?.name ?? '').slice(0, 40).trim(),
  }
}

function describe(summary: PeriodSummary): string {
  const moodLine = Object.entries(summary.moods)
    .map(([mood, count]) => `${mood} ${count}x`)
    .join(', ')

  return [
    `Period: the last ${summary.days} days.`,
    `Days with any activity: ${summary.activeDays} of ${summary.days}.`,
    `Conversations started: ${summary.conversations}.`,
    `Breathing exercises finished: ${summary.exercises.breathing}. Grounding exercises finished: ${summary.exercises.grounding}.`,
    moodLine ? `Mood recorded on arrival: ${moodLine}.` : 'No arrival moods recorded.',
    summary.streak > 1 ? `Current run of consecutive active days: ${summary.streak}.` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const REFLECT_TASK = `
YOUR TASK RIGHT NOW
You are NOT having a conversation. You are looking at a summary of someone's own activity in this
app and writing them ONE short observation about it — 45 words or fewer, two sentences at most.

- Write TO the person, as "you". Never "they", "the user" or "this person" — you are speaking to
  them about their own week, not describing them to somebody else.
- Your FIRST sentence must state something concrete from the numbers: a count, or a comparison
  between two of them. Not a feeling, not an offer of help.
- These are counts of app usage, nothing more. You do not know what they talked about, whether
  anything improved, or how they actually feel. Never imply you do.
- Do not congratulate a streak or scold a gap. No "great job", no "you should".
- If the moods recorded are mostly heavy, you may add ONE short clause noting that talking to
  someone human is an option. It is never the whole reply, and never the first sentence.
- If there is barely any data, say plainly that there isn't much to go on yet.
- Do not ask a question. Do not offer to keep talking. Do not say you are here for them.
- Plain sentences. No bullet points, no headings, no emoji.`

function templateReflection(summary: PeriodSummary): string {
  const { activeDays, days, conversations, exercises, moods, streak } = summary
  const practice = exercises.breathing + exercises.grounding
  const heavy = (moods.struggling ?? 0) + (moods.low ?? 0)
  const lighter = (moods.steady ?? 0) + (moods.light ?? 0)

  if (activeDays === 0) {
    return "There's nothing here to look at yet. Whenever you want to start, one sentence is enough."
  }

  if (activeDays === 1 && conversations <= 1 && practice === 0) {
    return "One visit so far, which is a start and not a small one. There isn't enough here to see a pattern yet — that comes with a few more."
  }

  const parts: string[] = []

  if (practice > conversations && practice > 0) {
    parts.push(
      `Across ${activeDays} of the last ${days} days you reached for the toolkit more than the chat — ${practice} ${practice === 1 ? 'exercise' : 'exercises'} finished.`,
    )
  } else if (conversations > 0) {
    parts.push(
      `You started ${conversations} ${conversations === 1 ? 'conversation' : 'conversations'} across ${activeDays} of the last ${days} days.`,
    )
  } else {
    parts.push(`You showed up on ${activeDays} of the last ${days} days.`)
  }

  if (heavy > 0 && heavy >= lighter) {
    parts.push(
      "Most of those check-ins were on the heavier end. If that's still where you are, talking it through with someone human is worth considering.",
    )
  } else if (lighter > 0 && heavy === 0) {
    parts.push('Every check-in you recorded was on the steadier side, which is worth noticing rather than skipping past.')
  } else if (streak > 2) {
    parts.push(`Whatever else is going on, you've come back ${streak} days in a row.`)
  } else {
    parts.push("What you do with that is up to you — there's no target here.")
  }

  return parts.join(' ')
}

const THINKING_OUT_LOUD = [
  /\bwe need to\b/i,
  /\blet'?s (count|check|see|write)\b/i,
  /\bword count\b/i,
  /\bthe user\b/i,
  /\bas an ai\b/i,
  /\bobservation:\s/i,
  /^(okay|alright|so),/i,
]

const THIRD_PERSON = /^(they|this person|the person|he|she)\b/i

export function tidyReflection(raw: string | null | undefined): string | null {
  if (!raw) return null

  let text = String(raw)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\/?think>/gi, '')
    .trim()

  const paragraphs = text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (paragraphs.length > 1) {
    const kept = paragraphs.filter(
      (part) => !THINKING_OUT_LOUD.some((pattern) => pattern.test(part)),
    )
    text = (kept.length ? kept : paragraphs).join(' ')
  }

  text = text.replace(/\s+/g, ' ').replace(/^["“']|["”']$/g, '').trim()

  if (!text) return null
  if (THINKING_OUT_LOUD.some((pattern) => pattern.test(text))) return null
  if (THIRD_PERSON.test(text)) return null

  const words = text.split(/\s+/)
  if (words.length > 70) return null

  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text]
  return sentences.slice(0, 2).join(' ').replace(/\s+/g, ' ').trim()
}

export async function buildReflection(
  summary: PeriodSummary,
): Promise<{ reflection: string; source: 'model' | 'template' }> {
  if (!aiEnabled()) {
    return { reflection: templateReflection(summary), source: 'template' }
  }

  const systemPrompt = `${buildBoundedPrompt()}\n${REFLECT_TASK}`

  try {
    const reply = await completeModelReply({
      messages: [{ role: 'user', content: describe(summary) }],
      systemPrompt,
    })

    const reflection = tidyReflection(reply)
    if (reflection) return { reflection, source: 'model' }

    console.warn("[reflect] model reply didn't match the contract; using the template instead")
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('[reflect] model path failed:', message)
  }

  return { reflection: templateReflection(summary), source: 'template' }
}

export { BadRequest }
