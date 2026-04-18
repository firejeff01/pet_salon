import client from './client.js'

export function getAll() {
  return client.get('/grooming-records')
}

export function getById(id) {
  return client.get(`/grooming-records/${id}`)
}

export function getByAppointmentId(appointmentId) {
  return client.get(`/grooming-records/appointment/${appointmentId}`)
}

export function create(data) {
  return client.post('/grooming-records', data)
}

export function update(id, data) {
  return client.put(`/grooming-records/${id}`, data)
}
