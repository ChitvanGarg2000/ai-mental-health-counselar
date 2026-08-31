export function TypingIndicator() {
  return (
    <div className="flex w-full justify-start">
      <div
        className="flex max-w-[60ch] items-center gap-1 rounded-2xl bg-chat-assistant px-4 py-3 ring-1 ring-border"
        aria-label="Assistant is typing"
      >
        <TypingDots />
      </div>
    </div>
  )
}

function TypingDots() {
  // Dots use CSS animation — disabled globally via prefers-reduced-motion in index.css.
  return (
    <>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 rounded-full bg-muted-foreground animate-typing-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </>
  )
}

export function StreamingCaret() {
  return (
    <span
      className="inline-block h-[1.1em] w-0.5 translate-y-px bg-primary animate-caret-blink"
      aria-hidden
    />
  )
}
