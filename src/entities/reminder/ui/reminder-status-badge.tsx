import { cn } from "@/shared/lib/utils"

type ReminderStatus = "pending" | "sent" | "failed"

interface ReminderStatusBadgeProps {
  status: ReminderStatus
  className?: string
}

const statusStyles: Record<ReminderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  sent: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

const statusLabels: Record<ReminderStatus, string> = {
  pending: "대기중",
  sent: "발송됨",
  failed: "실패",
}

function ReminderStatusBadge({ status, className }: ReminderStatusBadgeProps) {
  return (
    <span
      data-slot="reminder-status-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  )
}

export { ReminderStatusBadge }
export type { ReminderStatus }
