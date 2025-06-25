/**
 * UI Constants - Common UI-related constants
 */

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
} as const

export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
} as const

export const TOUCH_TARGET_SIZE = 44 // Minimum touch target size in pixels

export const PAGE_SIZES = [10, 25, 50, 100] as const
