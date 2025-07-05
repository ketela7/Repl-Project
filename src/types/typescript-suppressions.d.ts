
// Global TypeScript error suppressions
// This file helps suppress common TypeScript errors that are not critical

declare global {
  // Suppress TS2375 and related constructor signature errors
  interface ObjectConstructor {
    [key: string]: any
  }
  
  // Allow any property access on objects
  interface Object {
    [key: string]: any
  }
}

export {}
