import { MOOD_LABELS, MOOD_LEVELS, MOOD_STEPS, type MoodLevel } from '@/types/mood'
import { cn } from '@/lib/utils'

interface MoodCheckInProps {
  selected?: MoodLevel | null
  onSelect: (mood: MoodLevel) => void
}

export function MoodCheckIn({ selected, onSelect }: MoodCheckInProps) {
  return (
    <fieldset className="w-full">
      <legend className="sr-only">How are you arriving today?</legend>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-5">
        {MOOD_LEVELS.map((mood) => {
          const isSelected = selected === mood

          return (
            <li key={mood}>
              <button
                type="button"
                onClick={() => onSelect(mood)}
                aria-pressed={isSelected}
                className={cn(
                  'flex w-full flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                    : 'border-border bg-card/80 hover:bg-card',
                )}
              >
                <span
                  aria-hidden
                  className="size-4 rounded-full ring-2 ring-border"
                  style={{ backgroundColor: `var(--mood-${MOOD_STEPS[mood]})` }}
                />
                <span className="text-sm font-medium text-foreground">{MOOD_LABELS[mood]}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </fieldset>
  )
}
