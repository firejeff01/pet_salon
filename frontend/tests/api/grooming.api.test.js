import { describe, test, expect, vi, beforeEach } from 'vitest'

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}))

vi.mock('@/api/client.js', () => ({ default: mockClient }))

import { getAll, getById, getByAppointmentId, create, update } from '@/api/grooming.api.js'

describe('Grooming API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getAll() calls GET /grooming-records', async () => {
    mockClient.get.mockResolvedValue([])
    await getAll()
    expect(mockClient.get).toHaveBeenCalledWith('/grooming-records')
  })

  test('getById(id) calls GET /grooming-records/ID', async () => {
    mockClient.get.mockResolvedValue({})
    await getById(1)
    expect(mockClient.get).toHaveBeenCalledWith('/grooming-records/1')
  })

  test('getByAppointmentId(id) calls GET /grooming-records/appointment/ID', async () => {
    mockClient.get.mockResolvedValue({})
    await getByAppointmentId(5)
    expect(mockClient.get).toHaveBeenCalledWith('/grooming-records/appointment/5')
  })

  test('create(data) calls POST /grooming-records', async () => {
    const data = { appointmentId: 1, services: ['洗澡'] }
    mockClient.post.mockResolvedValue({})
    await create(data)
    expect(mockClient.post).toHaveBeenCalledWith('/grooming-records', data)
  })

  test('update(id, data) calls PUT /grooming-records/ID', async () => {
    const data = { services: ['洗澡', '美容'] }
    mockClient.put.mockResolvedValue({})
    await update(1, data)
    expect(mockClient.put).toHaveBeenCalledWith('/grooming-records/1', data)
  })
})
