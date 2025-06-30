/// <reference types="@testing-library/jest-dom" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R
      toHaveTextContent(_text?: string | RegExp): R
      toHaveClass(_className?: string): R
      toBeVisible(): R
      toHaveAttribute(_attribute?: string, _value?: string): R
    }
  }
}
