import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import QueueTabs from '../QueueTabs.vue'

const tabs = [
  { value: 'pending', label: 'À examiner', count: 3, urgent: true },
  { value: 'approved', label: 'Validés', count: 0 },
]

describe('QueueTabs', () => {
  it('marks the active tab and shows counts', () => {
    const wrapper = mount(QueueTabs, { props: { modelValue: 'approved', tabs, label: 'Statut' } })
    const buttons = wrapper.findAll('[role="tab"]')
    expect(buttons[1]!.attributes('aria-selected')).toBe('true')
    expect(buttons[0]!.text()).toContain('3')
    // a waiting queue that is not selected is highlighted in savane
    expect(buttons[0]!.find('span').classes()).toContain('bg-savane-soft')
  })

  it('emits the chosen status', async () => {
    const wrapper = mount(QueueTabs, { props: { modelValue: 'approved', tabs, label: 'Statut' } })
    await wrapper.findAll('[role="tab"]')[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['pending'])
  })
})
