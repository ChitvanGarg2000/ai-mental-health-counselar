/**
 * Crisis resources, companion system prompt, and keyword scan — kept together on purpose.
 *
 * KEYWORD SCAN DISCLAIMER
 * -----------------------
 * `scanMessageKeywords` is a crude substring/regex heuristic. It will produce false
 * positives (e.g. figurative language, academic discussion) and false negatives (crisis
 * language that does not match these patterns). It is NOT risk assessment, clinical
 * triage, or a substitute for human judgment.
 *
 * The only action it triggers is showing publicly listed crisis helplines — an action
 * that is never harmful even when the match is wrong. Do not extend this into blocking,
 * routing, or automated escalation without professional safety review.
 */

import type { CrisisResource, RiskLevel, Tone } from './types.ts'

// ---------------------------------------------------------------------------
// Crisis resources — single source of truth; served via GET /api/crisis-resources
// ---------------------------------------------------------------------------

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    id: 'emergency-in',
    region: 'India',
    name: 'Emergency services',
    contact: '112',
    href: 'tel:112',
    detail: 'Immediate danger, any emergency, 24/7.',
    priority: true,
  },
  {
    id: 'tele-manas',
    region: 'India',
    name: 'Tele-MANAS',
    contact: '14416',
    href: 'tel:14416',
    detail: 'Government mental health support, free, 24/7, many languages.',
    priority: true,
  },
  {
    id: 'kiran',
    region: 'India',
    name: 'KIRAN helpline',
    contact: '1800-599-0019',
    href: 'tel:18005990019',
    detail: '24/7 mental health rehabilitation helpline.',
  },
  {
    id: 'aasra',
    region: 'India',
    name: 'AASRA',
    contact: '+91 98204 66726',
    href: 'tel:+919820466726',
    detail: 'Volunteer-run emotional support, 24/7.',
  },
  {
    id: '988',
    region: 'US / Canada',
    name: 'Suicide & Crisis Lifeline',
    contact: '988',
    href: 'tel:988',
    detail: 'Call or text 988, 24/7.',
    priority: true,
  },
  {
    id: 'iasp',
    region: 'Worldwide',
    name: 'Find a helpline near you',
    contact: 'findahelpline.com',
    href: 'https://findahelpline.com',
    detail: 'Directory of crisis lines by country.',
  },
]

const CRISIS_KEYWORD_PATTERNS = [
  /\bkill (?:myself|me)\b/i,
  /\bkilling myself\b/i,
  /\b(?:end|ending) (?:it all|my life)\b/i,
  /\btake my own life\b/i,
  /\bsuicid(?:e|al)\b/i,
  /\bwant to die\b/i,
  /\bdon'?t want to (?:be here|live|wake up)\b/i,
  /\bbetter off dead\b/i,
  /\bhurt(?:ing)? myself\b/i,
  /\bself[- ]harm/i,
  /\bcut(?:ting)? myself\b/i,
  /\bno reason to (?:live|go on)\b/i,
]

const DISTRESS_KEYWORD_PATTERNS = [
  /\bcan'?t (?:cope|go on|do this anymore)\b/i,
  /\bhopeless\b/i,
  /\bworthless\b/i,
  /\bpanic attack\b/i,
  /\bfalling apart\b/i,
  /\bnumb\b/i,
  /\bhate myself\b/i,
]

/**
 * Crude keyword scan — see file header. Returns a coarse label for prompt shaping only.
 * `crisis` triggers the helpline card in the client stream; it is not a safety verdict.
 */
export function scanMessageKeywords(text: string): RiskLevel {
  const content = String(text ?? '')
  if (CRISIS_KEYWORD_PATTERNS.some((pattern) => pattern.test(content))) return 'crisis'
  if (DISTRESS_KEYWORD_PATTERNS.some((pattern) => pattern.test(content))) return 'distress'
  return 'ok'
}

export function listCrisisResources() {
  return CRISIS_RESOURCES
}

