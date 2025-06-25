import { renderHook, act } from '@testing-library/react'

import { useDebouncedValue } from '../use-debounced-value'

// Mock timers
jest.useFakeTimers()

describe('useDebouncedValue', () => {
  afterEach(() => {
    jest.clearAllTimers()
  })

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('initial', 500))

    expect(result.current).toBe('initial')
  })

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    expect(result.current).toBe('initial')

    // Change value
    rerender({ value: 'updated', delay: 500 })

    // Value should still be initial immediately after change
    expect(result.current).toBe('initial')

    // Fast-forward time by 250ms (less than delay)
    act(() => {
      jest.advanceTimersByTime(250)
    })

    expect(result.current).toBe('initial')

    // Fast-forward time by another 250ms (total 500ms)
    act(() => {
      jest.advanceTimersByTime(250)
    })

    expect(result.current).toBe('updated')
  })

  it('resets debounce timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    )

    // First change
    rerender({ value: 'change1', delay: 500 })

    act(() => {
      jest.advanceTimersByTime(250)
    })

    // Second change before first debounce completes
    rerender({ value: 'change2', delay: 500 })

    act(() => {
      jest.advanceTimersByTime(250)
    })

    // Should still be initial because timer was reset
    expect(result.current).toBe('initial')

    // Complete the debounce
    act(() => {
      jest.advanceTimersByTime(250)
    })

    expect(result.current).toBe('change2')
  })

  it('handles different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: 'initial', delay: 1000 },
      }
    )

    rerender({ value: 'updated', delay: 1000 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  it('handles zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: 'initial', delay: 0 },
      }
    )

    rerender({ value: 'updated', delay: 0 })

    act(() => {
      jest.advanceTimersByTime(0)
    })

    expect(result.current).toBe('updated')
  })

  it('works with different data types', () => {
    // Test with number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: 0, delay: 500 },
      }
    )

    numberRerender({ value: 42, delay: 500 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(numberResult.current).toBe(42)

    // Test with object
    const initialObj = { count: 0 }
    const updatedObj = { count: 1 }

    const { result: objectResult, rerender: objectRerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      {
        initialProps: { value: initialObj, delay: 500 },
      }
    )

    objectRerender({ value: updatedObj, delay: 500 })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(objectResult.current).toBe(updatedObj)
  })
})
