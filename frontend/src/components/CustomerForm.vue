<template>
  <div class="customer-form">
    <div class="customer-intro card">
      <h1>歡迎光臨 🐾</h1>
      <p class="subtitle">請協助填寫您與寶貝的資料，我們會好好照顧牠！</p>
    </div>
    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message api-error">{{ errorMessage }}</div>

    <form class="customer-sections" @submit.prevent="handleSubmit">
      <section class="owner-section card">
        <h3><span class="icon" aria-hidden="true">👤</span> 飼主資料</h3>
        <div class="form-grid">
          <div class="field" data-field="name">
            <label>姓名</label>
            <input v-model="owner.name" type="text" placeholder="例：王小明" />
            <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
          </div>
          <div class="field" data-field="nationalId">
            <label>身分證字號</label>
            <input v-model="owner.nationalId" type="text" placeholder="A123456789" />
            <span v-if="errors.nationalId" class="error-message">{{ errors.nationalId }}</span>
          </div>
          <div class="field" data-field="phone">
            <label>電話</label>
            <input v-model="owner.phone" type="text" placeholder="0912-345-678" />
            <span v-if="errors.phone" class="error-message">{{ errors.phone }}</span>
          </div>
          <div class="field col-span-2" data-field="address">
            <label>地址</label>
            <input v-model="owner.address" type="text" />
            <span v-if="errors.address" class="error-message">{{ errors.address }}</span>
          </div>
          <div class="field" data-field="emergencyContactName">
            <label>緊急聯絡人姓名</label>
            <input v-model="owner.emergencyContactName" type="text" />
            <span v-if="errors.emergencyContactName" class="error-message">{{ errors.emergencyContactName }}</span>
          </div>
          <div class="field" data-field="emergencyContactPhone">
            <label>緊急聯絡人電話</label>
            <input v-model="owner.emergencyContactPhone" type="text" />
            <span v-if="errors.emergencyContactPhone" class="error-message">{{ errors.emergencyContactPhone }}</span>
          </div>
          <div class="field col-span-2" data-field="emergencyContactRelationship">
            <label>緊急聯絡人關係</label>
            <input v-model="owner.emergencyContactRelationship" type="text" placeholder="例：父子 / 夫妻" />
            <span v-if="errors.emergencyContactRelationship" class="error-message">{{ errors.emergencyContactRelationship }}</span>
          </div>

          <fieldset class="col-span-2 hospital-set">
            <legend>指定獸醫院（選填）</legend>
            <div class="form-grid inner">
              <div class="field col-span-2" data-field="preferredAnimalHospital">
                <label>醫院名稱</label>
                <input v-model="owner.preferredAnimalHospital" type="text" placeholder="留空則使用預設醫院" />
              </div>
              <div class="field" data-field="preferredAnimalHospitalPhone">
                <label>醫院電話</label>
                <input v-model="owner.preferredAnimalHospitalPhone" type="text" />
              </div>
              <div class="field" data-field="preferredAnimalHospitalAddress">
                <label>醫院地址</label>
                <input v-model="owner.preferredAnimalHospitalAddress" type="text" />
              </div>
            </div>
          </fieldset>
        </div>
      </section>

      <section
        v-for="(pet, idx) in pets"
        :key="idx"
        :data-section="`pet-${idx}`"
        class="pet-section card"
      >
        <div class="pet-head">
          <h3><span class="icon" aria-hidden="true">🐾</span> 寵物 {{ idx + 1 }}</h3>
          <button
            v-if="pets.length > 1"
            type="button"
            class="ghost"
            :data-test="`remove-pet-${idx}`"
            @click="removePet(idx)"
          >✕ 移除</button>
        </div>
        <div class="form-grid">
          <div class="field col-span-2" data-field="petName">
            <label>寵物名稱</label>
            <input v-model="pet.name" type="text" placeholder="例：小白" />
            <span v-if="petErrors[idx]?.name" class="error-message">{{ petErrors[idx].name }}</span>
          </div>
          <div class="field" data-field="species">
            <label>物種</label>
            <select v-model="pet.species">
              <option value="">請選擇</option>
              <option value="犬">🐶 犬</option>
              <option value="貓">🐱 貓</option>
            </select>
            <span v-if="petErrors[idx]?.species" class="error-message">{{ petErrors[idx].species }}</span>
          </div>
          <div class="field" data-field="breed">
            <label>品種</label>
            <input v-model="pet.breed" type="text" placeholder="例：柴犬" />
            <span v-if="petErrors[idx]?.breed" class="error-message">{{ petErrors[idx].breed }}</span>
          </div>
          <div class="field" data-field="age">
            <label>年齡</label>
            <input v-model="pet.age" type="text" placeholder="例：3歲" />
            <span v-if="petErrors[idx]?.age" class="error-message">{{ petErrors[idx].age }}</span>
          </div>
          <div class="field" data-field="gender">
            <label>性別</label>
            <select v-model="pet.gender">
              <option value="">請選擇</option>
              <option value="公">♂ 公</option>
              <option value="母">♀ 母</option>
            </select>
            <span v-if="petErrors[idx]?.gender" class="error-message">{{ petErrors[idx].gender }}</span>
          </div>
          <div class="field" data-field="neutered">
            <label>是否結紮</label>
            <select v-model="pet.isNeutered">
              <option :value="null">請選擇</option>
              <option :value="true">是</option>
              <option :value="false">否</option>
            </select>
          </div>
          <div class="field" data-field="chipNumber">
            <label>晶片號碼</label>
            <input v-model="pet.chipNumber" type="text" placeholder="無則留空" />
          </div>
          <div class="field" data-field="unregisteredIdMethod">
            <label>若無晶片之識別方式</label>
            <input v-model="pet.unregisteredIdMethod" type="text" placeholder="例：項圈牌" />
          </div>

          <fieldset class="col-span-2 chip-set" :data-section="`pet-${idx}-personality`">
            <legend>個性（至少選一項）</legend>
            <label v-for="p in personalityOptions" :key="p" class="chip">
              <input type="checkbox" :value="p" v-model="pet.personality" />
              <span>{{ p }}</span>
            </label>
            <span v-if="petErrors[idx]?.personality" class="error-message" style="flex-basis:100%">{{ petErrors[idx].personality }}</span>
          </fieldset>

          <fieldset class="col-span-2 physical-set">
            <legend>身體檢查</legend>
            <div class="physical-grid">
              <div class="field">
                <label>眼睛</label>
                <select v-model="pet.physicalExamination.eyes">
                  <option value="正常">正常</option>
                  <option value="異常">異常</option>
                </select>
              </div>
              <div class="field">
                <label>耳朵</label>
                <select v-model="pet.physicalExamination.ears">
                  <option value="正常">正常</option>
                  <option value="異常">異常</option>
                </select>
              </div>
              <div class="field">
                <label>牙齒</label>
                <select v-model="pet.physicalExamination.teeth">
                  <option value="正常">正常</option>
                  <option value="異常">異常</option>
                </select>
              </div>
              <div class="field">
                <label>四肢</label>
                <select v-model="pet.physicalExamination.limbs">
                  <option value="正常">正常</option>
                  <option value="異常">異常</option>
                </select>
              </div>
              <div class="field">
                <label>皮膚</label>
                <select v-model="pet.physicalExamination.skin">
                  <option value="正常">正常</option>
                  <option value="異常">異常</option>
                </select>
              </div>
              <div class="field">
                <label>皮毛</label>
                <select v-model="pet.physicalExamination.fur">
                  <option value="正常">正常</option>
                  <option value="打結">打結</option>
                  <option value="跳蚤壁蝨">跳蚤壁蝨</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset class="col-span-2 chip-set" :data-section="`pet-${idx}-medical`">
            <legend>病史</legend>
            <label v-for="m in medicalOptions" :key="m" class="chip">
              <input type="checkbox" :value="m" v-model="pet.medicalHistory" />
              <span>{{ m }}</span>
            </label>
            <div v-if="pet.medicalHistory.includes('其它')" class="field col-span-2 other-field">
              <label>其它說明</label>
              <input v-model="pet.medicalHistoryOther" type="text" />
            </div>
          </fieldset>
        </div>
      </section>

      <div class="actions card actions-bar">
        <button type="button" class="secondary" data-test="add-pet-button" @click="addPet">➕ 新增寵物</button>
        <div class="spacer"></div>
        <button type="button" class="ghost" data-test="back-button" @click="goBack">返回店家操作</button>
        <button type="submit" data-test="submit-button">送出資料</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import * as ownerApi from '@/api/owner.api.js'
