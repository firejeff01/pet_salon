<template>
  <div class="grooming-record-form card">
    <h2><span class="icon" aria-hidden="true">✂️</span> 美容紀錄</h2>

    <div v-if="appointment" class="appointment-info">
      <div class="info-item">
        <span class="label">🐾 寵物</span>
        <span class="value">{{ appointment.petName }}</span>
      </div>
      <div class="info-item">
        <span class="label">👤 飼主</span>
        <span class="value">{{ appointment.ownerName }}</span>
      </div>
      <div class="info-item" v-if="appointment.ownerPhone">
        <span class="label">📞 電話</span>
        <span class="value">{{ appointment.ownerPhone }}</span>
      </div>
    </div>

    <fieldset class="services">
      <legend>服務項目</legend>
      <div class="service-grid">
        <div v-for="svc in SERVICES" :key="svc" class="service-row" :class="{ active: selectedServices.includes(svc) }">
          <label class="service-label">
            <input
              type="checkbox"
              :data-test="`service-${svc}`"
              :value="svc"
              v-model="selectedServices"
            />
            <span class="service-name">{{ serviceEmoji(svc) }} {{ svc }}</span>
          </label>
          <div class="price-input-wrap" v-if="selectedServices.includes(svc)">
            <span class="prefix">NT$</span>
            <input
              type="number"
              :data-test="`price-${svc}`"
              v-model.number="prices[svc]"
              placeholder="金額"
            />
          </div>
        </div>
      </div>
    </fieldset>

    <div
      v-if="isStoredValueCustomer"
      data-test="stored-value-section"
      class="stored-value-section"
    >
      <h3>💰 儲值扣款計算</h3>
      <div class="calc-grid">
        <div class="calc-cell">
          <span class="calc-label">目前餘額</span>
          <span class="calc-value" data-test="balance">NT$ {{ balance }}</span>
        </div>
        <div class="calc-cell">
          <span class="calc-label">總金額</span>
          <span class="calc-value" data-test="total">NT$ {{ totalCost }}</span>
        </div>
        <div class="calc-cell highlight">
          <span class="calc-label">儲值扣款</span>
          <span class="calc-value" data-test="deduction">-NT$ {{ deduction }}</span>
        </div>
        <div class="calc-cell">
          <span class="calc-label">現金</span>
          <span class="calc-value" data-test="cash">NT$ {{ cash }}</span>
        </div>
        <div class="calc-cell remaining">
          <span class="calc-label">扣款後餘額</span>
          <span class="calc-value" data-test="remaining">NT$ {{ remaining }}</span>
        </div>
      </div>
    </div>

    <div class="actions">
      <button type="button" class="secondary" data-test="save-button" @click="save">💾 儲存紀錄</button>
      <button
        type="button"
        data-test="generate-contract-button"
        :disabled="!savedRecordId || isGenerating"
        @click="generateContract"
      >
        <span v-if="isGenerating" class="spinner" aria-hidden="true"></span>
        {{ isGenerating ? '契約產生中…' : '📄 產生定型化契約' }}
      </button>
    </div>

    <div v-if="isGenerating" class="loading-overlay" data-test="contract-loading">
      <div class="loading-card">
        <div class="spinner spinner-lg"></div>
        <p>正在產生契約 PDF，請稍候…</p>
        <p class="loading-hint">首次產生可能需要 3~5 秒</p>
      </div>
    </div>

    <div v-if="versions.length" data-test="version-list" class="version-list">
      <h3>📚 契約版本</h3>
      <ul>
        <li v-for="v in versions" :key="v.id || v.version">
          <span class="version-badge">v{{ v.version }}</span>
          <span class="version-time">{{ v.createdAt || v.generatedAt }}</span>
        </li>
      </ul>
    </div>

    <p v-if="errorMessage" class="error-message api-error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import * as appointmentApi from '@/api/appointment.api.js'
import * as groomingApi from '@/api/grooming.api.js'
import * as contractApi from '@/api/contract.api.js'

const SERVICES = ['洗澡', '美容', '其他']

function serviceEmoji(s) {
  if (s === '洗澡') return '🛁'
  if (s === '美容') return '✂️'
  return '✨'
}

const props = defineProps({
  appointmentId: { type: String, required: true },
})

const appointment = ref(null)
const selectedServices = ref([])
const prices = reactive({ 洗澡: 0, 美容: 0, 其他: 0 })
const savedRecordId = ref(null)
const versions = ref([])
const errorMessage = ref('')
const successMessage = ref('')
const isGenerating = ref(false)

const isStoredValueCustomer = computed(
  () => appointment.value?.owner?.isStoredValueCustomer === true
)

const balance = computed(() => appointment.value?.owner?.storedValueBalance || 0)

const totalCost = computed(() =>
  selectedServices.value.reduce((sum, svc) => sum + (Number(prices[svc]) || 0), 0)
)

const deduction = computed(() =>
  isStoredValueCustomer.value ? Math.min(balance.value, totalCost.value) : 0
)
const cash = computed(() =>
  isStoredValueCustomer.value ? Math.max(0, totalCost.value - balance.value) : totalCost.value
)
const remaining = computed(() =>
  isStoredValueCustomer.value ? Math.max(0, balance.value - totalCost.value) : balance.value
)

