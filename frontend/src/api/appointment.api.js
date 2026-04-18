import client from './client.js'

export function getAll() {
  return client.get('/appointments')
}

export function getById(id) {
  return client.get(`/appointments/${id}`)
}

export function getByDate(date) {
  return client.get('/appointments', { params: { date } })
}

export function getByMonth(year, month) {
  return client.get('/appointments', { params: { year, month } })
}

export function create(data) {
  return client.post('/appointments', data)
}

export function update(id, data) {
  return client.put(`/appointments/${id}`, data)
}

export function cancel(id, reason) {
  return client.put(`/appointments/${id}/cancel`, { reason })
}
