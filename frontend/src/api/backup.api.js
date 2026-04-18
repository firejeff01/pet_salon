import client from './client.js'

export function getAll() {
  return client.get('/backup')
}

export function create() {
  return client.post('/backup')
}

export function restore(id) {
  return client.post(`/backup/${id}/restore`)
}
