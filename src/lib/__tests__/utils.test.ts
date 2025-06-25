import { cn, getInitials } from '../utils'

describe('Utils Library', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })

    it('handles conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'ignored')).toBe(
        'base conditional'
      )
    })

    it('handles undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('handles tailwind merge conflicts', () => {
      expect(cn('p-2 p-4')).toBe('p-4')
      expect(cn('text-red-500 text-blue-500')).toBe('text-blue-500')
    })

    it('returns empty string for no arguments', () => {
      expect(cn()).toBe('')
    })
  })

  describe('getInitials', () => {
    it('extracts initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Smith Wilson')).toBe('JSW')
    })

    it('handles single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('handles empty string', () => {
      expect(getInitials('')).toBe('?')
    })

    it('handles names with extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD')
    })

    it('handles special characters', () => {
      expect(getInitials('John-Paul Doe')).toBe('JD')
      expect(getInitials("John O'Connor")).toBe('JO')
    })

    it('converts to uppercase', () => {
      expect(getInitials('john doe')).toBe('JD')
    })

    it('limits to reasonable number of initials', () => {
      expect(getInitials('John Michael James Robert Smith')).toBe('JMJRS')
    })
  })
})
