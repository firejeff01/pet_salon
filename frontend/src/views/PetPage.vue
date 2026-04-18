<template>
  <div class="pet-page">
    <div v-if="pet">
      <h2>{{ pet.name }} 的資料</h2>
      <PetForm :owner-id="pet.ownerId" :pet-id="pet.id" @saved="reload" />
    </div>
    <p v-else-if="error">{{ error }}</p>
    <p v-else>載入中...</p>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import PetForm from '@/components/PetForm.vue'
import * as petApi from '@/api/pet.api.js'

const route = useRoute()
const pet = ref(null)
const error = ref('')

async function reload() {
  error.value = ''
  const id = route.params.id
  if (!id) return
  try {
    pet.value = await petApi.getById(id)
  } catch (e) {
    error.value = e.message
  }
}

onMounted(reload)
watch(() => route.params.id, reload)
</script>
