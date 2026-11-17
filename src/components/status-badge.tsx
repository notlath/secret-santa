import type { ExchangeStatus } from "@/server/exchange"

const STATUS_LABEL: Record<ExchangeStatus, string> = {
  open: "Open for joining",
  closed: "Registration closed",
  assigned: "Draw done",
  completed: "Completed",
}

export function StatusBadge({ status }: { status: ExchangeStatus }) {
  return (
    <p className="self-start rounded-full bg-pine px-3 py-1 text-sm font-semibold text-paper">
      {STATUS_LABEL[status]}
    </p>
  )
}
