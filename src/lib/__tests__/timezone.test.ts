import {
  getUserTimezone,
  formatDateToUserTimezone,
  convertUTCToUserTimezone,
  getRelativeTime,
  formatFileTime,
  getTimezoneDisplayName,
} from '../timezone'

// Mock Intl.DateTimeFormat
const mockDateTimeFormat = jest.fn().mockImplementation(() => ({
  format: jest.fn((date) => '6/21/2025, 10:00:00 AM'),
  resolvedOptions: jest.fn(() => ({ timeZone: 'America/New_York' })),
}))

Object.defineProperty(Intl, 'DateTimeFormat', {
  writable: true,
  value: mockDateTimeFormat,
})

// Mock Intl.RelativeTimeFormat
const mockRelativeTimeFormat = jest.fn().mockImplementation(() => ({
  format: jest.fn((value, unit) => `${value} ${unit} ago`),
}))

Object.defineProperty(Intl, 'RelativeTimeFormat', {
  writable: true,
  value: mockRelativeTimeFormat,
})

describe('Timezone Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  describe('getUserTimezone', () => {
    it('returns browser timezone', () => {
      // Mock Intl.DateTimeFormat to return a specific timezone
      const originalDateTimeFormat = Intl.DateTimeFormat
      Intl.DateTimeFormat = jest.fn().mockImplementation(() => ({
        resolvedOptions: () => ({ timeZone: 'America/New_York' })
      })) as any

      const timezone = getUserTimezone()
      expect(timezone).toBe('America/New_York')

      // Restore original
      Intl.DateTimeFormat = originalDateTimeFormat
    })
  })

  describe('formatDateToUserTimezone', () => {
    it('formats date to user timezone', () => {
      const date = new Date('2025-06-21T14:00:00.000Z')
      const formatted = formatDateToUserTimezone(date, 'America/New_York')
      
      expect(mockDateTimeFormat).toHaveBeenCalledWith(
        'en-US',
        expect.objectContaining({
          timeZone: 'America/New_York',
        })
      )
    })

    it('uses default timezone when none provided', () => {
      const date = new Date('2025-06-21T14:00:00.000Z')
      formatDateToUserTimezone(date)
      
      expect(mockDateTimeFormat).toHaveBeenCalled()
    })
  })

  describe('convertUTCToUserTimezone', () => {
    it('converts UTC string to user timezone', () => {
      const utcDate = '2025-06-21T14:00:00.000Z'
      const converted = convertUTCToUserTimezone(utcDate, 'America/New_York')
      
      expect(converted).toBeInstanceOf(Date)
    })

    it('handles Date object input', () => {
      const utcDate = new Date('2025-06-21T14:00:00.000Z')
      const converted = convertUTCToUserTimezone(utcDate, 'America/New_York')
      
      expect(converted).toBeInstanceOf(Date)
    })
  })

  describe('getRelativeTime', () => {
    it('returns relative time for recent date', () => {
      const recentDate = new Date(Date.now() - 3600000) // 1 hour ago
      const relative = getRelativeTime(recentDate, 'America/New_York')
      
      expect(typeof relative).toBe('string')
    })

    it('handles string date input', () => {
      const dateString = '2025-06-21T14:00:00.000Z'
      const relative = getRelativeTime(dateString, 'America/New_York')
      
      expect(typeof relative).toBe('string')
    })
  })

  describe('formatFileTime', () => {
    it('formats file modification time', () => {
      const dateString = '2025-06-21T14:00:00.000Z'
      const formatted = formatFileTime(dateString, 'America/New_York')
      
      expect(typeof formatted).toBe('string')
      expect(mockDateTimeFormat).toHaveBeenCalled()
    })
  })

  describe('getTimezoneDisplayName', () => {
    it('returns display name for timezone', () => {
      const displayName = getTimezoneDisplayName('America/New_York')
      expect(typeof displayName).toBe('string')
    })

    it('returns default timezone display when none provided', () => {
      const displayName = getTimezoneDisplayName()
      expect(typeof displayName).toBe('string')
    })
  })
})