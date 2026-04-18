import { describe, test, expect, vi, beforeEach } from 'vitest'

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}))

vi.mock('@/api/client.js', () => ({ default: mockClient }))

import { getAll, search, getById, create, update } from '@/api/owner.api.js'

describe('Owner API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getAll() calls GET /owners', async () => {
    mockClient.get.mockResolvedValue([])
    await getAll()
    expect(mockClient.get).toHaveBeenCalledWith('/owners')
  })

  test('search(keyword) calls GET /owners?keyword=X', async () => {
    mockClient.get.mockResolvedValue([])
    await search('王')
    expect(mockClient.get).toHaveBeenCalledWith('/owners', { params: { keyword: '王' } })
  })

  test('getById(id) calls GET /owners/ID', async () => {
    mockClient.get.mockResolvedValue({})
    await getById(1)
    expect(mockClient.get).toHaveBeenCalledWith('/owners/1')
  })

  test('create(data) calls POST /owners', async () => {
    const data = { name: '王小明' }
    mockClient.post.mockResolvedValue({})
    await create(data)
    expect(mockClient.post).toHaveBeenCalledWith('/owners', data)
  })

  test('update(id, data) calls PUT /owners/ID', async () => {
    const data = { name: '王小明' }
    mockClient.put.mockResolvedValue({})
    await update(1, data)
    expect(mockClient.put).toHaveBeenCalledWith('/owners/1', data)
  })
})
