import * as React from "react"

import { cn } from "@/lib/utils"

// A native <select> styled to match shadcn/ui Input. Native keeps keyboard,
// mobile pickers and form semantics intact without a Radix dependency.
const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <div className="relative min-w-0 max-w-full">
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full min-w-0 max-w-full appearance-none truncate rounded-md border border-input bg-background py-2 pl-3 pr-9 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 6 4 4 4-4" />
    </svg>
  </div>
))
NativeSelect.displayName = "NativeSelect"

export { NativeSelect }
