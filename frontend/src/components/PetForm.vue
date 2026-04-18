<template>
  <div class="pet-form card">
    <h2>
      <span class="icon" aria-hidden="true">🐕</span>
      {{ petId ? '編輯寵物' : '新增寵物' }}
    </h2>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message api-error">{{ errorMessage }}</div>
    <form class="form-grid" @submit.prevent="handleSubmit">
      <div class="field" data-field="name">
        <label>寵物名稱</label>
        <input v-model="form.name" type="text" placeholder="例：小白" />
        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
      </div>
      <div class="field" data-field="species">
        <label>物種</label>
        <select v-model="form.species">
          <option value="">請選擇</option>
          <option value="犬">🐶 犬</option>
          <option value="貓">🐱 貓</option>
        </select>
        <span v-if="errors.species" class="error-message">{{ errors.species }}</span>
      </div>
      <div class="field" data-field="breed">
        <label>品種</label>
        <input v-model="form.breed" type="text" placeholder="例：柴犬" />
        <span v-if="errors.breed" class="error-message">{{ errors.breed }}</span>
      </div>
      <div class="field" data-field="age">
        <label>年齡</label>
        <input v-model="form.age" type="text" placeholder="例：3歲" />
        <span v-if="errors.age" class="error-message">{{ errors.age }}</span>
      </div>
      <div class="field" data-field="gender">
        <label>性別</label>
        <select v-model="form.gender">
          <option value="">請選擇</option>
          <option value="公">♂ 公</option>
          <option value="母">♀ 母</option>
        </select>
        <span v-if="errors.gender" class="error-message">{{ errors.gender }}</span>
      </div>
      <div class="field" data-field="neutered">
        <label>是否結紮</label>
        <select v-model="form.isNeutered">
          <option :value="null">請選擇</option>
          <option :value="true">是</option>
          <option :value="false">否</option>
        </select>
      </div>
      <div class="field" data-field="chipNumber">
        <label>晶片號碼</label>
        <input v-model="form.chipNumber" type="text" placeholder="15 位數，無則留空" />
      </div>
      <div class="field" data-field="unregisteredIdMethod">
        <label>若無晶片之識別方式</label>
        <input v-model="form.unregisteredIdMethod" type="text" placeholder="例：項圈牌、花色特徵" />
      </div>

      <fieldset class="col-span-2 chip-set" data-section="personality">
        <legend>個性</legend>
        <label v-for="p in personalityOptions" :key="p" class="chip">
          <input type="checkbox" :value="p" v-model="form.personality" />
          <span>{{ p }}</span>
        </label>
      </fieldset>

      <fieldset class="col-span-2 physical-set" data-section="physical">
        <legend>身體檢查</legend>
        <div class="physical-grid">
          <div class="field" data-field="physical.eyes">
            <label>眼睛</label>
            <select v-model="form.physicalExamination.eyes">
              <option value="正常">正常</option>
              <option value="異常">異常</option>
            </select>
          </div>
          <div class="field" data-field="physical.ears">
            <label>耳朵</label>
            <select v-model="form.physicalExamination.ears">
              <option value="正常">正常</option>
              <option value="異常">異常</option>
            </select>
          </div>
          <div class="field" data-field="physical.teeth">
            <label>牙齒</label>
            <select v-model="form.physicalExamination.teeth">
              <option value="正常">正常</option>
              <option value="異常">異常</option>
            </select>
          </div>
          <div class="field" data-field="physical.limbs">
            <label>四肢</label>
            <select v-model="form.physicalExamination.limbs">
              <option value="正常">正常</option>
              <option value="異常">異常</option>
            </select>
          </div>
          <div class="field" data-field="physical.skin">
            <label>皮膚</label>
            <select v-model="form.physicalExamination.skin">
              <option value="正常">正常</option>
              <option value="異常">異常</option>
            </select>
          </div>
          <div class="field" data-field="physical.fur">
            <label>皮毛</label>
            <select v-model="form.physicalExamination.fur">
              <option value="正常">正常</option>
              <option value="打結">打結</option>
              <option value="跳蚤壁蝨">跳蚤壁蝨</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset class="col-span-2 chip-set" data-section="medicalHistory">
        <legend>病史</legend>
        <label v-for="m in medicalOptions" :key="m" class="chip">
          <input
            type="checkbox"
            :value="m"
            v-model="form.medicalHistory"
            :data-test="m === '其它' ? 'medical-other-checkbox' : undefined"
          />
          <span>{{ m }}</span>
        </label>
        <div v-if="form.medicalHistory.includes('其它')" class="field col-span-2 other-field" data-field="medicalHistoryOther">
          <label>其它說明</label>
          <input v-model="form.medicalHistoryOther" type="text" />
        </div>
      </fieldset>

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
import { reactive, ref, onMounted } from 'vue'
import * as petApi from '@/api/pet.api.js'

