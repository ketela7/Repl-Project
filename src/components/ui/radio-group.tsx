"use client"

import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { CircleIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-2", className)}
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        // Enhanced cross-platform sizing with consistent 16px (4 * 4px) base
        "h-4 w-4 min-h-4 min-w-4 max-h-4 max-w-4 shrink-0 flex-none",
        // Professional rounded and border styling
        "rounded-full border border-input shadow-sm",
        // Enhanced transition for smooth interactions
        "transition-all duration-200 ease-in-out outline-none",
        // Better focus and hover states for cross-platform compatibility
        "focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1",
        "hover:border-primary/60",
        // Improved disabled state
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Touch-friendly sizing for mobile devices
        "touch-manipulation select-none",
        "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center w-full h-full"
      >
        <CircleIcon className="h-1.5 w-1.5 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}
export { RadioGroup, RadioGroupItem }