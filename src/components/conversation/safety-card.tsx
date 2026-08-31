import { X } from 'lucide-react'
import { CrisisResourceList } from '@/components/crisis-resource-list'
import { Button } from '@/components/ui/button'
import type { SafetyAlert } from '@/types/stream'

interface SafetyCardProps {
  alert: SafetyAlert
  onDismiss?: () => void
}

export function SafetyCard({ alert, onDismiss }: SafetyCardProps) {
  return (
    <div
      className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 ring-1 ring-destructive/15"
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-foreground">{alert.message}</p>
        {onDismiss ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
            aria-label="Dismiss crisis resources"
          >
            <X className="size-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <CrisisResourceList resources={alert.resources} className="mt-3 space-y-2" />
    </div>
  )
}