const props = defineProps({
  ownerId: { type: String, required: true },
  petId: { type: String, default: null },
})

const emit = defineEmits(['saved'])

const personalityOptions = ['親人', '不會咬人', '不會咬狗貓', '容易緊張', '親狗', '會咬人', '會咬狗貓', '有攻擊性']
const medicalOptions = [
  '心臟病', '氣喘', '氣管塌陷', '白內障', '癲癇', '心絲蟲',
  '艾利希體', '腹膜炎', '腹積水', '手術外傷未癒合', '髖關節問題',
  '骨折', '腸炎', '血便', '血尿', '懷孕', '傳染性疾病', '其它',
]

function initialForm() {
  return {
    name: '',
    species: '',
    breed: '',
    gender: '',
    age: '',
    isNeutered: null,
    chipNumber: '',
    unregisteredIdMethod: '',
    personality: [],
    physicalExamination: {
      eyes: '正常', ears: '正常', teeth: '正常',
      limbs: '正常', skin: '正常', fur: '正常',
    },
    medicalHistory: [],
    medicalHistoryOther: '',
    note: '',
  }
}

const form = reactive(initialForm())
const errors = reactive({})
const successMessage = ref('')
const errorMessage = ref('')

function validate() {
  const errs = {}
  if (!form.name || !form.name.trim()) errs.name = '寵物名稱為必填'
  if (!form.species) errs.species = '物種為必填'
  if (!form.breed || !form.breed.trim()) errs.breed = '品種為必填'
  if (!form.gender) errs.gender = '性別為必填'
  if (!form.age || !String(form.age).trim()) errs.age = '年齡為必填'
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
    if (payload.isNeutered === null) payload.isNeutered = false
    if (props.petId) {
      await petApi.update(props.petId, payload)
    } else {
      await petApi.create(payload)
    }
    successMessage.value = '寵物資料已儲存'
    emit('saved')
  } catch (e) {
    errorMessage.value = e.message
  }
}

onMounted(async () => {
  if (props.petId) {
    try {
      const data = await petApi.getById(props.petId)
      Object.assign(form, { ...initialForm(), ...data })
    } catch (e) {
      errorMessage.value = e.message
    }
  }
})
</script>

<style scoped>
.pet-form h2 { display: flex; align-items: center; gap: 8px; }
.pet-form .icon { font-size: 22px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-4) var(--sp-5);
}
.col-span-2 { grid-column: span 2; }
.field { display: flex; flex-direction: column; }

.physical-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--sp-3);
}

.chip-set { display: flex; flex-wrap: wrap; gap: 8px; align-content: flex-start; }
.chip-set legend { flex-basis: 100%; margin-bottom: 4px; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1.5px solid var(--color-border);
  background-color: #fff;
  cursor: pointer;
  font-size: var(--fs-sm);
  font-weight: 500;
  color: var(--color-brown-700);
  transition: all var(--transition);
  margin: 0;
}
.chip input { width: 14px; height: 14px; margin: 0; }
.chip:hover { border-color: var(--color-primary); color: var(--color-primary); }
.chip:has(input:checked) {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

.other-field { flex-basis: 100%; margin-top: 4px; }

.form-actions { display: flex; justify-content: flex-end; margin-top: var(--sp-2); }

@media (max-width: 700px) {
  .form-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .physical-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
