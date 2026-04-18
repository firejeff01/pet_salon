import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SignaturePad from '@/components/SignaturePad.vue'

describe('SignaturePad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders canvas element', () => {
    const wrapper = mount(SignaturePad, {
      props: { hasContract: true }
    })
    expect(wrapper.find('canvas').exists()).toBe(true)
  })

  test('clear button exists', () => {
    const wrapper = mount(SignaturePad, {
      props: { hasContract: true }
    })
    expect(wrapper.find('[data-test="clear-button"]').exists()).toBe(true)
  })

  test('confirm button exists', () => {
    const wrapper = mount(SignaturePad, {
      props: { hasContract: true }
    })
    expect(wrapper.find('[data-test="confirm-button"]').exists()).toBe(true)
  })

  test('empty canvas shows warning on confirm', async () => {
    const wrapper = mount(SignaturePad, {
      props: { hasContract: true }
    })
    await wrapper.find('[data-test="confirm-button"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('請先簽名')
  })

  test('disabled when no contract exists', () => {
    const wrapper = mount(SignaturePad, {
      props: { hasContract: false }
    })
    expect(wrapper.find('canvas').attributes('class')).toContain('disabled')
    expect(wrapper.find('[data-test="confirm-button"]').attributes('disabled')).toBeDefined()
  })
})
