import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

const DISCLAIMER =
  'A supportive companion — not a therapist, not crisis care, and not medical advice.'

export function ConversationHeader() {
  return (
    <header className="shrink-0 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground">
              Haven
            </h1>
            <Button variant="ghost" size="xs" className="hidden sm:inline-flex" asChild>
              <Link to="/journal">Journal</Link>
            </Button>
            <Button variant="ghost" size="xs" className="hidden sm:inline-flex" asChild>
              <Link to="/">Home</Link>
            </Button>
          </div>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{DISCLAIMER}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="hidden sm:inline-flex" asChild>
            <Link to="/help">Get help now</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
