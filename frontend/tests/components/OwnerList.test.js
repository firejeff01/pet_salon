import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OwnerList from '@/components/OwnerList.vue'

const mockGetAll = vi.fn()
const mockSearch = vi.fn()

vi.mock('@/api/owner.api.js', () => ({
  getAll: (...args) => mockGetAll(...args),
  search: (...args) => mockSearch(...args),
}))

describe('OwnerList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('renders owner list from API', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, name: '王小明', phone: '0912345678', pets: [{ name: '小白' }] },
      { id: 2, name: '李大華', phone: '0922333444', pets: [{ name: '黑嚕嚕' }] },
    ])

    const wrapper = mount(OwnerList)
    await flushPromises()

    expect(wrapper.text()).toContain('王小明')
    expect(wrapper.text()).toContain('李大華')
  })

  test('search input calls API with keyword', async () => {
    mockGetAll.mockResolvedValue([])
    mockSearch.mockResolvedValue([
      { id: 1, name: '王小明', phone: '0912345678', pets: [] }
    ])

    const wrapper = mount(OwnerList)
    await flushPromises()

    const searchInput = wrapper.find('[data-test="search-input"]')
    await searchInput.setValue('王')
    await searchInput.trigger('input')
    await flushPromises()

    expect(mockSearch).toHaveBeenCalledWith('王')
  })

  test('shows "查無資料" when empty', async () => {
    mockGetAll.mockResolvedValue([])

    const wrapper = mount(OwnerList)
    await flushPromises()

    expect(wrapper.text()).toContain('查無資料')
  })

  test('each row shows name, phone, pet summary', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, name: '王小明', phone: '0912345678', pets: [{ name: '小白' }, { name: '小黑' }] },
    ])

    const wrapper = mount(OwnerList)
    await flushPromises()

    const row = wrapper.find('[data-test="owner-row"]')
    expect(row.text()).toContain('王小明')
    expect(row.text()).toContain('0912345678')
    expect(row.text()).toContain('小白')
  })
})
