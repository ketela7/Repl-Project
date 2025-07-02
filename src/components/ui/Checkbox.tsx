"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Enhanced cross-platform sizing with consistent 16px (4 * 4px) base
        "h-4 w-4 min-h-4 min-w-4 max-h-4 max-w-4 shrink-0 flex-none",
        // Professional rounded corners for better cross-platform appearance
        "rounded-[3px] border-2 shadow-sm",
        // Enhanced transition for smooth interactions
        "transition-all duration-200 ease-in-out outline-none",
        // Better focus and hover states for cross-platform compatibility
        "focus-visible:ring-2 focus-visible:ring-offset-1 hover:border-primary/60",
        // Improved disabled state
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted",
        // Touch-friendly sizing for mobile devices
        "touch-manipulation select-none",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-transform duration-150 ease-out"
      >
        <Check className="h-3 w-3 stroke-[2.5] drop-shadow-sm" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
