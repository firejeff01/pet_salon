<template>
  <div class="grooming-page">
    <router-link
      v-if="backDate"
      :to="{ name: 'daily-list', params: { date: backDate } }"
      class="back-link"
    >← 回當日列表</router-link>
    <div class="grid">
      <GroomingRecordForm :appointment-id="appointmentId" />
      <SignaturePad :has-contract="true" @confirm="onSignature" />
    </div>
    <p v-if="signMessage" class="success-message">{{ signMessage }}</p>
    <p v-if="signError" class="error-message api-error">{{ signError }}</p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import GroomingRecordForm from '@/components/GroomingRecordForm.vue'
import SignaturePad from '@/components/SignaturePad.vue'

const route = useRoute()
const appointmentId = computed(() => route.params.appointmentId)
const backDate = computed(() => route.query.date || null)
const signMessage = ref('')
const signError = ref('')

function onSignature(dataUrl) {
  signError.value = ''
  signMessage.value = `簽名已儲存（${Math.round(dataUrl.length / 1024)} KB）`
}
</script>

<style scoped>
.grooming-page { display: flex; flex-direction: column; gap: var(--sp-4); }
.back-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--color-brown-700);
  font-weight: 600;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background-color: rgba(255,255,255,.6);
  width: fit-content;
}
.back-link:hover { background-color: #fff; }
.grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--sp-5);
  align-items: flex-start;
}
@media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
</style>
