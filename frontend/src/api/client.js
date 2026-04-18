import axios from 'axios'

const client = axios.create({
  baseURL: '/api',
})

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 400 || status === 404) {
        return Promise.reject(new Error(data.error || data.message || '請求錯誤'))
      }
      if (status >= 500) {
        return Promise.reject(new Error('伺服器錯誤，請稍後再試'))
      }
    }
    return Promise.reject(new Error('網路錯誤，請檢查連線'))
  }
)

export default client
