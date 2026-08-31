import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

interface SecondaryPageHeaderProps {
  title: string
  subtitle: string
  children?: ReactNode
}

export function SecondaryPageHeader({ title, subtitle, children }: SecondaryPageHeaderProps) {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div>
          <h1 className="text-base font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          {children}
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">Home</Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? ''}`} aria-hidden />
}

export function JournalPageFallback() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-40" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-xl" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-16 rounded-md" />
          ))}
        </div>
        <ul className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-24 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}

export function ToolkitPageFallback() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <main className="mx-auto grid max-w-2xl gap-4 px-4 py-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </main>
    </div>
  )
}

export function SettingsPageFallback() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-xl border border-border p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full max-w-md" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </main>
    </div>
  )
}

export function JournalCalendarFallback() {
  return (
    <div
      className="space-y-3 rounded-xl border border-border bg-card p-4"
      aria-hidden
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-1">
          <Skeleton className="size-8 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
          <Skeleton className="size-8 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={`head-${i}`} className="mx-auto h-3 w-6" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, row) => (
        <div key={row} className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, col) => (
            <Skeleton key={col} className="h-14 rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function HelpPageFallback() {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-background/95 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      </header>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <ul className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-20 w-full rounded-xl" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  )
}
