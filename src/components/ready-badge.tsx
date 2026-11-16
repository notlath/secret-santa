export function ReadyBadge({ ready }: { ready: boolean }) {
  return ready ? (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-pine px-2.5 py-0.5 text-sm font-semibold text-paper">
      <span aria-hidden>✓</span> Ready
    </span>
  ) : (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[var(--line-strong)] px-2.5 py-0.5 text-sm font-semibold text-muted-ink">
      Not ready
    </span>
  )
}
