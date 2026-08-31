const MOODS = [
  { step: 1, label: 'Struggling' },
  { step: 2, label: 'Low' },
  { step: 3, label: 'Okay' },
  { step: 4, label: 'Steady' },
  { step: 5, label: 'Light' },
] as const

export function MoodScale() {
  return (
    <ul className="flex flex-wrap justify-center gap-4" aria-label="Five-step mood scale">
      {MOODS.map(({ step, label }) => (
        <li key={step} className="flex items-center gap-2 text-xs font-medium text-foreground">
          <span className="tabular-nums text-muted-foreground">{step}</span>
          <span
            aria-hidden
            className="size-3 shrink-0 rounded-full ring-2 ring-border"
            style={{ backgroundColor: `var(--mood-${step})` }}
          />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  )
}
