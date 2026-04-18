<template>
  <div class="appointment-form card">
    <h2>
      <span class="icon" aria-hidden="true">📅</span>
      {{ appointmentId ? '編輯預約' : '新增預約' }}
    </h2>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message api-error">{{ errorMessage }}</div>
    <form class="form-grid" @submit.prevent="handleSubmit">
      <div class="field col-span-2" data-field="petId">
        <label>寵物</label>
        <select v-model="form.petId">
          <option value="">請選擇</option>
          <option v-for="pet in pets" :key="pet.id" :value="pet.id">{{ pet.name }}</option>
        </select>
        <span v-if="errors.petId" class="error-message">{{ errors.petId }}</span>
      </div>
      <div class="field" data-field="date">
        <label>日期</label>
        <input v-model="form.date" type="date" />
        <span v-if="errors.date" class="error-message">{{ errors.date }}</span>
      </div>
      <div class="field" data-field="time">
        <label>時間</label>
        <input v-model="form.time" type="time" />
        <span v-if="errors.time" class="error-message">{{ errors.time }}</span>
      </div>
      <div class="field col-span-2" data-field="note">
        <label>備註</label>
        <textarea v-model="form.note" placeholder="有需要特別注意的事項嗎？"></textarea>
      </div>
      <div class="form-actions col-span-2">
        <button type="submit">💾 儲存預約</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as appointmentApi from '@/api/appointment.api.js'
import * as petApi from '@/api/pet.api.js'

const props = defineProps({
  ownerId: { type: String, default: null },
  appointmentId: { type: String, default: null },
})

const emit = defineEmits(['saved'])

const form = reactive({
  petId: '',
  date: '',
  time: '',
  note: '',
})

const pets = ref([])
const errors = reactive({})
const successMessage = ref('')
const errorMessage = ref('')

function validate() {
  const errs = {}
  if (!form.petId) errs.petId = '請選擇寵物'
  if (!form.date) errs.date = '日期為必填'
  if (!form.time) errs.time = '時間為必填'
  Object.keys(errors).forEach(k => delete errors[k])
  Object.assign(errors, errs)
  return Object.keys(errs).length === 0
}

async function handleSubmit() {
  successMessage.value = ''
  errorMessage.value = ''
  if (!validate()) return
  try {
    const payload = { ...form, ownerId: props.ownerId }
    if (props.appointmentId) {
      await appointmentApi.update(props.appointmentId, payload)
    } else {
      await appointmentApi.create(payload)
    }
    successMessage.value = '預約已儲存'
    emit('saved')
  } catch (e) {
    errorMessage.value = e.message || '儲存失敗'
  }
}

onMounted(async () => {
  if (props.ownerId) {
    try {
      pets.value = await petApi.getByOwnerId(props.ownerId)
    } catch (e) {
      errorMessage.value = e.message
    }
  }
  if (props.appointmentId) {
    try {
      const data = await appointmentApi.getById(props.appointmentId)
      Object.assign(form, data)
    } catch (e) {
      errorMessage.value = e.message
    }
  }
})
</script>

<style scoped>
.appointment-form h2 { display: flex; align-items: center; gap: 8px; }
.appointment-form .icon { font-size: 22px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-4) var(--sp-5);
}
.col-span-2 { grid-column: span 2; }
.field { display: flex; flex-direction: column; }
.form-actions { display: flex; justify-content: flex-end; }

@media (max-width: 700px) {
  .form-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
}
</style>
