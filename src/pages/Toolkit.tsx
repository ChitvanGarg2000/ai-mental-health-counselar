import { useState } from 'react'
import { Hand, Wind } from 'lucide-react'
import { SecondaryPageHeader } from '@/components/layout/page-shell'
import { BoxBreathingExercise } from '@/components/toolkit/box-breathing'
import { GroundingExercise } from '@/components/toolkit/grounding-exercise'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ToolkitExercise = 'breathing' | 'grounding'

const EXERCISES: {
  id: ToolkitExercise
  title: string
  description: string
  icon: typeof Wind
}[] = [
  {
    id: 'breathing',
    title: 'Box breathing',
    description: 'Four counts in, hold, out, hold — a steady square to settle your breath.',
    icon: Wind,
  },
  {
    id: 'grounding',
    title: '5-4-3-2-1 grounding',
    description: 'Name what you notice through each sense to come back to the present.',
    icon: Hand,
  },
]

function Toolkit() {
  const [active, setActive] = useState<ToolkitExercise | null>(null)

  return (
    <div className="min-h-dvh bg-background">
      <SecondaryPageHeader
        title="Toolkit"
        subtitle="Short exercises you can do alongside a conversation"
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {EXERCISES.map(({ id, title, description, icon: Icon }) => {
            const isActive = active === id

            return (
              <article
                key={id}
                className={cn(
                  'rounded-xl border bg-card p-4 transition-colors',
                  isActive ? 'border-primary ring-1 ring-primary/20' : 'border-border',
                )}
              >
                <Icon className="size-5 text-primary" aria-hidden />
                <h2 className="mt-3 font-medium text-foreground">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                <Button
                  className="mt-4 w-full"
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActive(isActive ? null : id)}
                  aria-expanded={isActive}
                >
                  {isActive ? 'Close' : 'Start'}
                </Button>
              </article>
            )
          })}
        </div>

        {active === 'breathing' ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-medium text-foreground">Box breathing</h2>
            <BoxBreathingExercise />
          </section>
        ) : null}

        {active === 'grounding' ? (
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="font-medium text-foreground">5-4-3-2-1 grounding</h2>
            <GroundingExercise />
          </section>
        ) : null}
      </main>
    </div>
  )
}

export default Toolkit
