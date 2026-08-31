import { useMemo } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Sparkles } from 'lucide-react'
import { reflectAction } from '@/actions/reflect'
import { Button } from '@/components/ui/button'
import { buildPeriodSummary } from '@/lib/build-period-summary'
import { useActivityLog } from '@/hooks/use-activity-log'
import { useInView } from '@/hooks/use-in-view'
import { useReduceMotion } from '@/hooks/use-reduce-motion'
import { useMoodCheckIns, useSessionList, useSettings } from '@/hooks/use-app-store'
import { INITIAL_REFLECT_STATE } from '@/types/reflect'
import { cn } from '@/lib/utils'

function ReflectSubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Reflecting…' : 'Reflect on my week'}
    </Button>
  )
}

export function JournalReflectCard() {
  const sessions = useSessionList()
  const activities = useActivityLog()
  const moodCheckIns = useMoodCheckIns()
  const settings = useSettings()

  const [state, formAction] = useActionState(reflectAction, INITIAL_REFLECT_STATE)
  const reduceMotion = useReduceMotion()
  const { ref, hasEntered } = useInView({ once: true, threshold: 0.2 })
  const showCard = reduceMotion || hasEntered

  const payload = useMemo(() => {
    const summary = buildPeriodSummary(sessions, activities, moodCheckIns)
    return JSON.stringify({
      summary,
      tone: settings.tone,
      name: settings.name,
    })
  }, [sessions, activities, moodCheckIns, settings.tone, settings.name])

  const summaryPreview = useMemo(
    () => buildPeriodSummary(sessions, activities, moodCheckIns),
    [sessions, activities, moodCheckIns],
  )

  const practiceTotal =
    summaryPreview.exercises.breathing + summaryPreview.exercises.grounding

  return (
    <section
      ref={ref}
      className={cn(
        'rounded-xl border border-border bg-card p-4',
        showCard ? 'opacity-100' : 'opacity-0',
        !reduceMotion && 'transition-opacity duration-700 ease-out',
      )}
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">Weekly reflection</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Haven looks at counts only — active days, conversations, exercises, mood tallies, and
            streak. No message content leaves your browser.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Last {summaryPreview.days} days: {summaryPreview.activeDays} active day
            {summaryPreview.activeDays === 1 ? '' : 's'}, {summaryPreview.conversations}{' '}
            conversation{summaryPreview.conversations === 1 ? '' : 's'}, {practiceTotal} practice
            finish{practiceTotal === 1 ? '' : 'es'}.
          </p>
        </div>
      </div>

      <form action={formAction} className="mt-4 space-y-3">
        <input type="hidden" name="payload" value={payload} />
        <ReflectSubmitButton />

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        {state.reflection ? (
          <div
            className={cn(
              'rounded-lg border px-3 py-2.5',
              state.source === 'model'
                ? 'border-primary/30 bg-primary/5'
                : 'border-border bg-muted/40',
            )}
          >
            <p className="text-sm leading-relaxed text-foreground">{state.reflection}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              {state.source === 'model'
                ? 'Source: written by Haven (AI), from your counts only.'
                : 'Source: built-in template — no API key or the model reply did not pass checks.'}
            </p>
          </div>
        ) : null}
      </form>
    </section>
  )
}
