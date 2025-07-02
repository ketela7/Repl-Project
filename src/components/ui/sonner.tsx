"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

import { useIsMobile } from "@/lib/hooks/use-mobile"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()
  const isMobile = useIsMobile()

  return (
    <Sonner
      theme={(theme as ToasterProps["theme"]) || "system"}
      className="toaster group"
      position={isMobile ? "bottom-center" : "top-right"}
      expand={true}
      richColors
      closeButton
      {...(isMobile && { offset: 16 })}
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:pr-12 group-[.toaster]:min-h-12",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm group-[.toast]:font-medium",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-md group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:text-sm",
          closeButton:
            "group-[.toast]:absolute group-[.toast]:right-2 group-[.toast]:top-2 group-[.toast]:rounded-sm group-[.toast]:opacity-70 group-[.toast]:ring-offset-background group-[.toast]:transition-opacity group-[.toast]:hover:opacity-100 group-[.toast]:focus:outline-none group-[.toast]:focus:ring-2 group-[.toast]:focus:ring-ring group-[.toast]:focus:ring-offset-2 group-[.toast]:w-5 group-[.toast]:h-5",
          success: "group-[.toaster]:bg-green-50 group-[.toaster]:border-green-200 group-[.toaster]:text-green-800",
          error: "group-[.toaster]:bg-red-50 group-[.toaster]:border-red-200 group-[.toaster]:text-red-800",
          warning: "group-[.toaster]:bg-yellow-50 group-[.toaster]:border-yellow-200 group-[.toaster]:text-yellow-800",
          info: "group-[.toaster]:bg-blue-50 group-[.toaster]:border-blue-200 group-[.toaster]:text-blue-800",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
