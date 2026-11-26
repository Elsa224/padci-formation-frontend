import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

const state = {
  courses: { submitted: 1, in_review: 1 } as Record<string, number>,
  equipment: { pending: 1, needs_info: 0 } as Record<string, number>,
}
vi.mock('@/features/admin/composables/useDashboard', () => ({
  useApplicationStatusCounts: () => ({
    data: ref({ submitted: 2, in_review: 0 }),
    isPending: ref(false),
  }),
}))
vi.mock('../composables/useModerationQueues', () => ({
  useCourseStatusCounts: () => ({ data: ref(state.courses), isPending: ref(false) }),
  useEquipmentStatusCounts: () => ({ data: ref(state.equipment), isPending: ref(false) }),
  useCourseQueueHead: () => ({
    data: ref([{ key: 'c1', title: 'Cours A', status: 'in_review' }]),
    isPending: ref(false),
    isError: ref(false),
  }),
  useEquipmentQueueHead: () => ({ data: ref([]), isPending: ref(false), isError: ref(false) }),
}))

async function mountDashboard() {
  setActivePinia(createPinia())
  const { default: ModeratorDashboard } = await import('../views/ModeratorDashboard.vue')
  return mount(ModeratorDashboard, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('ModeratorDashboard', () => {
  it('sums what is waiting and lists the course queue', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.text()).toContain('5 éléments attendent votre examen.')
    expect(wrapper.find('[data-test="tile-applications"]').text()).toContain('2')
    expect(wrapper.find('[data-test="tile-courses"]').text()).toContain('2')
    expect(wrapper.text()).toContain('Cours A')
    expect(wrapper.text()).toContain("En cours d'examen")
    expect(wrapper.text()).toContain('Aucun dossier à examiner')
  })
})
