import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as ownerApi from '@/api/owner.api.js'

export const useOwnerStore = defineStore('owner', () => {
  const owners = ref([])
  const currentOwner = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      owners.value = await ownerApi.getAll()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function searchOwners(keyword) {
    loading.value = true
    error.value = null
    try {
      owners.value = await ownerApi.search(keyword)
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
      currentOwner.value = await ownerApi.getById(id)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createOwner(data) {
    loading.value = true
    error.value = null
    try {
      const result = await ownerApi.create(data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateOwner(id, data) {
    loading.value = true
    error.value = null
    try {
      const result = await ownerApi.update(id, data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    owners, currentOwner, loading, error,
    fetchAll, searchOwners, fetchById, createOwner, updateOwner
  }
})
