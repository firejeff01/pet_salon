import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as petApi from '@/api/pet.api.js'

export const usePetStore = defineStore('pet', () => {
  const pets = ref([])
  const currentPet = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchByOwnerId(ownerId) {
    loading.value = true
    error.value = null
    try {
      pets.value = await petApi.getByOwnerId(ownerId)
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
      currentPet.value = await petApi.getById(id)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createPet(data) {
    loading.value = true
    error.value = null
    try {
      const result = await petApi.create(data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updatePet(id, data) {
    loading.value = true
    error.value = null
    try {
      const result = await petApi.update(id, data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    pets, currentPet, loading, error,
    fetchByOwnerId, fetchById, createPet, updatePet
  }
})
