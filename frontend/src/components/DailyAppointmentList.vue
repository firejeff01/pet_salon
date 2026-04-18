<template>
  <div class="daily-appointment-list card">
    <h2>📅 {{ date }} 預約列表</h2>
    <div v-if="sortedAppointments.length === 0" class="empty">
      <span class="empty-icon">🐾</span>
      <p>本日無預約</p>
    </div>
    <div v-else class="list">
      <div
        v-for="appt in sortedAppointments"
        :key="appt.id"
        data-test="appointment-row"
        class="appointment-row"
        :class="{ cancelled: appt.status === '已取消' }"
        @click="goToGrooming(appt)"
      >
        <span class="time">{{ appt.time }}</span>
        <div class="info">
          <span class="pet-name">🐾 {{ appt.petName }}</span>
          <span class="owner-meta">{{ appt.ownerName }} · {{ appt.ownerPhone }}</span>
          <span v-if="appt.cancelReason" class="cancel-reason">取消原因：{{ appt.cancelReason }}</span>
        </div>
        <div class="tags">
          <span class="status-tag" :class="statusClass(appt.status)">{{ appt.status }}</span>
          <span v-if="appt.hasContract" class="contract-tag">已簽約</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import * as appointmentApi from '@/api/appointment.api.js'

const props = defineProps({
  date: { type: String, required: true }
})

const router = useRouter()
const appointments = ref([])

const sortedAppointments = computed(() => {
  return [...appointments.value].sort((a, b) => a.time.localeCompare(b.time))
})

function statusClass(status) {
  if (status === '已取消') return 'cancelled'
  if (status === '已完成') return 'done'
  return 'scheduled'
}

function goToGrooming(appt) {
  router.push({ name: 'grooming', params: { appointmentId: appt.id } })
}

onMounted(async () => {
  try {
    appointments.value = await appointmentApi.getByDate(props.date)
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.empty {
  text-align: center;
  padding: var(--sp-8);
  color: var(--color-text-muted);
}
.empty-icon { font-size: 48px; display: block; margin-bottom: var(--sp-3); }

.list { display: flex; flex-direction: column; gap: 10px; }

.appointment-row {
  display: grid;
  grid-template-columns: 90px 1fr auto;
  gap: var(--sp-3);
  align-items: center;
  padding: 14px 18px;
  border: 1.5px solid var(--color-border);
  border-left: 4px solid var(--color-primary);
  border-radius: var(--radius-md);
  background-color: #fff;
  cursor: pointer;
  transition: all var(--transition);
}
.appointment-row:hover {
  transform: translateX(3px);
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary);
  border-left-color: var(--color-primary);
}
.appointment-row.cancelled {
  border-left-color: var(--color-brown-300);
  opacity: 0.7;
  background-color: #fafafa;
}

.time {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--fs-xl);
  color: var(--color-primary);
}
.appointment-row.cancelled .time { color: var(--color-text-muted); text-decoration: line-through; }

.info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pet-name { font-weight: 600; color: var(--color-brown-700); }
.owner-meta { font-size: var(--fs-sm); color: var(--color-text-muted); }
.cancel-reason { font-size: var(--fs-xs); color: var(--color-danger); margin-top: 2px; }

.tags { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.status-tag, .contract-tag {
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  font-size: var(--fs-xs);
  font-weight: 700;
  white-space: nowrap;
}
.status-tag.scheduled { background-color: var(--color-info-bg); color: var(--color-info); }
.status-tag.done      { background-color: var(--color-success-bg); color: var(--color-success); }
.status-tag.cancelled { background-color: var(--color-bg); color: var(--color-text-muted); }
.contract-tag { background-color: var(--color-success-bg); color: var(--color-success); }
</style>
