import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as appointmentApi from '@/api/appointment.api.js'

export const useAppointmentStore = defineStore('appointment', () => {
  const appointments = ref([])
  const currentAppointment = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchByDate(date) {
    loading.value = true
    error.value = null
    try {
      appointments.value = await appointmentApi.getByDate(date)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function fetchByMonth(year, month) {
    loading.value = true
    error.value = null
    try {
      appointments.value = await appointmentApi.getByMonth(year, month)
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
      currentAppointment.value = await appointmentApi.getById(id)
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createAppointment(data) {
    loading.value = true
    error.value = null
    try {
      const result = await appointmentApi.create(data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateAppointment(id, data) {
    loading.value = true
    error.value = null
    try {
      const result = await appointmentApi.update(id, data)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function cancelAppointment(id, reason) {
    loading.value = true
    error.value = null
    try {
      const result = await appointmentApi.cancel(id, reason)
      return result
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    appointments, currentAppointment, loading, error,
    fetchByDate, fetchByMonth, fetchById,
    createAppointment, updateAppointment, cancelAppointment
  }
})
