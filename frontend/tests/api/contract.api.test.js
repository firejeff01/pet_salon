import { describe, test, expect, vi, beforeEach } from 'vitest'

const { mockClient } = vi.hoisted(() => ({
  mockClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  }
}))

vi.mock('@/api/client.js', () => ({ default: mockClient }))

import { generate, download, getVersions, sign } from '@/api/contract.api.js'

describe('Contract API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('generate(recordId) calls POST /contracts/generate', async () => {
    mockClient.post.mockResolvedValue({})
    await generate(10)
    expect(mockClient.post).toHaveBeenCalledWith('/contracts/generate', { recordId: 10 })
  })

  test('download(recordId) calls GET /contracts/RECORDID', async () => {
    mockClient.get.mockResolvedValue(new Blob())
    await download(10)
    expect(mockClient.get).toHaveBeenCalledWith('/contracts/10', { responseType: 'blob' })
  })

  test('getVersions(recordId) calls GET /contracts/RECORDID/versions', async () => {
    mockClient.get.mockResolvedValue([])
    await getVersions(10)
    expect(mockClient.get).toHaveBeenCalledWith('/contracts/10/versions')
  })

  test('sign(recordId, signatureImage) calls POST /contracts/RECORDID/sign', async () => {
    const sig = 'data:image/png;base64,abc123'
    mockClient.post.mockResolvedValue({})
    await sign(10, sig)
    expect(mockClient.post).toHaveBeenCalledWith('/contracts/10/sign', { signatureImage: sig })
  })
})
