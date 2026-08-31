import { sleep } from './protocol.ts'
import type { ChatMessage, EmitFn, RiskLevel } from './types.ts'

const FEELING_WORDS = [
  'anxious', 'scared', 'afraid', 'worried', 'nervous', 'panicked',
  'sad', 'low', 'empty', 'numb', 'lonely', 'alone',
  'angry', 'frustrated', 'irritated', 'resentful',
  'tired', 'exhausted', 'drained', 'burnt out', 'overwhelmed',
  'ashamed', 'guilty', 'embarrassed', 'stuck', 'lost', 'confused',
  'hopeful', 'relieved', 'calm', 'okay', 'better', 'grateful',
]

const TOPIC_HINTS = [
  { pattern: /\b(work|job|boss|manager|office|deadline|interview|laid off|fired)\b/i, topic: 'work' },
  { pattern: /\b(exam|college|university|study|studies|semester|placement|marks)\b/i, topic: 'studying' },
  { pattern: /\b(mom|mum|dad|father|mother|parents|family|brother|sister|home)\b/i, topic: 'family' },
  { pattern: /\b(friend|friends|friendship|lonely|alone|nobody)\b/i, topic: 'connection' },
  { pattern: /\b(partner|girlfriend|boyfriend|wife|husband|relationship|breakup|broke up)\b/i, topic: 'your relationship' },
  { pattern: /\b(sleep|insomnia|awake|tired|night|dreams)\b/i, topic: 'sleep' },
  { pattern: /\b(money|rent|loan|emi|salary|bills|debt)\b/i, topic: 'money' },
  { pattern: /\b(health|sick|illness|pain|doctor|hospital)\b/i, topic: 'your health' },
  { pattern: /\b(future|career|plan|direction|purpose|meaning)\b/i, topic: 'what comes next' },
]

const OPENERS = [
  'Thank you for saying that out loud.',
  "I'm glad you told me.",
  "That's a lot to be holding.",
  'I hear you.',
  "Okay. I'm here with that.",
]

const QUESTIONS = [
  "What's the loudest part of it right now?",
  'When did you first notice it getting heavier?',
  'What would a slightly easier version of today look like?',
  "Is there one part of this you'd want to put down first?",
  'Who, if anyone, knows how this feels for you?',
  "What's it been like carrying this on your own?",
]

const GROUNDERS = [
  'If it helps, we can slow this down — the Toolkit has a two-minute breathing exercise you can do while we talk.',
  "You don't have to sort all of it now. Naming it counts.",
  'We can stay right here for a minute. No need to solve anything yet.',
]

function pick<T>(list: T[], seed: string): T {
  let hash = 0
  for (const char of String(seed)) hash = (hash * 31 + char.charCodeAt(0)) % 100000
  return list[hash % list.length]!
}

function findFeelings(text: string): string[] {
  const lower = text.toLowerCase()
  return FEELING_WORDS.filter((word) => lower.includes(word)).slice(0, 2)
}

function findTopic(text: string): string | null {
  return TOPIC_HINTS.find((hint) => hint.pattern.test(text))?.topic ?? null
}

function reflectFragment(text: string): string | null {
  const sentence = String(text)
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12)
    .sort((a, b) => b.length - a.length)[0]

  if (!sentence) return null

  const trimmed = sentence.replace(/^(i|i'm|im|i am|its|it's)\s+/i, '').replace(/[.!?]+$/, '')
  return trimmed.length > 90 ? `${trimmed.slice(0, 88).trim()}…` : trimmed
}

interface ComposeReplyOptions {
  text: string
  risk: RiskLevel
  history: ChatMessage[]
}

function composeReply({ text, risk, history }: ComposeReplyOptions): string {
  const isFirst = history.filter((message) => message.role === 'user').length <= 1
  const feelings = findFeelings(text)
  const topic = findTopic(text)
  const fragment = reflectFragment(text)

  if (risk === 'crisis') {
    return [
      "Thank you for trusting me with that. What you're describing sounds like more pain than anyone should carry alone,",
      "and I'm not able to keep you safe by myself — a person can.",
      '\n\nPlease reach out to someone right now using the crisis helplines shown above in this chat,',
      "or tell someone you trust nearby if you can.",
      '\n\nAre you safe at this moment?',
    ].join(' ')
  }

  const parts: string[] = []
  parts.push(pick(OPENERS, text))

  if (fragment) {
    parts.push(`When you say “${fragment}”, that lands as something you've been carrying for a while.`)
  }

  if (feelings.length === 2) {
    parts.push(`${cap(feelings[0]!)} and ${feelings[1]!} at the same time is exhausting — they pull in different directions.`)
  } else if (feelings.length === 1) {
    parts.push(`${cap(feelings[0]!)} makes sense given what you're describing.`)
  } else if (topic) {
    parts.push(`It sounds like ${topic} is taking up a lot of room right now.`)
  }

  if (risk === 'distress') {
    parts.push(pick(GROUNDERS, text))
  } else if (isFirst) {
    parts.push("There's no right way to start this — say it however it comes out.")
  }

  parts.push(pick(QUESTIONS, `${text}${history.length}`))

  return parts.join(' ')
}

const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

interface StreamCompanionReplyOptions {
  text: string
  risk: RiskLevel
  history: ChatMessage[]
  emit: EmitFn
  signal?: AbortSignal
}

export async function streamCompanionReply({
  text,
  risk,
  history,
  emit,
  signal,
}: StreamCompanionReplyOptions): Promise<string> {
  emit({ type: 'status', message: 'Haven is reading what you wrote…' })
  await sleep(420)

  const reply = composeReply({ text, risk, history })
  const chunks = reply.match(/\S+\s*/g) ?? [reply]

  let sent = ''

  for (const chunk of chunks) {
    if (signal?.aborted) break
    emit({ type: 'token', text: chunk })
    sent += chunk
    await sleep(chunk.length > 8 ? 58 : 34)
  }

  return sent.trim()
}