onMounted(async () => {
  try {
    appointment.value = await appointmentApi.getById(props.appointmentId)
  } catch (e) {
    errorMessage.value = e.message
  }
})

async function save() {
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const services = selectedServices.value.map((s) => ({
      type: s,
      price: Number(prices[s]) || 0,
    }))
    const payload = {
      appointmentId: props.appointmentId,
      services,
      totalCost: totalCost.value,
      storedValueDeduction: deduction.value,
      cashPayment: cash.value,
    }
    const saved = await groomingApi.create(payload)
    savedRecordId.value = saved.id
    successMessage.value = '美容紀錄已儲存'
  } catch (e) {
    errorMessage.value = e.message
  }
}

async function generateContract() {
  if (!savedRecordId.value || isGenerating.value) return
  errorMessage.value = ''
  successMessage.value = ''
  isGenerating.value = true
  try {
    await contractApi.generate(savedRecordId.value)
    versions.value = await contractApi.getVersions(savedRecordId.value)
    successMessage.value = '契約已產生'
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    isGenerating.value = false
  }
}
</script>

<style scoped>
.grooming-record-form h2 { display: flex; align-items: center; gap: 8px; }
.grooming-record-form .icon { font-size: 22px; }

.spinner {
  display: inline-block;
  width: 14px; height: 14px;
  margin-right: 6px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  vertical-align: -2px;
}
.spinner-lg {
  width: 44px; height: 44px;
  border-width: 4px;
  border-color: var(--color-pink-200, #fce7f3);
  border-top-color: var(--color-primary, #ec4899);
}
@keyframes spin { to { transform: rotate(360deg); } }

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.loading-card {
  background: #fff;
  border-radius: var(--radius-lg, 12px);
  padding: 32px 48px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  min-width: 280px;
}
.loading-card .spinner-lg { margin: 0 auto 16px; display: block; }
.loading-card p { margin: 4px 0; color: var(--color-brown-700, #6b4e3a); font-weight: 600; }
.loading-hint { font-size: var(--fs-sm, 13px); font-weight: normal !important; color: var(--color-text-muted, #999) !important; }

.appointment-info {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-4);
  padding: var(--sp-4);
  background: linear-gradient(120deg, var(--color-pink-50), #fff);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: var(--sp-5);
}
.info-item { display: flex; flex-direction: column; }
.info-item .label { font-size: var(--fs-xs); color: var(--color-text-muted); }
.info-item .value { font-weight: 700; color: var(--color-brown-700); font-size: var(--fs-lg); }

.service-grid { display: flex; flex-direction: column; gap: var(--sp-2); }
.service-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 10px 16px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: #fff;
  transition: all var(--transition);
}
.service-row.active {
  border-color: var(--color-primary);
  background: linear-gradient(90deg, var(--color-pink-50), #fff);
}
.service-label { display: flex; align-items: center; gap: 10px; font-size: var(--fs-md); font-weight: 600; color: var(--color-brown-700); flex: 1; cursor: pointer; margin: 0; }
.service-label input { width: 18px; height: 18px; }

.price-input-wrap { position: relative; display: flex; align-items: center; }
.price-input-wrap .prefix { position: absolute; left: 12px; color: var(--color-text-muted); font-size: var(--fs-sm); font-weight: 600; }
.price-input-wrap input { padding-left: 40px; width: 160px; }

.stored-value-section {
  margin: var(--sp-5) 0;
  padding: var(--sp-5);
  background: linear-gradient(135deg, #FFF5F8, #FFE4EC);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-pink-200);
}
.stored-value-section h3 { margin-bottom: var(--sp-3); }

.calc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--sp-3);
}
.calc-cell {
  padding: var(--sp-3);
  background-color: #fff;
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  gap: 4px;
  border: 1px solid var(--color-border);
}
.calc-cell.highlight { background: linear-gradient(135deg, #FFEFD6, #FFDBB8); border-color: var(--color-accent); }
.calc-cell.remaining { background: linear-gradient(135deg, var(--color-pink-100), var(--color-pink-50)); border-color: var(--color-pink-300); }
.calc-label { font-size: var(--fs-xs); color: var(--color-text-muted); font-weight: 600; }
.calc-value { font-family: var(--font-display); font-weight: 700; font-size: var(--fs-lg); color: var(--color-brown-700); }

.actions { display: flex; gap: var(--sp-3); margin-top: var(--sp-5); flex-wrap: wrap; }

.version-list { margin-top: var(--sp-5); }
.version-list ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
.version-list li {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 10px 14px;
  background-color: var(--color-pink-50);
  border-radius: var(--radius-md);
}
.version-badge {
  background-color: var(--color-primary);
  color: #fff;
  padding: 2px 10px;
  border-radius: var(--radius-pill);
  font-size: var(--fs-xs);
  font-weight: 700;
}
.version-time { color: var(--color-text-muted); font-size: var(--fs-sm); }
</style>
