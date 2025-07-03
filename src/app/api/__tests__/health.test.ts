import { GET } from '../health/route'

describe('/api/health', () => {
  it('should return health status', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      status: 'healthy',
      timestamp: expect.any(String),
      uptime: expect.any(Number),
    })
  })

  it('should return valid timestamp', async () => {
    const response = await GET()
    const data = await response.json()

    const timestamp = new Date(data.timestamp)
    expect(timestamp).toBeInstanceOf(Date)
    expect(timestamp.getTime()).not.toBeNaN()
  })

  it('should return positive uptime', async () => {
    const response = await GET()
    const data = await response.json()

    expect(data.uptime).toBeGreaterThan(0)
  })
})
