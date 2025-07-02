import { cn } from '../utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      const result = cn('baseclass', 'additionalclass')
      expect(result).toContain('baseclass')
      expect(result).toContain('additionalclass')
    })

    it('should handle conditional classes', () => {
      const result = cn('baseclass', false && 'hiddenclass', 'visibleclass')
      expect(result).toContain('baseclass')
      expect(result).toContain('visibleclass')
      expect(result).not.toContain('hiddenclass')
    })

    it('should handle undefined and null values', () => {
      const result = cn('baseclass', undefined, null, 'finalclass')
      expect(result).toContain('baseclass')
      expect(result).toContain('finalclass')
    })

    it('should handle empty strings', () => {
      const result = cn('baseclass', '', 'finalclass')
      expect(result).toContain('baseclass')
      expect(result).toContain('finalclass')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('should handle objects with conditional classes', () => {
      const result = cn({
        active: true,
        disabled: false,
        visible: true,
      })
      expect(result).toContain('active')
      expect(result).toContain('visible')
      expect(result).not.toContain('disabled')
    })

    it('should merge Tailwind classes correctly', () => {
      const result = cn('p-4 textred-500', 'p-2 textblue-500')
      // Should prioritize the last class when conflicts occur
      expect(result).toContain('p-2')
      expect(result).toContain('textblue-500')
    })

    it('should handle complex mixed inputs', () => {
      const result = cn(
        'base',
        ['array1', 'array2'],
        { conditional: true, 'falseconditional': false },
        undefined,
        null,
        'final',
      )
      expect(result).toContain('base')
      expect(result).toContain('array1')
      expect(result).toContain('array2')
      expect(result).toContain('conditional')
      expect(result).toContain('final')
      expect(result).not.toContain('falseconditional')
    })
  })
})
