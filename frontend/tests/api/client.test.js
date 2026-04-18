import { describe, test, expect, vi, beforeEach } from 'vitest'

let mockAxiosInstance
let successInterceptor
let errorInterceptor

vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn((config) => {
        mockAxiosInstance = {
          get: vi.fn(),
          post: vi.fn(),
          put: vi.fn(),
          delete: vi.fn(),
          defaults: { baseURL: config.baseURL },
          interceptors: {
            request: { use: vi.fn() },
            response: {
              use: vi.fn((success, error) => {
                successInterceptor = success
                errorInterceptor = error
              })
            }
          }
        }
        return mockAxiosInstance
      })
    }
  }
})

describe('API Client', () => {
  beforeEach(async () => {
    vi.resetModules()
    await import('@/api/client.js')
  })

  test('base URL is /api', () => {
    expect(mockAxiosInstance.defaults.baseURL).toBe('/api')
  })

  test('200 response returns data directly', () => {
    const response = { data: { id: 1, name: 'Test' }, status: 200 }
    const result = successInterceptor(response)
    expect(result).toEqual({ id: 1, name: 'Test' })
  })

  test('400 response throws with error.message', async () => {
    const error = {
      response: { status: 400, data: { error: '欄位驗證失敗' } }
    }
    await expect(errorInterceptor(error)).rejects.toThrow('欄位驗證失敗')
  })

  test('404 response throws with error.message', async () => {
    const error = {
      response: { status: 404, data: { error: '找不到資料' } }
    }
    await expect(errorInterceptor(error)).rejects.toThrow('找不到資料')
  })

  test('500 response throws generic error', async () => {
    const error = {
      response: { status: 500, data: {} }
    }
    await expect(errorInterceptor(error)).rejects.toThrow('伺服器錯誤，請稍後再試')
  })
})
