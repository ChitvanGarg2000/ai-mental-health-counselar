import { ExternalLink, Phone } from 'lucide-react'
import type { SafetyResource } from '@/types/stream'

function isPhoneLink(href: string) {
  return href.startsWith('tel:')
}

interface CrisisResourceListProps {
  resources: SafetyResource[]
  className?: string
  variant?: 'compact' | 'card'
}

export function CrisisResourceList({
  resources,
  className,
  variant = 'compact',
}: CrisisResourceListProps) {
  const linkClass =
    variant === 'card'
      ? 'flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted/50'
      : 'flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-destructive/10'

  return (
    <ul className={className}>
      {resources.map((resource) => {
        const phone = isPhoneLink(resource.href)

        return (
          <li key={resource.id}>
            <a href={resource.href} className={linkClass}>
              {phone ? (
                <Phone
                  className={`mt-0.5 size-4 shrink-0 ${variant === 'card' ? 'text-primary' : 'text-destructive'}`}
                  aria-hidden
                />
              ) : (
                <ExternalLink className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
              <span className={variant === 'card' ? 'text-sm' : undefined}>
                <span className="font-medium text-foreground">{resource.name}</span>
                <span className="text-muted-foreground"> — {resource.contact}</span>
                {resource.region ? (
                  <span className="text-muted-foreground"> ({resource.region})</span>
                ) : null}
                <span className="mt-0.5 block text-xs text-muted-foreground">{resource.detail}</span>
              </span>
            </a>
          </li>
        )
      })}
    </ul>
  )
}
