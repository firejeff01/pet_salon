import client from './client.js'

export function getAll() {
  return client.get('/owners')
}

export function search(keyword) {
  return client.get('/owners', { params: { keyword } })
}

export function getById(id) {
  return client.get(`/owners/${id}`)
}

export function create(data) {
  return client.post('/owners', data)
}

export function update(id, data) {
  return client.put(`/owners/${id}`, data)
}
