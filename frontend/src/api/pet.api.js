import client from './client.js'

export function getAll() {
  return client.get('/pets')
}

export function getById(id) {
  return client.get(`/pets/${id}`)
}

export function getByOwnerId(ownerId) {
  return client.get(`/owners/${ownerId}/pets`)
}

export function create(data) {
  return client.post('/pets', data)
}

export function update(id, data) {
  return client.put(`/pets/${id}`, data)
}
