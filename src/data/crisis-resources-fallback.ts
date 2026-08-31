import type { SafetyResource } from '@/types/stream'

/**
 * Essential helplines shown when the API is unreachable. Kept minimal so Help is never empty.
 * Full list is served from GET /api/crisis-resources when available.
 */
export const FALLBACK_CRISIS_RESOURCES: SafetyResource[] = [
  {
    id: 'emergency-in',
    region: 'India',
    name: 'Emergency services',
    contact: '112',
    href: 'tel:112',
    detail: 'Immediate danger, any emergency, 24/7.',
  },
  {
    id: 'tele-manas',
    region: 'India',
    name: 'Tele-MANAS',
    contact: '14416',
    href: 'tel:14416',
    detail: 'Government mental health support, free, 24/7, many languages.',
  },
  {
    id: '988',
    region: 'US / Canada',
    name: 'Suicide & Crisis Lifeline',
    contact: '988',
    href: 'tel:988',
    detail: 'Call or text 988, 24/7.',
  },
]

export const FALLBACK_CRISIS_DISCLAIMER =
  'Haven is a supportive companion, not a therapist, and not a crisis service.'
