import { cache } from '../cache'

describe('Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.clear()
  })

  it('should store and retrieve values', () => {
    const key = 'testkey'
    const value = { data: 'testdata' }

    cache.set(key, value)
    const retrieved = cache.get(key)

    expect(retrieved).toEqual(value)
  })

  it('should return undefined for nonexistent keys', () => {
    const result = cache.get('nonexistentkey')
    expect(result).toBeUndefined()
  })

  it('should handle cache expiration', async () => {
    const key = 'expiringkey'
    const value = 'expiringvalue'
    const ttl = 100 // 100ms

    cache.set(key, value, ttl)
    expect(cache.get(key)).toBe(value)

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150))
    expect(cache.get(key)).toBeUndefined()
  })

  it('should check if key exists', () => {
    const key = 'existingkey'

    expect(cache.has(key)).toBe(false)

    cache.set(key, 'value')
    expect(cache.has(key)).toBe(true)
  })

  it('should delete specific keys', () => {
    const key = 'deletekey'

    cache.set(key, 'value')
    expect(cache.has(key)).toBe(true)

    cache.delete(key)
    expect(cache.has(key)).toBe(false)
  })

  it('should clear all cache', () => {
    cache.set('key1', 'value1')
    cache.set('key2', 'value2')

    expect(cache.has('key1')).toBe(true)
    expect(cache.has('key2')).toBe(true)

    cache.clear()

    expect(cache.has('key1')).toBe(false)
    expect(cache.has('key2')).toBe(false)
  })
})
