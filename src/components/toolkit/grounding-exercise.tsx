import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { appStore } from '@/store/app-store'
import { cn } from '@/lib/utils'

const STEPS = [
  { count: 5, sense: 'see', prompt: 'things you can see' },
  { count: 4, sense: 'feel', prompt: 'things you can feel' },
  { count: 3, sense: 'hear', prompt: 'things you can hear' },
  { count: 2, sense: 'smell', prompt: 'things you can smell' },
  { count: 1, sense: 'taste', prompt: 'thing you can taste' },
] as const

export function GroundingExercise() {
  const [activeStep, setActiveStep] = useState(0)
  const [entries, setEntries] = useState<string[][]>(
    STEPS.map((step) => Array.from({ length: step.count }, () => '')),
  )

  const updateEntry = (stepIndex: number, entryIndex: number, value: string) => {
    setEntries((current) => {
      const next = current.map((row) => [...row])
      next[stepIndex]![entryIndex] = value
      return next
    })
  }

  const reset = () => {
    setActiveStep(0)
    setEntries(STEPS.map((step) => Array.from({ length: step.count }, () => '')))
  }

  const finish = () => {
    const noticedCount = entries
      .flat()
      .filter((value) => value.trim().length > 0).length

    appStore.recordActivity({ kind: 'grounding', noticedCount })
    reset()
  }

  const step = STEPS[activeStep]!

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
        What you type here stays on this screen. It is not saved, not sent, and will disappear when
        you leave or reset.
      </p>

      <div className="flex gap-1" aria-hidden>
        {STEPS.map((item, index) => (
          <span
            key={item.sense}
            className={cn(
              'h-1 flex-1 rounded-full',
              index <= activeStep ? 'bg-primary' : 'bg-muted',
            )}
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-foreground">
          Name {step.count} {step.prompt}
        </h3>
        <ul className="mt-3 space-y-2">
          {entries[activeStep]!.map((value, index) => (
            <li key={`${step.sense}-${index}`}>
              <label className="sr-only" htmlFor={`grounding-${activeStep}-${index}`}>
                {step.prompt} {index + 1}
              </label>
              <input
                id={`grounding-${activeStep}-${index}`}
                type="text"
                value={value}
                onChange={(event) => updateEntry(activeStep, index, event.target.value)}
                placeholder={`${index + 1}.`}
                className={cn(
                  'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm',
                  'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                )}
              />
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2">
          {activeStep > 0 ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setActiveStep((s) => s - 1)}>
              Back
            </Button>
          ) : null}
          {activeStep < STEPS.length - 1 ? (
            <Button type="button" size="sm" onClick={() => setActiveStep((s) => s + 1)}>
              Next
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={finish}>
              <Check className="size-4" aria-hidden />
              Finish
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
