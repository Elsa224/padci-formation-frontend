import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

vi.mock('vue-chartjs', () => ({ Bar: { template: '<div />' }, Doughnut: { template: '<div />' } }))
const counts = ref<Record<string, number>>({ submitted: 0, in_review: 0 })
const courses = ref<Record<string, number>>({ submitted: 0, in_review: 0 })
const q = <T>(data: T) => ({
  data: ref(data),
  isPending: ref(false),
  isError: ref(false),
  error: ref(null),
})
vi.mock('../composables/useDashboard', () => ({
  useDashboardOverview: () =>
    q({
      learners_total: 1,
      active_cohorts_total: 1,
      completion_rate: 0,
      certificates_issued_total: 0,
    }),
  useDashboardByPathway: () => q([]),
  useApplicationStatusCounts: () => ({ data: counts, isPending: ref(false), isError: ref(false) }),
}))
vi.mock('../composables/useApplications', () => ({ useApplications: () => q({ items: [] }) }))
vi.mock('@/features/moderation/composables/useModerationQueues', () => ({
  useCourseStatusCounts: () => ({ data: courses }),
}))

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

describe('AdminDashboard — À traiter', () => {
  it('is hidden when nothing waits for a decision', async () => {
    const { default: AdminDashboard } = await import('../views/AdminDashboard.vue')
    expect(
      mount(AdminDashboard, { global: { stubs } }).find('[data-test="admin-todo"]').exists(),
    ).toBe(false)
  })

  it('counts applications and courses waiting for a decision', async () => {
    counts.value = { submitted: 2, in_review: 1 }
    courses.value = { submitted: 1, in_review: 0 }
    const { default: AdminDashboard } = await import('../views/AdminDashboard.vue')
    const todo = mount(AdminDashboard, { global: { stubs } })
      .find('[data-test="admin-todo"]')
      .text()
    expect(todo).toContain('3')
    expect(todo).toContain('candidatures à décider')
    expect(todo).toContain('cours à valider')
  })
})
