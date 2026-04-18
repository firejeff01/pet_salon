import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GroomingRecordForm from '@/components/GroomingRecordForm.vue'

const mockGetAppointmentById = vi.fn()
const mockGroomingCreate = vi.fn()
const mockContractGenerate = vi.fn()
const mockContractGetVersions = vi.fn()

vi.mock('@/api/appointment.api.js', () => ({
  getById: (...args) => mockGetAppointmentById(...args),
}))

vi.mock('@/api/grooming.api.js', () => ({
  create: (...args) => mockGroomingCreate(...args),
}))

vi.mock('@/api/contract.api.js', () => ({
  generate: (...args) => mockContractGenerate(...args),
  getVersions: (...args) => mockContractGetVersions(...args),
}))

describe('GroomingRecordForm', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockGetAppointmentById.mockResolvedValue({
      id: 1,
      petName: '小白',
      petId: 10,
      ownerId: 20,
      ownerName: '王小明',
      ownerPhone: '0912345678',
      owner: { storedValueBalance: 5000, isStoredValueCustomer: true },
    })
    mockContractGetVersions.mockResolvedValue([])
  })

  test('auto-loads owner and pet data', async () => {
    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    expect(mockGetAppointmentById).toHaveBeenCalledWith(1)
    expect(wrapper.text()).toContain('小白')
    expect(wrapper.text()).toContain('王小明')
  })

  test('shows service checkboxes: 洗澡, 美容, 其他', async () => {
    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('洗澡')
    expect(wrapper.text()).toContain('美容')
    expect(wrapper.text()).toContain('其他')
  })

  test('input price for each selected service', async () => {
    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    await wrapper.find('[data-test="service-洗澡"]').setValue(true)
    await flushPromises()

    const priceInput = wrapper.find('[data-test="price-洗澡"]')
    expect(priceInput.exists()).toBe(true)
    await priceInput.setValue(500)
  })

  test('shows stored value calculation for stored-value customers', async () => {
    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    expect(wrapper.find('[data-test="stored-value-section"]').exists()).toBe(true)
  })

  test('calculate: balance=5000, cost=500 -> deduction=500, cash=0, remaining=4500', async () => {
    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    await wrapper.find('[data-test="service-洗澡"]').setValue(true)
    await flushPromises()
    await wrapper.find('[data-test="price-洗澡"]').setValue(500)
    await flushPromises()

    expect(wrapper.find('[data-test="deduction"]').text()).toContain('500')
    expect(wrapper.find('[data-test="cash"]').text()).toContain('0')
    expect(wrapper.find('[data-test="remaining"]').text()).toContain('4500')
  })

  test('calculate: balance=300, cost=800 -> deduction=300, cash=500, remaining=0', async () => {
    mockGetAppointmentById.mockResolvedValue({
      id: 1,
      petName: '小白',
      petId: 10,
      ownerId: 20,
      ownerName: '王小明',
      ownerPhone: '0912345678',
      owner: { storedValueBalance: 300, isStoredValueCustomer: true },
    })

    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    await wrapper.find('[data-test="service-洗澡"]').setValue(true)
    await flushPromises()
    await wrapper.find('[data-test="price-洗澡"]').setValue(800)
    await flushPromises()

    expect(wrapper.find('[data-test="deduction"]').text()).toContain('300')
    expect(wrapper.find('[data-test="cash"]').text()).toContain('500')
    expect(wrapper.find('[data-test="remaining"]').text()).toContain('0')
  })

  test('non-stored-value customer: hide stored value section', async () => {
    mockGetAppointmentById.mockResolvedValue({
      id: 1,
      petName: '小白',
      petId: 10,
      ownerId: 20,
      ownerName: '王小明',
      ownerPhone: '0912345678',
      owner: { storedValueBalance: 0, isStoredValueCustomer: false },
    })

    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    expect(wrapper.find('[data-test="stored-value-section"]').exists()).toBe(false)
  })

  test('save button calls POST /api/grooming-records', async () => {
    mockGroomingCreate.mockResolvedValue({ id: 100 })
    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    await wrapper.find('[data-test="service-洗澡"]').setValue(true)
    await flushPromises()
    await wrapper.find('[data-test="price-洗澡"]').setValue(500)
    await flushPromises()

    await wrapper.find('[data-test="save-button"]').trigger('click')
    await flushPromises()

    expect(mockGroomingCreate).toHaveBeenCalled()
  })

  test('generate contract button calls POST /api/contracts/generate', async () => {
    mockGroomingCreate.mockResolvedValue({ id: 100 })
    mockContractGenerate.mockResolvedValue({ id: 1 })

    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    await wrapper.find('[data-test="service-洗澡"]').setValue(true)
    await flushPromises()
    await wrapper.find('[data-test="price-洗澡"]').setValue(500)
    await flushPromises()

    await wrapper.find('[data-test="save-button"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="generate-contract-button"]').trigger('click')
    await flushPromises()

    expect(mockContractGenerate).toHaveBeenCalledWith(100)
  })

  test('shows version list after generating', async () => {
    mockGroomingCreate.mockResolvedValue({ id: 100 })
    mockContractGenerate.mockResolvedValue({ id: 1 })
    mockContractGetVersions.mockResolvedValue([
      { id: 1, version: 1, createdAt: '2026-04-16' }
    ])

    const wrapper = mount(GroomingRecordForm, {
      props: { appointmentId: 1 }
    })
    await flushPromises()

    await wrapper.find('[data-test="service-洗澡"]').setValue(true)
    await flushPromises()
    await wrapper.find('[data-test="price-洗澡"]').setValue(500)
    await flushPromises()

    await wrapper.find('[data-test="save-button"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-test="generate-contract-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-test="version-list"]').exists()).toBe(true)
  })
})
