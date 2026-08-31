import { CrisisResourceList } from '@/components/crisis-resource-list'
import { SecondaryPageHeader } from '@/components/layout/page-shell'
import {
  FALLBACK_CRISIS_DISCLAIMER,
  FALLBACK_CRISIS_RESOURCES,
} from '@/data/crisis-resources-fallback'
import { useCrisisResources } from '@/hooks/use-crisis-resources'

function Help() {
  const { resources, disclaimer, loading, usingFallback } = useCrisisResources()
  const displayResources = resources.length > 0 ? resources : FALLBACK_CRISIS_RESOURCES
  const displayDisclaimer = disclaimer ?? FALLBACK_CRISIS_DISCLAIMER

  return (
    <div className="min-h-dvh bg-background">
      <SecondaryPageHeader
        title="Get help now"
        subtitle="Haven is not a crisis service — these lines connect you to humans who are"
      />

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm leading-relaxed text-foreground">
          If you or someone else may be in immediate danger, contact emergency services first.
          Haven cannot send help or contact anyone on your behalf.
        </p>

        {loading ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Loading latest helplines…
          </p>
        ) : null}

        {usingFallback ? (
          <p className="text-sm text-muted-foreground">
            Showing essential numbers below. The full list could not be refreshed from the server.
          </p>
        ) : null}

        <p className="text-sm text-muted-foreground">{displayDisclaimer}</p>
        <CrisisResourceList resources={displayResources} className="space-y-3" variant="card" />
      </main>
    </div>
  )
}

export default Help
