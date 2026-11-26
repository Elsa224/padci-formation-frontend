import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'

const mutateAsync = vi.fn()
const decideAsync = vi.fn()
const rows = ref([
  {
    learner: { key: 'usr_a', name: 'Awa Koné', email: 'awa@test' },
    grade: { key: 'grd_1', score: 12, appreciation: 'Bien', updated_at: null },
  },
])

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@tanstack/vue-query', () => ({
  useQuery: () => ({
    data: ref([{ key: 'coh_1', name: 'Cyber - Session 1', pathway: { key: 'pth_1' } }]),
    isPending: ref(false),
  }),
}))
vi.mock('@/features/catalog/composables/useCatalog', () => ({
  usePathwayCourses: () => ({ data: ref({ items: [{ key: 'crs_1', title: 'Cours 1' }] }) }),
}))
vi.mock('@/features/cohorts/composables/useCourseGrades', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useCohortGrades: () => ({ data: rows, isPending: ref(false) }),
  useSaveGrades: () => ({ mutateAsync, isPending: ref(false) }),
  useMyGrades: () => ({
    data: ref([
      {
        key: 'grd_1',
        score: 14.5,
        appreciation: 'Très bien',
        course: { key: 'crs_1', title: 'Cours 1' },
        cohort: { key: 'coh_1', name: 'Cyber - Session 1' },
        grader: { key: 'usr_t', name: 'Demo Formateur' },
      },
    ]),
    isPending: ref(false),
    isError: ref(false),
  }),
}))
vi.mock('@/features/cohorts/composables/useTrainerReports', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePendingReportCount: () => ({ data: ref(1) }),
  useAllReports: () => ({
    data: ref({
      items: [
        {
          key: 'trp_1',
          title: 'Bilan module 1',
          status: 'submitted',
          period_label: 'Module 1',
          summary: null,
          review_note: null,
          created_at: '2026-11-23T10:00:00Z',
          author: { key: 'usr_t', name: 'Demo Formateur' },
          cohort: { key: 'coh_1', code: 'C1', name: 'Cyber - Session 1' },
        },
      ],
    }),
    isPending: ref(false),
    isError: ref(false),
  }),
  useDecideReport: () => ({ mutateAsync: decideAsync, isPending: ref(false) }),
}))

describe('FormateurNotes', () => {
  it('sends the edited grade and refuses a score above 20', async () => {
    const { default: FormateurNotes } =
      await import('@/features/formateur/views/FormateurNotes.vue')
    const wrapper = mount(FormateurNotes)
    await flushPromises()
    const score = wrapper.find('[data-test="grade-row"] input[type="number"]')

    await score.setValue('21')
    await wrapper.find('[data-test="grades-form"]').trigger('submit')
    expect(wrapper.text()).toContain('entre 0 et 20')
    expect(mutateAsync).not.toHaveBeenCalled()

    await score.setValue('15.5')
    await wrapper.find('[data-test="grades-form"]').trigger('submit')
    expect(mutateAsync).toHaveBeenCalledWith([
      { learner_key: 'usr_a', score: 15.5, appreciation: 'Bien' },
    ])
  })
})

describe('MesNotes', () => {
  it('shows the score out of 20 with the appreciation and the grader', async () => {
    const { default: MesNotes } = await import('@/features/learning/views/MesNotes.vue')
    const text = mount(MesNotes).find('[data-test="my-grade"]').text()
    expect(text).toContain('14,5')
    expect(text).toContain('Très bien')
    expect(text).toContain('Demo Formateur')
  })
})

describe('AdminRapportsFormateurs', () => {
  it('approves directly and rejects only with a reason', async () => {
    const { default: View } = await import('@/features/admin/views/AdminRapportsFormateurs.vue')
    const wrapper = mount(View)

    await wrapper.find('[data-test="approve-report"]').trigger('click')
    expect(decideAsync).toHaveBeenLastCalledWith({ key: 'trp_1', decision: 'approved', note: '' })

    await wrapper.find('[data-test="reject-report"]').trigger('click')
    await wrapper.find('textarea').setValue('Il manque le bilan des présences')
    await wrapper.find('form').trigger('submit')
    expect(decideAsync).toHaveBeenLastCalledWith({
      key: 'trp_1',
      decision: 'rejected',
      note: 'Il manque le bilan des présences',
    })
  })
})
