import { describe, test, expect, vi, beforeEach } from 'vitest'

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}))

vi.mock('@/api/client.js', () => ({ default: mockClient }))

import { getAll, create, restore } from '@/api/backup.api.js'

describe('Backup API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('getAll() calls GET /backup', async () => {
    mockClient.get.mockResolvedValue([])
    await getAll()
    expect(mockClient.get).toHaveBeenCalledWith('/backup')
  })

  test('create() calls POST /backup', async () => {
    mockClient.post.mockResolvedValue({})
    await create()
    expect(mockClient.post).toHaveBeenCalledWith('/backup')
  })

  test('restore(id) calls POST /backup/ID/restore', async () => {
    mockClient.post.mockResolvedValue({})
    await restore(5)
    expect(mockClient.post).toHaveBeenCalledWith('/backup/5/restore')
  })
})
