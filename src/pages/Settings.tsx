import { type FormEvent, type ReactNode, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import { SecondaryPageHeader } from '@/components/layout/page-shell'
import { useSessionList, useSettings } from '@/hooks/use-app-store'
import { appStore } from '@/store/app-store'
import { downloadAppDataExport } from '@/lib/export-app-data'
import type { MotionPreference, Tone } from '@/types/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const TONES: { value: Tone; label: string; description: string }[] = [
  { value: 'warm', label: 'Warm', description: 'Conversational and gentle' },
  { value: 'direct', label: 'Direct', description: 'Plain and practical' },
  { value: 'quiet', label: 'Quiet', description: 'Fewer words, more space' },
]

const MOTION_OPTIONS: {
  value: MotionPreference
  label: string
  description: string
}[] = [
  {
    value: 'system',
    label: 'Match device',
    description: 'Follow your operating system’s reduce-motion setting',
  },
  {
    value: 'reduce',
    label: 'Reduce motion',
    description: 'Minimise movement even if your device allows animations',
  },
  {
    value: 'allow',
    label: 'Allow motion',
    description: 'Show Haven’s animations even if your device prefers reduced motion',
  },
]

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 space-y-1">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function Settings() {
  const settings = useSettings()
  const sessions = useSessionList()
  const conversationCount = sessions.length

  const [name, setName] = useState(settings.name)
  const [tone, setTone] = useState<Tone>(settings.tone)
  const [saved, setSaved] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const handleTalkSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    appStore.updateSettings({ name: name.trim(), tone })
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
  }

  const handleMotionChange = (motion: MotionPreference) => {
    appStore.updateSettings({ motion })
  }

  const handleDeleteAll = () => {
    appStore.deleteAllConversations()
    setConfirmingDelete(false)
  }

  return (
    <div className="min-h-dvh bg-background">
      <SecondaryPageHeader title="Settings" subtitle="How Haven talks, moves, and stores data" />

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <SettingsSection
          title="How Haven talks"
          description="Your name and tone are sent with each chat request so replies can match how you like to be spoken with."
        >
          <form onSubmit={handleTalkSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Your name
              </label>
              <input
                id="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Optional"
                maxLength={40}
                className={cn(
                  'w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm',
                  'outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
                )}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Tone</legend>
              <div className="flex flex-wrap gap-2">
                {TONES.map(({ value, label, description: toneDescription }) => (
                  <Button
                    key={value}
                    type="button"
                    size="sm"
                    variant={tone === value ? 'default' : 'outline'}
                    onClick={() => setTone(value)}
                    aria-pressed={tone === value}
                    title={toneDescription}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center gap-3">
              <Button type="submit">Save</Button>
              {saved ? <span className="text-sm text-muted-foreground">Saved</span> : null}
            </div>
          </form>
        </SettingsSection>

        <SettingsSection
          title="How much it moves"
          description="This sits on top of your device setting. Changes apply immediately."
        >
          <fieldset className="space-y-3">
            <legend className="sr-only">Motion preference</legend>
            {MOTION_OPTIONS.map(({ value, label, description }) => {
              const selected = settings.motion === value

              return (
                <label
                  key={value}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors',
                    selected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/40',
                  )}
                >
                  <input
                    type="radio"
                    name="motion"
                    value={value}
                    checked={selected}
                    onChange={() => handleMotionChange(value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block text-sm font-medium text-foreground">{label}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span>
                  </span>
                </label>
              )
            })}
          </fieldset>
        </SettingsSection>

        <SettingsSection title="Your data">
          <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Where it lives:</span> conversations and
              these settings are stored in your browser&apos;s local storage on this device only. They
              are not synced to a Haven account.
            </p>
            <p>
              <span className="font-medium text-foreground">What gets sent:</span> when you send a chat
              message, your conversation history for that request, your chosen tone, and your name (if
              set) go to the Haven API on this server. If an API key is configured, the server forwards
              messages to OpenRouter to generate a reply. Crisis helpline lists are fetched from the
              server without sending message content.
            </p>
            <p>
              <span className="font-medium text-foreground">What is not logged:</span> message content
              is never written to server logs. Only errors and startup messages are logged locally on
              the machine running the server.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={downloadAppDataExport}>
              <Download className="size-4" aria-hidden />
              Export everything
            </Button>
            {!confirmingDelete ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmingDelete(true)}
                disabled={conversationCount === 0}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete everything
              </Button>
            ) : null}
          </div>

          {confirmingDelete ? (
            <div
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
              role="alert"
            >
              <p className="text-sm text-foreground">
                Delete{' '}
                <span className="font-semibold">
                  {conversationCount} conversation{conversationCount === 1 ? '' : 's'}
                </span>{' '}
                from this browser? Your name, tone, and motion settings will stay. This cannot be
                undone.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setConfirmingDelete(false)}>
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={handleDeleteAll}>
                  Yes, delete {conversationCount} conversation
                  {conversationCount === 1 ? '' : 's'}
                </Button>
              </div>
            </div>
          ) : null}
        </SettingsSection>
      </main>
    </div>
  )
}

export default Settings
