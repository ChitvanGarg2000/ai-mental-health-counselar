import type { MoodLevel } from '@/types/mood'

/** Short first messages written in each mood's register — tap to start chatting. */
export const MOOD_OPENERS: Record<MoodLevel, readonly string[]> = {
  struggling: [
    'Everything feels too heavy right now.',
    "I'm not okay, and I don't know where to start.",
    "I've been holding this in for too long.",
  ],
  low: [
    "I've been running on empty.",
    "It's been a grey few days.",
    "I'm tired in a way sleep doesn't fix.",
  ],
  okay: [
    "I'm somewhere in the middle today.",
    'Not great, not terrible — just here.',
    'Wanted to check in before the day runs away.',
  ],
  steady: [
    "I'm hanging in there.",
    'Things feel manageable right now.',
    "I'd like to talk through something small.",
  ],
  light: [
    "I'm in a good enough place to chat.",
    'Feeling a bit lighter today.',
    'Wanted to share something good.',
  ],
}
