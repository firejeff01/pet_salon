import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import OwnerForm from '@/components/OwnerForm.vue'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockGetById = vi.fn()

vi.mock('@/api/owner.api.js', () => ({
  create: (...args) => mockCreate(...args),
  update: (...args) => mockUpdate(...args),
  getById: (...args) => mockGetById(...args),
}))

describe('OwnerForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('renders all required fields', () => {
    const wrapper = mount(OwnerForm)
    expect(wrapper.find('[data-field="name"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="nationalId"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="phone"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="address"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="emergencyContactName"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="emergencyContactPhone"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="emergencyContactRelationship"]').exists()).toBe(true)
  })

  test('shows validation errors when submitting empty form', async () => {
    const wrapper = mount(OwnerForm)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    const errors = wrapper.findAll('.error-message')
    expect(errors.length).toBeGreaterThanOrEqual(7)
  })

  test('shows "儲值餘額不得小於 0" for negative balance', async () => {
    const wrapper = mount(OwnerForm)
    const balanceInput = wrapper.find('[data-field="storedValueBalance"]')
    await balanceInput.setValue(-100)
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()
    expect(wrapper.text()).toContain('儲值餘額不得小於 0')
  })

  test('calls API on valid submit', async () => {
    mockCreate.mockResolvedValue({ id: 1 })
    const wrapper = mount(OwnerForm)

    await wrapper.find('[data-field="name"] input').setValue('王小明')
    await wrapper.find('[data-field="nationalId"] input').setValue('A123456789')
    await wrapper.find('[data-field="phone"] input').setValue('0912345678')
    await wrapper.find('[data-field="address"] input').setValue('台北市信義區')
    await wrapper.find('[data-field="emergencyContactName"] input').setValue('王大明')
    await wrapper.find('[data-field="emergencyContactPhone"] input').setValue('0922333444')
    await wrapper.find('[data-field="emergencyContactRelationship"] input').setValue('父子')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: '王小明',
      nationalId: 'A123456789',
      phone: '0912345678',
    }))
  })

  test('edit mode loads existing data', async () => {
    mockGetById.mockResolvedValue({
      id: 1,
      name: '王小明',
      nationalId: 'A123456789',
      phone: '0912345678',
      address: '台北市',
      emergencyContactName: '王大明',
      emergencyContactPhone: '0922333444',
      emergencyContactRelationship: '父子',
      storedValueBalance: 5000,
    })

    const wrapper = mount(OwnerForm, {
      props: { ownerId: 1 }
    })
    await flushPromises()

    expect(mockGetById).toHaveBeenCalledWith(1)
    expect(wrapper.find('[data-field="name"] input').element.value).toBe('王小明')
  })

  test('handles API success (shows success message)', async () => {
    mockCreate.mockResolvedValue({ id: 1 })
    const wrapper = mount(OwnerForm)

    await wrapper.find('[data-field="name"] input').setValue('王小明')
    await wrapper.find('[data-field="nationalId"] input').setValue('A123456789')
    await wrapper.find('[data-field="phone"] input').setValue('0912345678')
    await wrapper.find('[data-field="address"] input').setValue('台北市信義區')
    await wrapper.find('[data-field="emergencyContactName"] input').setValue('王大明')
    await wrapper.find('[data-field="emergencyContactPhone"] input').setValue('0922333444')
    await wrapper.find('[data-field="emergencyContactRelationship"] input').setValue('父子')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('儲存成功')
  })

  test('handles API error (shows error message)', async () => {
    mockCreate.mockRejectedValue(new Error('伺服器錯誤'))
    const wrapper = mount(OwnerForm)

    await wrapper.find('[data-field="name"] input').setValue('王小明')
    await wrapper.find('[data-field="nationalId"] input').setValue('A123456789')
    await wrapper.find('[data-field="phone"] input').setValue('0912345678')
    await wrapper.find('[data-field="address"] input').setValue('台北市信義區')
    await wrapper.find('[data-field="emergencyContactName"] input').setValue('王大明')
    await wrapper.find('[data-field="emergencyContactPhone"] input').setValue('0922333444')
    await wrapper.find('[data-field="emergencyContactRelationship"] input').setValue('父子')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('伺服器錯誤')
  })
})
