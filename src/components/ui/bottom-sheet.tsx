"use client";

import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

interface BottomSheetProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

interface BottomSheetContentProps {
  children: React.ReactNode;
  className?: string;
}

interface BottomSheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface BottomSheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

interface BottomSheetDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

interface BottomSheetFooterProps {
  children: React.ReactNode;
  className?: string;
}

const BottomSheet = ({ children, open, onOpenChange, trigger }: BottomSheetProps) => {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Drawer.Trigger asChild>{trigger}</Drawer.Trigger>}
      {children}
    </Drawer.Root>
  );
};

const BottomSheetContent = React.forwardRef<
  React.ElementRef<typeof Drawer.Content>,
  BottomSheetContentProps
>(({ className, children, ...props }, ref) => (
  <Drawer.Portal>
    <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
    <Drawer.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </Drawer.Content>
  </Drawer.Portal>
));
BottomSheetContent.displayName = "BottomSheetContent";

const BottomSheetHeader = ({ className, children, ...props }: BottomSheetHeaderProps) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-4 pb-2", className)}
    {...props}
  >
    {children}
  </div>
);

const BottomSheetTitle = React.forwardRef<
  React.ElementRef<typeof Drawer.Title>,
  BottomSheetTitleProps
>(({ className, children, ...props }, ref) => (
  <Drawer.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </Drawer.Title>
));
BottomSheetTitle.displayName = "BottomSheetTitle";

const BottomSheetDescription = React.forwardRef<
  React.ElementRef<typeof Drawer.Description>,
  BottomSheetDescriptionProps
>(({ className, children, ...props }, ref) => (
  <Drawer.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </Drawer.Description>
));
BottomSheetDescription.displayName = "BottomSheetDescription";

const BottomSheetFooter = ({ className, children, ...props }: BottomSheetFooterProps) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 px-4 pt-4 pb-6", className)}
    {...props}
    style={{ paddingBottom: 'max(1.5rem, calc(1rem + env(safe-area-inset-bottom)))' }}
  >
    {children}
  </div>
);

export {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetDescription,
  BottomSheetFooter,
};