import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PetForm from '@/components/PetForm.vue'

const mockCreate = vi.fn()
const mockUpdate = vi.fn()
const mockGetById = vi.fn()

vi.mock('@/api/pet.api.js', () => ({
  create: (...args) => mockCreate(...args),
  update: (...args) => mockUpdate(...args),
  getById: (...args) => mockGetById(...args),
}))

describe('PetForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  test('renders species select (犬/貓), gender select (公/母), neutered select', () => {
    const wrapper = mount(PetForm, { props: { ownerId: 1 } })
    const speciesSelect = wrapper.find('[data-field="species"]')
    expect(speciesSelect.text()).toContain('犬')
    expect(speciesSelect.text()).toContain('貓')

    const genderSelect = wrapper.find('[data-field="gender"]')
    expect(genderSelect.text()).toContain('公')
    expect(genderSelect.text()).toContain('母')

    expect(wrapper.find('[data-field="neutered"]').exists()).toBe(true)
  })

  test('renders personality checkboxes (8 items)', () => {
    const wrapper = mount(PetForm, { props: { ownerId: 1 } })
    const personalities = ['親人', '不會咬人', '不會咬狗貓', '容易緊張', '親狗', '會咬人', '會咬狗貓', '有攻擊性']
    const section = wrapper.find('[data-section="personality"]')
    personalities.forEach(p => {
      expect(section.text()).toContain(p)
    })
  })

  test('renders physical examination fields', () => {
    const wrapper = mount(PetForm, { props: { ownerId: 1 } })
    const fields = ['eyes', 'ears', 'teeth', 'limbs', 'skin', 'fur']
    fields.forEach(f => {
      expect(wrapper.find(`[data-field="physical.${f}"]`).exists()).toBe(true)
    })
  })

  test('renders medical history checkboxes (18 items)', () => {
    const wrapper = mount(PetForm, { props: { ownerId: 1 } })
    const section = wrapper.find('[data-section="medicalHistory"]')
    expect(section.exists()).toBe(true)
    const checkboxes = section.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBeGreaterThanOrEqual(18)
  })

  test('shows "其它" text field when "其它" checkbox checked', async () => {
    const wrapper = mount(PetForm, { props: { ownerId: 1 } })
    expect(wrapper.find('[data-field="medicalHistoryOther"]').exists()).toBe(false)

    const otherCheckbox = wrapper.find('[data-test="medical-other-checkbox"]')
    await otherCheckbox.setValue(true)
    await flushPromises()

    expect(wrapper.find('[data-field="medicalHistoryOther"]').exists()).toBe(true)
  })

  test('validates required fields', async () => {
    const wrapper = mount(PetForm, { props: { ownerId: 1 } })
    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    const errors = wrapper.findAll('.error-message')
    expect(errors.length).toBeGreaterThan(0)
  })

  test('calls API with correct data structure', async () => {
    mockCreate.mockResolvedValue({ id: 'pet_1' })
    const wrapper = mount(PetForm, { props: { ownerId: 'owner_1' } })

    await wrapper.find('[data-field="name"] input').setValue('小白')
    await wrapper.find('[data-field="species"] select').setValue('犬')
    await wrapper.find('[data-field="breed"] input').setValue('柴犬')
    await wrapper.find('[data-field="age"] input').setValue('3歲')
    await wrapper.find('[data-field="gender"] select').setValue('公')
    await wrapper.find('[data-field="neutered"] select').setValue('true')

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      name: '小白',
      species: '犬',
      breed: '柴犬',
      age: '3歲',
      gender: '公',
      isNeutered: true,
      ownerId: 'owner_1',
    }))
  })
})
