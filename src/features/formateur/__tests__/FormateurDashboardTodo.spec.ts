import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'

const counts: Record<string, number> = {}
vi.mock('vue-router', () => ({ RouterLink: { props: ['to'], template: '<a><slot /></a>' } }))
vi.mock('../composables/useTrainerCourses', () => ({
  apiErrorMessage: () => '',
  useTrainerCourses: () => ({
    data: ref({ items: [] }),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
  }),
  useTrainerCourseCount: (statuses: string[]) => ({
    data: ref(counts[statuses.join(',')] ?? 0),
    isPending: ref(false),
    isError: ref(false),
  }),
}))
const grading = { items: [] as unknown[], total: 0 }
vi.mock('../composables/useTrainerOverview', () => ({
  usePendingGrading: () => ({ data: ref(grading), isPending: ref(false), isError: ref(false) }),
  useUpcomingCohorts: () => ({
    data: ref([]),
    isPending: ref(false),
    isError: ref(false),
    error: ref(null),
  }),
}))

async function mountDashboard() {
  setActivePinia(createPinia())
  const { default: FormateurDashboard } = await import('../views/FormateurDashboard.vue')
  return mount(FormateurDashboard, {
    global: { stubs: { RouterLink: { template: '<a><slot /></a>' } } },
  })
}

describe('FormateurDashboard — À faire', () => {
  it('stays hidden when nothing is waiting', async () => {
    const wrapper = await mountDashboard()
    expect(wrapper.find('[data-test="trainer-todo"]').exists()).toBe(false)
  })

  it('lists copies to grade and rejected courses', async () => {
    grading.total = 2
    grading.items = [{ learner: { key: 'a' } }, { learner: { key: 'b' } }]
    counts.rejected = 1
    const wrapper = await mountDashboard()
    const todo = wrapper.find('[data-test="trainer-todo"]').text()
    expect(todo).toContain('2 copies à corriger')
    expect(todo).toContain('2 apprenants')
    expect(todo).toContain('1 cours à reprendre')
  })
})
