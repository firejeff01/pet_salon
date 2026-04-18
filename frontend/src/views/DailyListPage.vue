<template>
  <div class="daily-list-page">
    <router-link :to="{ name: 'calendar' }" class="back-link">← 回日曆</router-link>
    <DailyAppointmentList :date="date" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DailyAppointmentList from '@/components/DailyAppointmentList.vue'

const route = useRoute()
const date = computed(() => route.params.date)
</script>

<style scoped>
.daily-list-page { display: flex; flex-direction: column; gap: var(--sp-4); }
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
</style>
