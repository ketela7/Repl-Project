/* eslint-disable no-unused-vars */
/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(text?: string | RegExp): R
      toHaveClass(className?: string): R
      toBeVisible(): R
      toHaveAttribute(attribute?: string, value?: string): R
    }
  }
}
