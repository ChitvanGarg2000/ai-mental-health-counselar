import { useCallback, useEffect, useState } from 'react'
import { Check, Pause, Play, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReduceMotion } from '@/hooks/use-reduce-motion'
import { appStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

type Phase = 'inhale' | 'hold-in' | 'exhale' | 'hold-out'

const PHASES: { phase: Phase; label: string; seconds: number }[] = [
  { phase: 'inhale', label: 'Breathe in', seconds: 4 },
  { phase: 'hold-in', label: 'Hold', seconds: 4 },
  { phase: 'exhale', label: 'Breathe out', seconds: 4 },
  { phase: 'hold-out', label: 'Hold', seconds: 4 },
]

const TOTAL_SECONDS = PHASES.reduce((sum, item) => sum + item.seconds, 0)

function phaseAt(elapsed: number): { phase: Phase; label: string; remaining: number } {
  const position = elapsed % TOTAL_SECONDS
  let cursor = 0

  for (const item of PHASES) {
    if (position < cursor + item.seconds) {
      return {
        phase: item.phase,
        label: item.label,
        remaining: item.seconds - (position - cursor),
      }
    }
    cursor += item.seconds
  }

  return { phase: 'inhale', label: 'Breathe in', remaining: 4 }
}

export function BoxBreathingExercise() {
  const reduceMotion = useReduceMotion()
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const { phase, label, remaining } = phaseAt(elapsed)
  const rounds = Math.floor(elapsed / TOTAL_SECONDS)

  useEffect(() => {
    if (!running) return

    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [running])

  const reset = useCallback(() => {
    setRunning(false)
    setElapsed(0)
  }, [])

  const finish = useCallback(() => {
    if (rounds > 0) {
      appStore.recordActivity({ kind: 'box-breathing', rounds })
    }
    reset()
  }, [rounds, reset])

  const scale =
    phase === 'inhale' ? 1.08 : phase === 'exhale' ? 0.92 : phase === 'hold-in' ? 1.08 : 0.92

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Box breathing: four seconds in, four hold, four out, four hold. Follow the square.
      </p>

      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-muted/30 p-6">
        <div
          className={cn(
            'flex size-36 items-center justify-center rounded-2xl border-2 border-primary/40 bg-primary/10',
            !reduceMotion && running && 'transition-transform duration-1000 ease-in-out',
          )}
          style={reduceMotion ? undefined : { transform: `scale(${scale})` }}
          aria-live="polite"
        >
          <div className="text-center">
            <p className="text-lg font-medium text-foreground">{label}</p>
            <p className="mt-1 text-3xl tabular-nums text-primary">{remaining}</p>
            {rounds > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {rounds} round{rounds === 1 ? '' : 's'} complete
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" size="sm" onClick={() => setRunning((value) => !value)}>
            {running ? (
              <>
                <Pause className="size-4" aria-hidden />
                Pause
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden />
                {elapsed > 0 ? 'Resume' : 'Start'}
              </>
            )}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={reset}>
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </Button>
          <Button type="button" size="sm" variant="secondary" onClick={finish} disabled={rounds < 1}>
            <Check className="size-4" aria-hidden />
            Finish
          </Button>
        </div>
      </div>
    </div>
  )
}
