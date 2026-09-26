import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        warning: "border-brass/50 bg-warning-soft text-warning",
        destructive:
          "border-destructive/50 bg-destructive/5 text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

// Renders a <div> by default; pass `as="p"` to keep paragraph semantics.
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
    VariantProps<typeof alertVariants> & { as?: "div" | "p" }
>(({ className, variant, as: Comp = "div", ...props }, ref) => (
  <Comp
    ref={ref}
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

export { Alert, alertVariants }
