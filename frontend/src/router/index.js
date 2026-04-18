import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@/views/HomePage.vue') },
  { path: '/owners', name: 'owners', component: () => import('@/views/OwnerPage.vue') },
  { path: '/owners/:id', name: 'owner-detail', component: () => import('@/views/OwnerPage.vue') },
  { path: '/pets/:id', name: 'pet-detail', component: () => import('@/views/PetPage.vue') },
  { path: '/calendar', name: 'calendar', component: () => import('@/views/CalendarPage.vue') },
  { path: '/daily/:date', name: 'daily-list', component: () => import('@/views/DailyListPage.vue') },
  { path: '/grooming/:appointmentId', name: 'grooming', component: () => import('@/views/GroomingPage.vue') },
  { path: '/customer-form', name: 'customer-form', component: () => import('@/views/CustomerFormPage.vue') },
  { path: '/backup', name: 'backup', component: () => import('@/views/BackupPage.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
