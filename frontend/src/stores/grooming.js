import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as groomingApi from '@/api/grooming.api.js'

export const useGroomingStore = defineStore('grooming', () => {
  const records = ref([])
  const currentRecord = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      records.value = await groomingApi.getAll()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id) {
    loading.value = true
    error.value = null
    try {
      currentRecord.value = await groomingApi.getById(id)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createRecord(data) {
    loading.value = true
    error.value = null
    try {
      const result = await groomingApi.create(data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateRecord(id, data) {
    loading.value = true
    error.value = null
    try {
      const result = await groomingApi.update(id, data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    records, currentRecord, loading, error,
    fetchAll, fetchById, createRecord, updateRecord
  }
})
