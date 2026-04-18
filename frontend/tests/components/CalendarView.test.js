import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CalendarView from '@/components/CalendarView.vue'

const mockGetByMonth = vi.fn()
const mockGetByDate = vi.fn()

vi.mock('@/api/appointment.api.js', () => ({
  getByMonth: (...args) => mockGetByMonth(...args),
  getByDate: (...args) => mockGetByDate(...args),
}))

function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/daily/:date', name: 'daily-list', component: { template: '<div />' } },
    ]
  })
}

describe('CalendarView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetByMonth.mockResolvedValue([])
  })

  test('renders month view by default', async () => {
    const wrapper = mount(CalendarView, {
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()
    expect(wrapper.find('[data-test="month-view"]').exists()).toBe(true)
  })

  test('can switch to week view and day view', async () => {
    const wrapper = mount(CalendarView, {
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()

    await wrapper.find('[data-test="view-week"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="week-view"]').exists()).toBe(true)

    await wrapper.find('[data-test="view-day"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-test="day-view"]').exists()).toBe(true)
  })

  test('shows appointment count on dates', async () => {
    mockGetByMonth.mockResolvedValue([
      { id: 1, date: '2026-04-16', time: '10:00' },
      { id: 2, date: '2026-04-16', time: '14:00' },
      { id: 3, date: '2026-04-20', time: '09:00' },
    ])

    const wrapper = mount(CalendarView, {
      props: { initialYear: 2026, initialMonth: 4 },
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()

    const day16 = wrapper.find('[data-date="2026-04-16"]')
    expect(day16.text()).toContain('2')
  })

  test('navigate forward/backward months', async () => {
    const wrapper = mount(CalendarView, {
      props: { initialYear: 2026, initialMonth: 4 },
      global: { plugins: [createMockRouter()] }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('2026')
    expect(wrapper.text()).toContain('4')

    await wrapper.find('[data-test="nav-next"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('5')

    await wrapper.find('[data-test="nav-prev"]').trigger('click')
    await wrapper.find('[data-test="nav-prev"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('3')
  })

  test('click date navigates to daily list', async () => {
    mockGetByMonth.mockResolvedValue([
      { id: 1, date: '2026-04-16', time: '10:00' },
    ])
    const router = createMockRouter()
    const pushSpy = vi.spyOn(router, 'push')

    const wrapper = mount(CalendarView, {
      props: { initialYear: 2026, initialMonth: 4 },
      global: { plugins: [router] }
    })
    await flushPromises()

    const day16 = wrapper.find('[data-date="2026-04-16"]')
    await day16.trigger('click')
    await flushPromises()

    expect(pushSpy).toHaveBeenCalledWith(expect.objectContaining({
      name: 'daily-list',
      params: { date: '2026-04-16' }
    }))
  })
})
