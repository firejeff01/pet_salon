import { describe, test, expect, vi, beforeEach } from 'vitest'

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}))

vi.mock('@/api/client.js', () => ({ default: mockClient }))

import { getAll, getById, getByOwnerId, create, update } from '@/api/pet.api.js'

describe('Pet API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getAll() calls GET /pets', async () => {
    mockClient.get.mockResolvedValue([])
    await getAll()
    expect(mockClient.get).toHaveBeenCalledWith('/pets')
  })

  test('getById(id) calls GET /pets/ID', async () => {
    mockClient.get.mockResolvedValue({})
    await getById(5)
    expect(mockClient.get).toHaveBeenCalledWith('/pets/5')
  })

  test('getByOwnerId(ownerId) calls GET /owners/ID/pets', async () => {
    mockClient.get.mockResolvedValue([])
    await getByOwnerId(3)
    expect(mockClient.get).toHaveBeenCalledWith('/owners/3/pets')
  })

  test('create(data) calls POST /pets', async () => {
    const data = { name: '小白', species: '犬' }
    mockClient.post.mockResolvedValue({})
    await create(data)
    expect(mockClient.post).toHaveBeenCalledWith('/pets', data)
  })

  test('update(id, data) calls PUT /pets/ID', async () => {
    const data = { name: '小白' }
    mockClient.put.mockResolvedValue({})
    await update(2, data)
    expect(mockClient.put).toHaveBeenCalledWith('/pets/2', data)
  })
})
