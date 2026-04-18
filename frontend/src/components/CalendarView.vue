<template>
  <div class="calendar-view card">
    <div class="calendar-toolbar">
      <div class="nav-group">
        <button class="secondary nav-btn" data-test="nav-prev" @click="navigatePrev">‹</button>
        <span class="calendar-title">{{ displayTitle }}</span>
        <button class="secondary nav-btn" data-test="nav-next" @click="navigateNext">›</button>
      </div>
      <div class="view-switcher">
        <button
          class="view-btn"
          :class="{ active: currentView === 'month' }"
          data-test="view-month"
          @click="currentView = 'month'"
        >月</button>
        <button
          class="view-btn"
          :class="{ active: currentView === 'week' }"
          data-test="view-week"
          @click="currentView = 'week'"
        >週</button>
        <button
          class="view-btn"
          :class="{ active: currentView === 'day' }"
          data-test="view-day"
          @click="currentView = 'day'"
        >日</button>
      </div>
    </div>

    <div v-if="currentView === 'month'" data-test="month-view" class="month-view">
      <div class="weekday-header">
        <span v-for="d in weekdays" :key="d">{{ d }}</span>
      </div>
      <div class="calendar-grid">
        <div
          v-for="day in calendarDays"
          :key="day.dateStr"
          :data-date="day.dateStr"
          class="calendar-day"
          :class="{ 'other-month': !day.currentMonth, 'has-appt': day.count > 0 }"
          @click="goToDate(day.dateStr)"
        >
          <span class="day-number">{{ day.day }}</span>
          <span v-if="day.count > 0" class="appointment-count">{{ day.count }}</span>
        </div>
      </div>
    </div>

    <div v-if="currentView === 'week'" data-test="week-view" class="week-view">
      <div
        v-for="day in weekDays"
        :key="day.dateStr"
        :data-date="day.dateStr"
        class="week-day"
        :class="{ 'has-appt': day.count > 0 }"
        @click="goToDate(day.dateStr)"
      >
        <span class="date">{{ day.dateStr }}</span>
        <span class="count-badge" v-if="day.count">{{ day.count }} 個預約</span>
        <span class="count-badge empty" v-else>無預約</span>
      </div>
    </div>

    <div v-if="currentView === 'day'" data-test="day-view" class="day-view">
      <div
        class="day-card"
        :class="{ 'has-appt': dayAppointmentCount > 0 }"
        :data-date="currentDateStr"
        @click="goToDate(currentDateStr)"
      >
        <span class="date">{{ currentDateStr }}</span>
        <span class="count-badge" v-if="dayAppointmentCount">{{ dayAppointmentCount }} 個預約</span>
        <span class="count-badge empty" v-else>無預約</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as appointmentApi from '@/api/appointment.api.js'

const props = defineProps({
  initialYear: { type: Number, default: () => new Date().getFullYear() },
  initialMonth: { type: Number, default: () => new Date().getMonth() + 1 },
})

const router = useRouter()
const currentView = ref('month')
const year = ref(props.initialYear)
const month = ref(props.initialMonth)
const currentDay = ref(new Date().getDate())
const appointments = ref([])
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const displayTitle = computed(() => {
  if (currentView.value === 'month') return `${year.value} 年 ${month.value} 月`
  if (currentView.value === 'week') return `${year.value} 年 ${month.value} 月`
  return `${year.value} 年 ${month.value} 月 ${currentDay.value} 日`
})

const currentDateStr = computed(() => {
  const m = String(month.value).padStart(2, '0')
  const d = String(currentDay.value).padStart(2, '0')
  return `${year.value}-${m}-${d}`
})

function getAppointmentCountByDate(dateStr) {
  return appointments.value.filter(a => a.date === dateStr).length
}

const calendarDays = computed(() => {
  const days = []
  const firstDay = new Date(year.value, month.value - 1, 1)
  const lastDay = new Date(year.value, month.value, 0)
  const startDow = firstDay.getDay()

  // Previous month days
  for (let i = startDow - 1; i >= 0; i--) {
    const d = new Date(year.value, month.value - 1, -i)
    const dateStr = formatDate(d)
    days.push({ day: d.getDate(), dateStr, currentMonth: false, count: getAppointmentCountByDate(dateStr) })
  }

  // Current month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    const d = new Date(year.value, month.value - 1, i)
    const dateStr = formatDate(d)
    days.push({ day: i, dateStr, currentMonth: true, count: getAppointmentCountByDate(dateStr) })
  }

  // Fill remaining
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year.value, month.value, i)
    const dateStr = formatDate(d)
    days.push({ day: i, dateStr, currentMonth: false, count: getAppointmentCountByDate(dateStr) })
  }

  return days
})