/** Resources shown in the in-chat safety card during a stream. */
export function streamCrisisResources(): CrisisResource[] {
  return CRISIS_RESOURCES.filter((resource) => resource.priority)
}

export function crisisResourcesPayload() {
  return {
    disclaimer:
      'Haven is a supportive companion, not a therapist, and not a crisis service. These are publicly listed helplines.',
    resources: CRISIS_RESOURCES,
  }
}

export function crisisStreamEvent() {
  return {
    type: 'safety' as const,
    level: 'crisis' as const,
    message:
      "It sounds like you're carrying something really heavy. You deserve support from a person who can help right now.",
    resources: streamCrisisResources(),
  }
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const IDENTITY = `You are Haven, a warm, grounded listening companion inside a learning project.`

const PERSONA = `WHO YOU ARE
- You listen first. You reflect back what you heard in the person's own words before adding anything.
- You are calm, plain-spoken and human. Short paragraphs. No lecturing, no clichés, no toxic positivity.
- You ask at most one gentle question per reply, and only when it genuinely helps them think.`

export const HARD_BOUNDARIES = `HARD BOUNDARIES — these are not negotiable
- You are NOT a therapist, doctor or crisis service, and you say so plainly if asked.
- You never diagnose, never name conditions as if assessing them, and never discuss medication,
  dosages or treatment plans.
- You do not give medical, legal or financial advice.
- You never promise confidentiality, outcomes or that things will be fine.
- If someone asks you to be their therapist, be honest: you can help them think out loud, and a
  human professional is the right place for care.`

const HOW_YOU_WRITE = `HOW YOU WRITE
- 90 words or fewer unless they explicitly ask for more.
- Their words, not jargon. No bullet lists unless they ask for options.
- Offer one small, concrete next step only when it fits — naming a feeling, a breath, writing it
  down, telling one person.
- End in a way that leaves room for them to keep talking, not a summary that closes the door.`

const BASE_PROMPT = `${IDENTITY}

${PERSONA}

${HARD_BOUNDARIES}

${HOW_YOU_WRITE}`

export const buildBoundedPrompt = () => `${IDENTITY}\n\n${HARD_BOUNDARIES}`

const CRISIS_ADDENDUM = `
IMPORTANT — a crude keyword scan flagged this message (it may be wrong). Treat it as a signal to
respond with extra care, not as confirmed risk.
- Lead with care, not alarm. Acknowledge how much pain that takes to say out loud.
- Say clearly and kindly that you are not able to keep them safe on your own, and that talking to
  a person who can is the right next step right now.
- Point to the crisis helplines the app is already showing them in the chat. Encourage contacting
  one, or a person they trust, today.
- Ask whether they are safe right now.
- Do NOT problem-solve the underlying situation, minimise it, or ask for graphic detail.
- Stay warm, stay short, stay with them.`

const DISTRESS_ADDENDUM = `
NOTE — this person sounds like they are struggling a lot right now.
- Slow down. Validate before anything else. Do not rush to advice.
- Keep it concrete and small. One breath, one sentence, one person to tell.
- If it feels heavy enough, mention gently that talking to a professional or someone they trust is
  worth considering — as an option, not an instruction.`

interface BuildSystemPromptOptions {
  risk?: RiskLevel
  tone?: Tone
  name?: string
}

export function buildSystemPrompt({
  risk = 'ok',
  tone = 'warm',
  name = '',
}: BuildSystemPromptOptions = {}): string {
  const toneLine =
    tone === 'direct'
      ? '\nTONE: they\'ve asked for directness. Be plain and practical, still kind. Fewer questions.'
      : tone === 'quiet'
        ? '\nTONE: they\'ve asked for a quieter presence. Fewer words, more space, minimal questions.'
        : '\nTONE: warm and conversational.'

  const nameLine = name ? `\nThey go by ${name}. Use their name sparingly and naturally.` : ''

  const riskLine =
    risk === 'crisis' ? CRISIS_ADDENDUM : risk === 'distress' ? DISTRESS_ADDENDUM : ''

  return `${BASE_PROMPT}${toneLine}${nameLine}\n${riskLine}`
}