import * as petApi from '@/api/pet.api.js'

const router = useRouter()

const owner = reactive({
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
})

const personalityOptions = ['親人', '不會咬人', '不會咬狗貓', '容易緊張', '親狗', '會咬人', '會咬狗貓', '有攻擊性']
const medicalOptions = [
  '心臟病', '氣喘', '氣管塌陷', '白內障', '癲癇', '心絲蟲',
  '艾利希體', '腹膜炎', '腹積水', '手術外傷未癒合', '髖關節問題',
  '骨折', '腸炎', '血便', '血尿', '懷孕', '傳染性疾病', '其它',
]

function createBlankPet() {
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
  }
}

const pets = reactive([createBlankPet()])
const errors = reactive({})
const petErrors = reactive([])
const successMessage = ref('')
const errorMessage = ref('')

function addPet() {
  pets.push(createBlankPet())
}

function removePet(idx) {
  if (pets.length > 1) pets.splice(idx, 1)
}

function validate() {
  Object.keys(errors).forEach((k) => delete errors[k])
  petErrors.length = 0

  const required = [
    ['name', '姓名'],
    ['nationalId', '身分證字號'],
    ['phone', '電話'],
    ['address', '地址'],
    ['emergencyContactName', '緊急聯絡人姓名'],
    ['emergencyContactPhone', '緊急聯絡人電話'],
    ['emergencyContactRelationship', '緊急聯絡人關係'],
  ]
  required.forEach(([key, label]) => {
    if (!owner[key] || !owner[key].trim()) {
      errors[key] = `${label}為必填欄位`
    }
  })

  let petsValid = true
  pets.forEach((pet) => {
    const pe = {}
    if (!pet.name || !pet.name.trim()) pe.name = '寵物名稱為必填'
    if (!pet.species) pe.species = '物種為必填'
    if (!pet.breed || !pet.breed.trim()) pe.breed = '品種為必填'
    if (!pet.gender) pe.gender = '性別為必填'
    if (!pet.age || !String(pet.age).trim()) pe.age = '年齡為必填'
    if (!pet.personality || pet.personality.length === 0) pe.personality = '請至少選一項個性'
    petErrors.push(pe)
    if (Object.keys(pe).length) petsValid = false
  })

  return Object.keys(errors).length === 0 && petsValid
}

