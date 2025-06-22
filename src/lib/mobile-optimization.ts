/**
 * Mobile touch optimization utilities
 * Ensures proper touch targets and mobile-first design patterns
 */

import { cn } from "@/lib/utils";

/**
 * Touch target size constants following accessibility guidelines
 */
export const TOUCH_TARGETS = {
  MINIMUM: 44, // Minimum recommended touch target size (44px)
  COMFORTABLE: 48, // Comfortable touch target size
  LARGE: 56, // Large touch target for primary actions
} as const;

/**
 * Mobile breakpoints for responsive design
 */
export const MOBILE_BREAKPOINTS = {
  MOBILE: 767, // Mobile devices
  TABLET: 1024, // Tablet devices
  DESKTOP: 1280, // Desktop devices
} as const;

/**
 * Touch-optimized button size classes
 */
export const touchButtonSizes = {
  sm: "min-h-[44px] min-w-[44px] px-3 py-2 text-sm",
  md: "min-h-[48px] min-w-[48px] px-4 py-3 text-base", 
  lg: "min-h-[56px] min-w-[56px] px-6 py-4 text-lg",
} as const;

/**
 * Touch-optimized spacing for mobile interfaces
 */
export const mobileSpacing = {
  touchPadding: "p-4", // Comfortable padding around touch elements
  stackSpacing: "space-y-4", // Vertical spacing between stacked elements
  gridGap: "gap-4", // Grid gap for touch-friendly layouts
  listSpacing: "space-y-2", // List item spacing
} as const;

/**
 * Generate touch-friendly button classes
 */
export function getTouchButtonClasses(
  size: keyof typeof touchButtonSizes = "md",
  variant: "default" | "ghost" | "outline" = "default"
): string {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
  const sizeClasses = touchButtonSizes[size];
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  };

  return cn(baseClasses, sizeClasses, variantClasses[variant]);
}

/**
 * Generate mobile-optimized grid layout classes
 */
export function getMobileGridClasses(
  columns: { mobile: number; tablet?: number; desktop?: number }
): string {
  const { mobile, tablet = mobile * 2, desktop = tablet + 1 } = columns;
  
  return cn(
    `grid grid-cols-${mobile}`,
    `md:grid-cols-${tablet}`,
    `lg:grid-cols-${desktop}`,
    mobileSpacing.gridGap
  );
}

/**
 * Generate touch-friendly list item classes
 */
export function getTouchListItemClasses(interactive: boolean = true): string {
  const baseClasses = "flex items-center w-full rounded-lg transition-colors";
  const paddingClasses = mobileSpacing.touchPadding;
  const interactiveClasses = interactive 
    ? "hover:bg-accent focus:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
    : "";

  return cn(baseClasses, paddingClasses, interactiveClasses);
}

/**
 * Mobile-optimized dialog/bottom sheet trigger classes
 */
export function getMobileDialogTriggerClasses(): string {
  return cn(
    "min-h-[44px]", // Ensure minimum touch target
    "w-full", // Full width for easy tapping
    "justify-start", // Left-align content
    mobileSpacing.touchPadding,
    "hover:bg-accent",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-ring"
  );
}

/**
 * Generate mobile navigation classes
 */
export function getMobileNavClasses(): string {
  return cn(
    "flex",
    "overflow-x-auto", // Allow horizontal scrolling
    "scrollbar-hide", // Hide scrollbar for clean look
    "snap-x", // Snap scrolling
    "snap-mandatory",
    mobileSpacing.gridGap
  );
}

/**
 * Responsive text size classes optimized for mobile readability
 */
export const mobileTextSizes = {
  xs: "text-xs leading-relaxed",
  sm: "text-sm leading-relaxed", 
  base: "text-base leading-relaxed md:text-sm",
  lg: "text-lg leading-relaxed md:text-base",
  xl: "text-xl leading-relaxed md:text-lg",
  "2xl": "text-2xl leading-tight md:text-xl",
} as const;

/**
 * Check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= MOBILE_BREAKPOINTS.MOBILE;
}

/**
 * Get device-appropriate spacing
 */
export function getResponsiveSpacing(type: 'padding' | 'margin' | 'gap' = 'padding'): string {
  const spacingMap = {
    padding: "p-3 md:p-4 lg:p-6",
    margin: "m-3 md:m-4 lg:m-6", 
    gap: "gap-3 md:gap-4 lg:gap-6",
  };
  
  return spacingMap[type];
}

/**
 * Mobile-first form input classes
 */
export function getMobileInputClasses(): string {
  return cn(
    "min-h-[44px]", // Touch target compliance
    "px-3 py-2",
    "text-base", // Prevent zoom on iOS
    "border border-input",
    "rounded-md",
    "bg-background",
    "focus-visible:outline-none",
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "disabled:cursor-not-allowed",
    "disabled:opacity-50"
  );
}

/**
 * Audit component for touch target compliance
 */
export function auditTouchTargets(element: HTMLElement): {
  compliant: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check interactive elements
  const interactiveElements = element.querySelectorAll('button, a, input, [role="button"], [tabindex]');
  
  interactiveElements.forEach((el, index) => {
    const rect = el.getBoundingClientRect();
    const isClickable = el.tagName.toLowerCase() === 'button' || 
                       el.tagName.toLowerCase() === 'a' ||
                       el.hasAttribute('onclick') ||
                       el.getAttribute('role') === 'button';
    
    if (isClickable && (rect.height < TOUCH_TARGETS.MINIMUM || rect.width < TOUCH_TARGETS.MINIMUM)) {
      issues.push(`Element ${index + 1} (${el.tagName.toLowerCase()}) is too small: ${rect.width}x${rect.height}px`);
      suggestions.push(`Increase size to at least ${TOUCH_TARGETS.MINIMUM}x${TOUCH_TARGETS.MINIMUM}px`);
    }
  });
  
  return {
    compliant: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Mobile-specific animation classes
 */
export const mobileAnimations = {
  slideUp: "animate-in slide-in-from-bottom-2 duration-300",
  slideDown: "animate-out slide-out-to-bottom-2 duration-300",
  fadeIn: "animate-in fade-in-0 duration-200",
  fadeOut: "animate-out fade-out-0 duration-200",
  scaleIn: "animate-in zoom-in-95 duration-200",
  scaleOut: "animate-out zoom-out-95 duration-200",
} as const;