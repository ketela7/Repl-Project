
import { cn } from '../utils'
import { type ClassValue } from 'clsx'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class')
      expect(result).toContain('base-class')
      expect(result).toContain('additional-class')
    })

    it('should handle conditional classes', () => {
      const result = cn('base-class', false && 'hidden-class', 'visible-class')
      expect(result).toContain('base-class')
      expect(result).toContain('visible-class')
      expect(result).not.toContain('hidden-class')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'final-class')
      expect(result).toContain('base-class')
      expect(result).toContain('final-class')
    })

    it('should handle empty strings', () => {
      const result = cn('base-class', '', 'final-class')
      expect(result).toContain('base-class')
      expect(result).toContain('final-class')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle objects with conditional classes', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'visible': true
      })
      expect(result).toContain('active')
      expect(result).toContain('visible')
      expect(result).not.toContain('disabled')
    })

    it('should merge Tailwind classes correctly', () => {
      const result = cn('p-4 text-red-500', 'p-2 text-blue-500')
      // Should prioritize the last class when conflicts occur
      expect(result).toContain('p-2')
      expect(result).toContain('text-blue-500')
    })

    it('should handle complex mixed inputs', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        { 'conditional': true, 'false-conditional': false },
        undefined,
        null,
        'final'
      )
      expect(result).toContain('base')
      expect(result).toContain('array1')
      expect(result).toContain('array2')
      expect(result).toContain('conditional')
      expect(result).toContain('final')
      expect(result).not.toContain('false-conditional')
    })
  })
})