const weekDays = computed(() => {
  const days = []
  const curr = new Date(year.value, month.value - 1, currentDay.value)
  const dow = curr.getDay()
  const start = new Date(curr)
  start.setDate(start.getDate() - dow)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    const dateStr = formatDate(d)
    days.push({ dateStr, count: getAppointmentCountByDate(dateStr) })
  }
  return days
})

const dayAppointmentCount = computed(() => getAppointmentCountByDate(currentDateStr.value))

function formatDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function navigatePrev() {
  if (currentView.value === 'month') {
    month.value--
    if (month.value < 1) { month.value = 12; year.value-- }
  } else if (currentView.value === 'week') {
    currentDay.value -= 7
    normalizeDate()
  } else {
    currentDay.value--
    normalizeDate()
  }
  fetchAppointments()
}

function navigateNext() {
  if (currentView.value === 'month') {
    month.value++
    if (month.value > 12) { month.value = 1; year.value++ }
  } else if (currentView.value === 'week') {
    currentDay.value += 7
    normalizeDate()
  } else {
    currentDay.value++
    normalizeDate()
  }
  fetchAppointments()
}

function normalizeDate() {
  const d = new Date(year.value, month.value - 1, currentDay.value)
  year.value = d.getFullYear()
  month.value = d.getMonth() + 1
  currentDay.value = d.getDate()
}

function goToDate(dateStr) {
  router.push({ name: 'daily-list', params: { date: dateStr } })
}

async function fetchAppointments() {
  try {
    appointments.value = await appointmentApi.getByMonth(year.value, month.value)
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetchAppointments)
watch([year, month], fetchAppointments)
</script>

<style scoped>
.calendar-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--sp-5);
  gap: var(--sp-4);
  flex-wrap: wrap;
}

.nav-group { display: flex; align-items: center; gap: var(--sp-3); }
.nav-btn { min-width: 36px; padding: 6px 14px; font-size: 20px; line-height: 1; }
.calendar-title {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--fs-xl);
  color: var(--color-brown-700);
  min-width: 180px;
  text-align: center;
}

.view-switcher {
  display: inline-flex;
  background-color: var(--color-pink-50);
  border-radius: var(--radius-pill);
  padding: 4px;
  gap: 2px;
}
.view-btn {
  background: transparent;
  color: var(--color-brown-500);
  padding: 6px 18px;
  border-radius: var(--radius-pill);
  box-shadow: none;
  font-weight: 600;
  font-size: var(--fs-sm);
}
.view-btn:hover:not(:disabled) { background-color: rgba(255,255,255,.5); color: var(--color-primary); transform: none; }
.view-btn.active {
  background-color: #fff;
  color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.weekday-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-weight: 700;
  color: var(--color-brown-500);
  font-size: var(--fs-sm);
  padding-bottom: var(--sp-2);
  border-bottom: 1.5px solid var(--color-border);
  margin-bottom: var(--sp-2);
}
.weekday-header span:first-child, .weekday-header span:last-child { color: var(--color-primary); }

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.calendar-day {
  position: relative;
  min-height: 80px;
  padding: 8px 10px;
  border: 1.5px solid transparent;
  border-radius: var(--radius-md);
  background-color: var(--color-bg-alt);
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.calendar-day:hover {
  border-color: var(--color-primary);
  background-color: var(--color-pink-50);
  transform: translateY(-1px);
}
.calendar-day.other-month { opacity: 0.4; }
.calendar-day .day-number { font-weight: 600; color: var(--color-brown-700); }
.calendar-day.has-appt {
  background: linear-gradient(135deg, #FFF5F8, var(--color-pink-100));
  border-color: var(--color-pink-300);
}
.appointment-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background-color: var(--color-primary);
  color: #fff;
  font-size: var(--fs-xs);
  font-weight: 700;
  position: absolute;
  top: 6px;
  right: 6px;
}

.week-view { display: flex; flex-direction: column; gap: 8px; }
.week-day, .day-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border: 1.5px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: #fff;
  cursor: pointer;
  transition: all var(--transition);
}
.week-day:hover, .day-card:hover {
  border-color: var(--color-primary);
  background-color: var(--color-pink-50);
}
.week-day.has-appt, .day-card.has-appt {
  background: linear-gradient(90deg, #FFF5F8, #fff);
}
.date { font-weight: 600; color: var(--color-brown-700); }
.count-badge {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background-color: var(--color-pink-100);
  color: var(--color-primary);
  font-size: var(--fs-sm);
  font-weight: 600;
}
.count-badge.empty { background-color: var(--color-bg); color: var(--color-text-muted); }

.day-view { display: flex; }
.day-card { flex: 1; }
</style>
