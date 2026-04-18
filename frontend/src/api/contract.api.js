import client from './client.js'

export function generate(recordId) {
  return client.post('/contracts/generate', { recordId })
}

export function download(recordId) {
  return client.get(`/contracts/${recordId}`, { responseType: 'blob' })
}

export function getVersions(recordId) {
  return client.get(`/contracts/${recordId}/versions`)
}

export function sign(recordId, signatureImage) {
  return client.post(`/contracts/${recordId}/sign`, { signatureImage })
}
