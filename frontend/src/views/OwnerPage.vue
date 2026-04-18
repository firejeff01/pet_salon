<template>
  <div class="owner-page">
    <div class="layout">
      <aside class="sidebar">
        <OwnerList ref="ownerListRef" @select="selectOwner" />
        <button type="button" class="full" @click="newOwner">➕ 新增飼主</button>
      </aside>
      <section class="content">
        <OwnerForm
          v-if="showOwnerForm"
          :key="ownerKey"
          :owner-id="selectedOwnerId"
          @saved="onOwnerSaved"
        />
        <div v-else-if="!selectedOwnerId" class="placeholder card">
          <p>從左側選擇飼主，或點擊「➕ 新增飼主」</p>
        </div>
        <div v-if="selectedOwnerId" class="pets-block card">
          <div class="block-header">
            <h3>🐾 {{ selectedOwner?.name }} 的寵物與預約</h3>
          </div>
          <PetList ref="petListRef" :owner-id="selectedOwnerId" @select="selectPet" />
          <div class="row-actions">
            <button type="button" class="secondary" @click="newPet">➕ 新增寵物</button>
            <button type="button" class="secondary" @click="newAppointment">📅 新增預約</button>
          </div>
          <PetForm
            v-if="showPetForm"
            :key="petKey"
            :owner-id="selectedOwnerId"
            :pet-id="selectedPetId"
            @saved="onPetSaved"
          />
          <AppointmentForm
            v-if="showAppointmentForm"
            :key="apptKey"
            :owner-id="selectedOwnerId"
            @saved="onAppointmentSaved"
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import OwnerList from '@/components/OwnerList.vue'
import OwnerForm from '@/components/OwnerForm.vue'
import PetList from '@/components/PetList.vue'
import PetForm from '@/components/PetForm.vue'
import AppointmentForm from '@/components/AppointmentForm.vue'
import * as ownerApi from '@/api/owner.api.js'

const route = useRoute()
const selectedOwnerId = ref(null)
const selectedOwner = ref(null)
const selectedPetId = ref(null)
const showOwnerForm = ref(true)
const showPetForm = ref(false)
const showAppointmentForm = ref(false)
const ownerKey = ref(0)
const petKey = ref(0)
const apptKey = ref(0)
const ownerListRef = ref(null)
const petListRef = ref(null)

async function loadOwner(id) {
  try {
    selectedOwner.value = await ownerApi.getById(id)
  } catch (e) {
    console.error(e)
  }
}

function selectOwner(owner) {
  selectedOwnerId.value = owner.id
  selectedOwner.value = owner
  showOwnerForm.value = true
  ownerKey.value++
  showPetForm.value = false
  showAppointmentForm.value = false
}

function newOwner() {
  selectedOwnerId.value = null
  selectedOwner.value = null
  showOwnerForm.value = true
  ownerKey.value++
}

async function onOwnerSaved(saved) {
  // If a new owner was just created, adopt its id so subsequent pet/appointment actions work
  if (saved && saved.id && !selectedOwnerId.value) {
    selectedOwnerId.value = saved.id
    selectedOwner.value = saved
  } else if (selectedOwnerId.value) {
    await loadOwner(selectedOwnerId.value)
  }
  if (ownerListRef.value && ownerListRef.value.reload) {
    await ownerListRef.value.reload()
  }
}

function selectPet(pet) {
  selectedPetId.value = pet.id
  showPetForm.value = true
  petKey.value++
}

function newPet() {
  selectedPetId.value = null
  showPetForm.value = true
  petKey.value++
}

async function onPetSaved() {
  showPetForm.value = false
  petKey.value++
  if (petListRef.value && petListRef.value.reload) {
    await petListRef.value.reload()
  }
}

function newAppointment() {
  showAppointmentForm.value = true
  apptKey.value++
}

function onAppointmentSaved() {
  showAppointmentForm.value = false
}

function applyRoute() {
  const paramId = route.params.id || null
  if (paramId) {
    selectedOwnerId.value = paramId
    loadOwner(paramId)
    showOwnerForm.value = true
    ownerKey.value++
  }
}

onMounted(applyRoute)
watch(() => route.params.id, applyRoute)
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: var(--sp-5);
  align-items: flex-start;
}
.sidebar { display: flex; flex-direction: column; gap: var(--sp-3); position: sticky; top: 100px; }
.sidebar button.full { width: 100%; }

.content { display: flex; flex-direction: column; gap: var(--sp-5); }

.pets-block { display: flex; flex-direction: column; gap: var(--sp-4); }
.block-header h3 { margin: 0 0 var(--sp-2); padding-bottom: var(--sp-3); border-bottom: 1px dashed var(--color-border); }
.row-actions { display: flex; gap: var(--sp-3); flex-wrap: wrap; }

@media (max-width: 900px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; }
}
</style>
