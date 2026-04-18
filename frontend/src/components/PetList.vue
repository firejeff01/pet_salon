<template>
  <div class="pet-list">
    <h3>🐾 寵物列表</h3>
    <div v-if="pets.length === 0" class="empty">尚無寵物資料</div>
    <div v-else class="grid">
      <div v-for="pet in pets" :key="pet.id" class="pet-card" @click="$emit('select', pet)">
        <span class="species-icon">{{ pet.species === '貓' ? '🐱' : '🐶' }}</span>
        <div class="info">
          <span class="pet-name">{{ pet.name }}</span>
          <span class="meta">{{ pet.breed }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as petApi from '@/api/pet.api.js'

const props = defineProps({
  ownerId: { type: String, required: true }
})

defineEmits(['select'])

const pets = ref([])

async function fetchPets() {
  try {
    pets.value = await petApi.getByOwnerId(props.ownerId)
  } catch (e) {
    console.error(e)
  }
}

watch(() => props.ownerId, fetchPets)
onMounted(fetchPets)

defineExpose({ reload: fetchPets })
</script>

<style scoped>
.pet-list h3 { margin-bottom: var(--sp-3); }
.empty { color: var(--color-text-muted); font-size: var(--fs-sm); }

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: var(--sp-3);
}

.pet-card {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, #fff, var(--color-pink-50));
  cursor: pointer;
  transition: all var(--transition);
}
.pet-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
}

.species-icon { font-size: 28px; }
.info { display: flex; flex-direction: column; }
.pet-name { font-weight: 700; color: var(--color-brown-700); }
.meta { font-size: var(--fs-xs); color: var(--color-text-muted); }
</style>
