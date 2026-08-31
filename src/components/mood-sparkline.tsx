import { MOOD_LABELS, MOOD_STEPS } from '@/types/mood'
import type { MoodCheckIn } from '@/types/store'

const SPARKLINE_LIMIT = 14

interface MoodSparklineProps {
  checkIns: MoodCheckIn[]
}

export function MoodSparkline({ checkIns }: MoodSparklineProps) {
  const recent = [...checkIns]
    .sort((a, b) => a.at.localeCompare(b.at))
    .slice(-SPARKLINE_LIMIT)

  if (recent.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          No mood check-ins yet. Pick a mood on the home screen to start a sparkline.
        </p>
      </div>
    )
  }

  const maxStep = 5

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-medium text-foreground">Recent check-ins</h2>
          <p className="text-xs text-muted-foreground">Last {recent.length} arrivals</p>
        </div>
        <div
          className="flex h-16 items-end gap-1"
          role="img"
          aria-label={`Mood sparkline of ${recent.length} recent check-ins`}
        >
          {recent.map((checkIn) => {
            const step = MOOD_STEPS[checkIn.mood]
            const height = `${(step / maxStep) * 100}%`

            return (
              <span
                key={checkIn.id}
                title={`${MOOD_LABELS[checkIn.mood]} — ${new Date(checkIn.at).toLocaleDateString()}`}
                className="w-3 min-w-2 rounded-sm ring-1 ring-border"
                style={{
                  height,
                  backgroundColor: `var(--mood-${step})`,
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
