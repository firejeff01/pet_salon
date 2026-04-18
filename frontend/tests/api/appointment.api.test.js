import { describe, test, expect, vi, beforeEach } from 'vitest'

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}))

vi.mock('@/api/client.js', () => ({ default: mockClient }))

import { getAll, getById, getByDate, getByMonth, create, update, cancel } from '@/api/appointment.api.js'

describe('Appointment API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getAll() calls GET /appointments', async () => {
    mockClient.get.mockResolvedValue([])
    await getAll()
    expect(mockClient.get).toHaveBeenCalledWith('/appointments')
  })

  test('getById(id) calls GET /appointments/ID', async () => {
    mockClient.get.mockResolvedValue({})
    await getById(1)
    expect(mockClient.get).toHaveBeenCalledWith('/appointments/1')
  })

  test('getByDate(date) calls GET /appointments?date=X', async () => {
    mockClient.get.mockResolvedValue([])
    await getByDate('2026-04-16')
    expect(mockClient.get).toHaveBeenCalledWith('/appointments', { params: { date: '2026-04-16' } })
  })

  test('getByMonth(year, month) calls GET /appointments?year=X&month=Y', async () => {
    mockClient.get.mockResolvedValue([])
    await getByMonth(2026, 4)
    expect(mockClient.get).toHaveBeenCalledWith('/appointments', { params: { year: 2026, month: 4 } })
  })

  test('create(data) calls POST /appointments', async () => {
    const data = { petId: 1, date: '2026-04-20', time: '10:00' }
    mockClient.post.mockResolvedValue({})
    await create(data)
    expect(mockClient.post).toHaveBeenCalledWith('/appointments', data)
  })

  test('update(id, data) calls PUT /appointments/ID', async () => {
    const data = { time: '11:00' }
    mockClient.put.mockResolvedValue({})
    await update(1, data)
    expect(mockClient.put).toHaveBeenCalledWith('/appointments/1', data)
  })

  test('cancel(id, reason) calls PUT /appointments/ID/cancel', async () => {
    mockClient.put.mockResolvedValue({})
    await cancel(1, '客戶取消')
    expect(mockClient.put).toHaveBeenCalledWith('/appointments/1/cancel', { reason: '客戶取消' })
  })
})
