import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import CustomerForm from '@/components/CustomerForm.vue'

const mockOwnerCreate = vi.fn()
const mockPetCreate = vi.fn()

vi.mock('@/api/owner.api.js', () => ({
  create: (...args) => mockOwnerCreate(...args),
}))

vi.mock('@/api/pet.api.js', () => ({
  create: (...args) => mockPetCreate(...args),
}))

function createMockRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/customer-form', component: { template: '<div />' } },
    ]
  })
}

describe('CustomerForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('renders owner fields + pet fields', () => {
    const wrapper = mount(CustomerForm, {
      global: { plugins: [createMockRouter()] }
    })
    expect(wrapper.find('[data-field="name"]').exists()).toBe(true)
    expect(wrapper.find('[data-field="phone"]').exists()).toBe(true)
    expect(wrapper.find('[data-section="pet-0"]').exists()).toBe(true)
  })

  test('does NOT show owner list, delete button, calendar link, PDF button', () => {
    const wrapper = mount(CustomerForm, {
      global: { plugins: [createMockRouter()] }
    })
    expect(wrapper.find('[data-test="owner-list"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="delete-button"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="calendar-link"]').exists()).toBe(false)
    expect(wrapper.find('[data-test="pdf-button"]').exists()).toBe(false)
  })

  test('shows "返回店家操作" button', () => {
    const wrapper = mount(CustomerForm, {
      global: { plugins: [createMockRouter()] }
    })
    expect(wrapper.text()).toContain('返回店家操作')
  })

  test('validates owner required fields + at least 1 pet', async () => {
    const wrapper = mount(CustomerForm, {
      global: { plugins: [createMockRouter()] }
    })
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const errors = wrapper.findAll('.error-message')
    expect(errors.length).toBeGreaterThan(0)
  })

  test('can add multiple pets', async () => {
    const wrapper = mount(CustomerForm, {
      global: { plugins: [createMockRouter()] }
    })
    expect(wrapper.find('[data-section="pet-0"]').exists()).toBe(true)
    expect(wrapper.find('[data-section="pet-1"]').exists()).toBe(false)

    await wrapper.find('[data-test="add-pet-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-section="pet-1"]').exists()).toBe(true)
  })

  test('submit calls POST /api/owners then POST /api/pets with returned ownerId', async () => {
    mockOwnerCreate.mockResolvedValue({ id: 'owner_42' })
    mockPetCreate.mockResolvedValue({ id: 'pet_1' })

    const wrapper = mount(CustomerForm, {
      global: { plugins: [createMockRouter()] }
    })

    // Fill owner fields
    await wrapper.find('[data-field="name"] input').setValue('王小明')
    await wrapper.find('[data-field="nationalId"] input').setValue('A123456789')
    await wrapper.find('[data-field="phone"] input').setValue('0912345678')
    await wrapper.find('[data-field="address"] input').setValue('台北市信義區')
    await wrapper.find('[data-field="emergencyContactName"] input').setValue('王大明')
    await wrapper.find('[data-field="emergencyContactPhone"] input').setValue('0922333444')
    await wrapper.find('[data-field="emergencyContactRelationship"] input').setValue('父子')

    // Fill pet fields
    await wrapper.find('[data-section="pet-0"] [data-field="petName"] input').setValue('小白')
    await wrapper.find('[data-section="pet-0"] [data-field="species"] select').setValue('犬')
    await wrapper.find('[data-section="pet-0"] [data-field="breed"] input').setValue('柴犬')
    await wrapper.find('[data-section="pet-0"] [data-field="age"] input').setValue('3歲')
    await wrapper.find('[data-section="pet-0"] [data-field="gender"] select').setValue('公')
    await wrapper.find('[data-section="pet-0"] [data-field="neutered"] select').setValue('true')
    // Personality is required — check at least one
    const personalityCheckboxes = wrapper.findAll('[data-section="pet-0-personality"] input[type="checkbox"]')
    await personalityCheckboxes[0].setValue(true)

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockOwnerCreate).toHaveBeenCalled()
    expect(mockPetCreate).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 'owner_42',
      name: '小白',
      age: '3歲',
      isNeutered: true,
    }))
  })
})
