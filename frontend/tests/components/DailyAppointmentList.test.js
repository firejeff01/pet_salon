import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import DailyAppointmentList from '@/components/DailyAppointmentList.vue'

const mockGetByDate = vi.fn()

vi.mock('@/api/appointment.api.js', () => ({
  getByDate: (...args) => mockGetByDate(...args),
}))

function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/grooming/:appointmentId', name: 'grooming', component: { template: '<div />' } },
    ]
  })
}

describe('DailyAppointmentList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('shows date title', async () => {
    mockGetByDate.mockResolvedValue([])
    const wrapper = mount(DailyAppointmentList, {
      props: { date: '2026-04-16' },
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()
    expect(wrapper.text()).toContain('2026-04-16')
  })

  test('lists appointments sorted by time', async () => {
    mockGetByDate.mockResolvedValue([
      { id: 2, time: '14:00', petName: '小黑', ownerName: '李大華', ownerPhone: '0922333444', status: '已預約', hasContract: false },
      { id: 1, time: '10:00', petName: '小白', ownerName: '王小明', ownerPhone: '0912345678', status: '已預約', hasContract: true },
    ])
    const wrapper = mount(DailyAppointmentList, {
      props: { date: '2026-04-16' },
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()

    const rows = wrapper.findAll('[data-test="appointment-row"]')
    expect(rows.length).toBe(2)
    expect(rows[0].text()).toContain('10:00')
    expect(rows[1].text()).toContain('14:00')
  })

  test('each row shows time, petName, ownerName, ownerPhone, status, hasContract', async () => {
    mockGetByDate.mockResolvedValue([
      { id: 1, time: '10:00', petName: '小白', ownerName: '王小明', ownerPhone: '0912345678', status: '已預約', hasContract: true },
    ])
    const wrapper = mount(DailyAppointmentList, {
      props: { date: '2026-04-16' },
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()

    const row = wrapper.find('[data-test="appointment-row"]')
    expect(row.text()).toContain('10:00')
    expect(row.text()).toContain('小白')
    expect(row.text()).toContain('王小明')
    expect(row.text()).toContain('0912345678')
    expect(row.text()).toContain('已預約')
  })

  test('cancelled appointments show cancel style and reason', async () => {
    mockGetByDate.mockResolvedValue([
      { id: 1, time: '10:00', petName: '小白', ownerName: '王小明', ownerPhone: '0912345678', status: '已取消', hasContract: false, cancelReason: '客戶臨時有事' },
    ])
    const wrapper = mount(DailyAppointmentList, {
      props: { date: '2026-04-16' },
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()

    const row = wrapper.find('[data-test="appointment-row"]')
    expect(row.classes()).toContain('cancelled')
    expect(row.text()).toContain('客戶臨時有事')
  })

  test('click appointment navigates to grooming page', async () => {
    mockGetByDate.mockResolvedValue([
      { id: 5, time: '10:00', petName: '小白', ownerName: '王小明', ownerPhone: '0912345678', status: '已預約', hasContract: false },
    ])
    const router = createMockRouter()
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(DailyAppointmentList, {
      props: { date: '2026-04-16' },
      global: { plugins: [router] }
    })
    await flushPromises()

    await wrapper.find('[data-test="appointment-row"]').trigger('click')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: 'grooming',
      params: { appointmentId: 5 }
    }))
  })
})
