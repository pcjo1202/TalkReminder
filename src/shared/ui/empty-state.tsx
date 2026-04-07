import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/shared/lib/utils"

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      variant: {
        default: "gap-4 py-16 px-8",
        compact: "gap-2 py-8 px-4",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface EmptyStateProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof emptyStateVariants> {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

function EmptyState({
  className,
  variant = "default",
  title,
  description,
  icon,
  action,
  ...props
}: EmptyStateProps) {
  const isCompact = variant === "compact"

  return (
    <div
      data-slot="empty-state"
      data-variant={variant}
      className={cn(emptyStateVariants({ variant }), className)}
      {...props}
    >
      {icon && (
        <div
          data-slot="empty-state-icon"
          className={cn(
            "text-muted-foreground",
            isCompact ? "[&_svg]:size-8" : "[&_svg]:size-12"
          )}
        >
          {icon}
        </div>
      )}
      <div
        data-slot="empty-state-content"
        className={cn("flex flex-col", isCompact ? "gap-1" : "gap-2")}
      >
        <h3
          data-slot="empty-state-title"
          className={cn(
            "font-semibold tracking-tight",
            isCompact ? "text-sm" : "text-lg"
          )}
        >
          {title}
        </h3>
        {description && (
          <p
            data-slot="empty-state-description"
            className={cn(
              "text-muted-foreground",
              isCompact ? "text-xs" : "text-sm"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <div data-slot="empty-state-action">
          {action}
        </div>
      )}
    </div>
  )
}

export { EmptyState, emptyStateVariants }
export type { EmptyStateProps }
