import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BackupPage from '@/components/BackupPage.vue'

const mockGetAll = vi.fn()
const mockCreate = vi.fn()

vi.mock('@/api/backup.api.js', () => ({
  getAll: (...args) => mockGetAll(...args),
  create: (...args) => mockCreate(...args),
}))

describe('BackupPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('shows backup button', async () => {
    mockGetAll.mockResolvedValue([])
    const wrapper = mount(BackupPage)
    await flushPromises()
    expect(wrapper.find('[data-test="backup-button"]').exists()).toBe(true)
  })

  test('shows backup list from API', async () => {
    mockGetAll.mockResolvedValue([
      { id: 1, filename: 'backup_2026-04-16.db', createdAt: '2026-04-16 10:00:00' },
      { id: 2, filename: 'backup_2026-04-15.db', createdAt: '2026-04-15 09:00:00' },
    ])

    const wrapper = mount(BackupPage)
    await flushPromises()

    expect(wrapper.text()).toContain('backup_2026-04-16.db')
    expect(wrapper.text()).toContain('backup_2026-04-15.db')
  })

  test('click backup calls POST /api/backup', async () => {
    mockGetAll.mockResolvedValue([])
    mockCreate.mockResolvedValue({ id: 1, filename: 'backup_2026-04-16.db' })

    const wrapper = mount(BackupPage)
    await flushPromises()

    await wrapper.find('[data-test="backup-button"]').trigger('click')
    await flushPromises()

    expect(mockCreate).toHaveBeenCalled()
  })

  test('shows "尚無備份檔案" when empty', async () => {
    mockGetAll.mockResolvedValue([])

    const wrapper = mount(BackupPage)
    await flushPromises()

    expect(wrapper.text()).toContain('尚無備份檔案')
  })

  test('refreshes list after backup', async () => {
    mockGetAll
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        { id: 1, filename: 'backup_2026-04-16.db', createdAt: '2026-04-16 10:00:00' },
      ])
    mockCreate.mockResolvedValue({ id: 1, filename: 'backup_2026-04-16.db' })

    const wrapper = mount(BackupPage)
    await flushPromises()

    expect(wrapper.text()).toContain('尚無備份檔案')

    await wrapper.find('[data-test="backup-button"]').trigger('click')
    await flushPromises()

    expect(mockGetAll).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('backup_2026-04-16.db')
  })
})
