import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { MoodCheckIn } from '@/components/mood-check-in'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { MOOD_OPENERS } from '@/data/mood-openers'
import { useReduceMotion } from '@/hooks/use-reduce-motion'
import { appStore } from '@/store/app-store'
import { MOOD_LABELS, type MoodLevel } from '@/types/mood'
import { cn } from '@/lib/utils'

function Home() {
  const navigate = useNavigate()
  const reduceMotion = useReduceMotion()
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null)

  const handleMoodSelect = (mood: MoodLevel) => {
    appStore.recordMoodCheckIn(mood)
    setSelectedMood(mood)
  }

  const startWithOpener = (text: string) => {
    const sessionId = appStore.createSession([], { startingMood: selectedMood ?? undefined })
    navigate(`/chat/${sessionId}`, { state: { autoSend: true, opener: text } })
  }

  const skipToChat = () => {
    navigate('/chat')
  }

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-background">
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-aura',
          !reduceMotion && 'animate-aura-drift',
        )}
        aria-hidden
      />

      <header className="relative flex shrink-0 items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Haven</h1>
          <p className="text-xs text-muted-foreground">A supportive companion — not therapy</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/help">Get help</Link>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 px-6 py-6">
        {!selectedMood ? (
          <section className="space-y-5 text-center">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                How are you arriving today?
              </h2>
              <p className="text-sm text-muted-foreground">
                A quick check-in helps Haven meet you where you are. You can skip anytime.
              </p>
            </div>

            <MoodCheckIn selected={selectedMood} onSelect={handleMoodSelect} />

            <Button type="button" variant="ghost" onClick={skipToChat}>
              Skip check-in
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </section>
        ) : (
          <section className="space-y-5">
            <div className="space-y-1 text-center">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {MOOD_LABELS[selectedMood]}
              </p>
              <h2 className="text-xl font-semibold text-foreground">
                Pick a place to start
              </h2>
              <p className="text-sm text-muted-foreground">
                Tap one — or write your own in chat.
              </p>
            </div>

            <ul className="space-y-2">
              {MOOD_OPENERS[selectedMood].map((opener) => (
                <li key={opener}>
                  <button
                    type="button"
                    onClick={() => startWithOpener(opener)}
                    className="w-full rounded-xl border border-border bg-card/90 px-4 py-3 text-left text-sm leading-relaxed text-foreground transition-colors hover:border-primary/40 hover:bg-card"
                  >
                    {opener}
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
              <Button type="button" variant="outline" onClick={() => setSelectedMood(null)}>
                Change mood
              </Button>
              <Button type="button" variant="ghost" onClick={skipToChat}>
                Skip — open blank chat
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="relative shrink-0 border-t border-border bg-background/80 px-6 py-3 backdrop-blur-sm">
        <nav
          className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          aria-label="Secondary"
        >
          <Link to="/journal" className="hover:text-foreground">
            Journal
          </Link>
          <Link to="/toolkit" className="hover:text-foreground">
            Toolkit
          </Link>
          <Link to="/settings" className="hover:text-foreground">
            Settings
          </Link>
        </nav>
      </footer>
    </div>
  )
}

export default Home
