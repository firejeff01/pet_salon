<template>
  <div class="owner-form card">
    <h2>
      <span class="icon" aria-hidden="true">👤</span>
      {{ ownerId ? '編輯飼主' : '新增飼主' }}
    </h2>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message api-error">{{ errorMessage }}</div>
    <form class="form-grid" @submit.prevent="handleSubmit">
      <div class="field" data-field="name">
        <label>姓名</label>
        <input v-model="form.name" type="text" placeholder="例：王小明" />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>
      <div class="field" data-field="nationalId">
        <label>身分證字號</label>
        <input v-model="form.nationalId" type="text" placeholder="A123456789" />
        <span v-if="errors.nationalId" class="error-message">{{ errors.nationalId }}</span>
      </div>
      <div class="field" data-field="phone">
        <label>電話</label>
        <input v-model="form.phone" type="text" placeholder="0912-345-678" />
        <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
      </div>
      <div class="field col-span-2" data-field="address">
        <label>地址</label>
        <input v-model="form.address" type="text" />
        <span v-if="errors.address" class="error-message">{{ errors.address }}</span>
      </div>
      <div class="field" data-field="emergencyContactName">
        <label>緊急聯絡人姓名</label>
        <input v-model="form.emergencyContactName" type="text" />
        <span v-if="errors.emergencyContactName" class="error-message">{{ errors.emergencyContactName }}</span>
      </div>
      <div class="field" data-field="emergencyContactPhone">
        <label>緊急聯絡人電話</label>
        <input v-model="form.emergencyContactPhone" type="text" />
        <span v-if="errors.emergencyContactPhone" class="error-message">{{ errors.emergencyContactPhone }}</span>
      </div>
      <div class="field col-span-2" data-field="emergencyContactRelationship">
        <label>緊急聯絡人關係</label>
        <input v-model="form.emergencyContactRelationship" type="text" placeholder="例：父子 / 夫妻" />
        <span v-if="errors.emergencyContactRelationship" class="error-message">{{ errors.emergencyContactRelationship }}</span>
      </div>

      <fieldset class="col-span-2 hospital-set">
        <legend>指定獸醫院（選填）</legend>
        <div class="form-grid inner">
          <div class="field col-span-2" data-field="preferredAnimalHospital">
            <label>醫院名稱</label>
            <input v-model="form.preferredAnimalHospital" type="text" placeholder="留空則使用預設醫院「安欣動物醫院」" />
          </div>
          <div class="field" data-field="preferredAnimalHospitalPhone">
            <label>醫院電話</label>
            <input v-model="form.preferredAnimalHospitalPhone" type="text" />
          </div>
          <div class="field" data-field="preferredAnimalHospitalAddress">
            <label>醫院地址</label>
            <input v-model="form.preferredAnimalHospitalAddress" type="text" />
          </div>
        </div>
      </fieldset>

      <div class="field col-span-2 toggle-field">
        <label class="toggle-label">
          <input
            type="checkbox"
            data-field="isStoredValueCustomer"
            v-model="form.isStoredValueCustomer"
          />
          <span>設為儲值型客戶</span>
        </label>
      </div>
      <div class="field field-storedValueBalance col-span-2">
        <label>儲值餘額</label>
        <div class="input-with-prefix">
          <span class="prefix">NT$</span>
          <input data-field="storedValueBalance" v-model.number="form.storedValueBalance" type="number" />
        </div>
        <span v-if="errors.storedValueBalance" class="error-message">{{ errors.storedValueBalance }}</span>
      </div>

      <div class="field col-span-2" data-field="note">
        <label>備註</label>
        <textarea v-model="form.note" placeholder="選填"></textarea>
      </div>

      <div class="form-actions col-span-2">
        <button type="submit">💾 儲存</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as ownerApi from '@/api/owner.api.js'

const props = defineProps({
  ownerId: { type: String, default: null }
})

const emit = defineEmits(['saved'])

function initialForm() {
  return {
    name: '',
    nationalId: '',
    phone: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    preferredAnimalHospital: '',
    preferredAnimalHospitalPhone: '',
    preferredAnimalHospitalAddress: '',
    isStoredValueCustomer: false,
    storedValueBalance: 0,
    note: '',
  }
}

const form = reactive(initialForm())

const errors = reactive({})
const successMessage = ref('')
const errorMessage = ref('')

function validate() {
  const errs = {}
  const requiredFields = [
    ['name', '姓名'],
    ['nationalId', '身分證字號'],
    ['phone', '電話'],
    ['address', '地址'],
    ['emergencyContactName', '緊急聯絡人姓名'],
    ['emergencyContactPhone', '緊急聯絡人電話'],
    ['emergencyContactRelationship', '緊急聯絡人關係'],
  ]
  requiredFields.forEach(([key, label]) => {
    if (!form[key] || !form[key].trim()) {
      errs[key] = `${label}為必填欄位`
    }
  })
  if (form.storedValueBalance < 0) {
    errs.storedValueBalance = '儲值餘額不得小於 0'
  }
  Object.keys(errors).forEach(k => delete errors[k])
  Object.assign(errors, errs)
  return Object.keys(errs).length === 0
}

async function handleSubmit() {
  successMessage.value = ''
  errorMessage.value = ''
  if (!validate()) return
  try {
    let saved
    if (props.ownerId) {
      saved = await ownerApi.update(props.ownerId, { ...form })
    } else {
      saved = await ownerApi.create({ ...form })
    }
    successMessage.value = '儲存成功'
    emit('saved', saved)
  } catch (e) {
    errorMessage.value = e.message
  }
}

onMounted(async () => {
  if (props.ownerId) {
    try {
      const data = await ownerApi.getById(props.ownerId)
      Object.assign(form, { ...initialForm(), ...data })
    } catch (e) {
      errorMessage.value = e.message
    }
  }
})
</script>

<style scoped>
.owner-form h2 { display: flex; align-items: center; gap: 8px; }
.owner-form .icon { font-size: 22px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-4) var(--sp-5);
}
.form-grid.inner { margin-top: var(--sp-2); }
.col-span-2 { grid-column: span 2; }
.field { display: flex; flex-direction: column; }

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}
.input-with-prefix .prefix {
  position: absolute;
  left: 14px;
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: var(--fs-sm);
}
.input-with-prefix input { padding-left: 44px; }

.toggle-field { padding-top: var(--sp-1); }
.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-border);
  background-color: #fff;
  width: fit-content;
  font-weight: 500;
  color: var(--color-brown-700);
  margin: 0;
}
.toggle-label:has(input:checked) {
  background: linear-gradient(90deg, var(--color-pink-100), var(--color-pink-50));
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.toggle-label input { width: 16px; height: 16px; margin: 0; }

.hospital-set { background-color: rgba(255, 255, 255, 0.7); }

.form-actions { display: flex; justify-content: flex-end; margin-top: var(--sp-2); }

@media (max-width: 700px) {
  .form-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
}
</style>