async function handleSubmit() {
  successMessage.value = ''
  errorMessage.value = ''
  if (!validate()) return
  try {
    const savedOwner = await ownerApi.create({ ...owner })
    for (const pet of pets) {
      const payload = { ...pet, ownerId: savedOwner.id }
      if (payload.isNeutered === null) payload.isNeutered = false
      await petApi.create(payload)
    }
    successMessage.value = '資料已送出，感謝您的填寫'
  } catch (e) {
    errorMessage.value = e.message
  }
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.customer-form { display: flex; flex-direction: column; gap: var(--sp-5); }

.customer-intro {
  background: linear-gradient(120deg, #FFF5F8, #FFE0EC 70%, #FFD2C2);
  text-align: center;
}
.customer-intro h1 { font-size: var(--fs-3xl); margin-bottom: 4px; }
.customer-intro .subtitle { color: var(--color-text-muted); margin: 0; }

.customer-sections { display: flex; flex-direction: column; gap: var(--sp-4); }

.owner-section h3, .pet-section h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.pet-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--sp-3);
  border-bottom: 1px dashed var(--color-border);
  margin-bottom: var(--sp-4);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--sp-4) var(--sp-5);
}
.form-grid.inner { margin-top: var(--sp-2); }
.col-span-2 { grid-column: span 2; }
.field { display: flex; flex-direction: column; }

.hospital-set { background-color: rgba(255, 255, 255, 0.7); }

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

.actions-bar {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  position: sticky;
  bottom: var(--sp-4);
  flex-wrap: wrap;
}

@media (max-width: 700px) {
  .form-grid { grid-template-columns: 1fr; }
  .col-span-2 { grid-column: span 1; }
  .physical-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
