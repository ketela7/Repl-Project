/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(_?: string | RegExp): R
      toHaveClass(_?: string): R
      toBeVisible(): R
      toHaveAttribute(_?: string, _?: string): R
    }
  }
}
