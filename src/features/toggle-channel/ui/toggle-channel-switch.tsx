"use client"

import { useState, useTransition } from "react"
import { cn } from "@/shared/lib/utils"
import { toggleChannel } from "../actions/toggle-channel"

interface ToggleChannelSwitchProps {
  channelId: string
  initialEnabled: boolean
  className?: string
}

function ToggleChannelSwitch({
  channelId,
  initialEnabled,
  className,
}: ToggleChannelSwitchProps) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [isPending, startTransition] = useTransition()

  function handleToggle() {
    const next = !enabled
    setEnabled(next)
    startTransition(async () => {
      try {
        await toggleChannel(channelId, next)
      } catch {
        // 실패 시 원래 상태로 복원
        setEnabled(!next)
      }
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label="채널 활성화 토글"
      disabled={isPending}
      onClick={handleToggle}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        enabled ? "bg-primary" : "bg-input",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  )
}

export { ToggleChannelSwitch }
