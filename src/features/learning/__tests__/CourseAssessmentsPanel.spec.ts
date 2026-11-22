import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'
import CourseAssessmentsPanel from '../components/CourseAssessmentsPanel.vue'
import * as assessmentsModule from '../composables/useAssessments'
import * as certificatesModule from '../composables/useCertificates'
import { ApiError } from '@/api/http'

const push = vi.fn()
const startMutate = vi.fn()
const certificateMutate = vi.fn()

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push }),
}))
vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('../composables/useAssessments', async (importOriginal) => ({
  ...(await importOriginal<typeof assessmentsModule>()),
  useCourseAssessments: vi.fn(),
  useStartAttempt: vi.fn(() => ({ mutateAsync: startMutate, isPending: ref(false) })),
}))
vi.mock('../composables/useCertificates', async (importOriginal) => ({
  ...(await importOriginal<typeof certificatesModule>()),
  useMyCertificates: vi.fn(),
  useRequestCertificate: vi.fn(() => ({ mutateAsync: certificateMutate, isPending: ref(false) })),
}))

function mountPanel() {
  return mount(CourseAssessmentsPanel, {
    props: { courseKey: 'crs_1' },
    global: { stubs: { RouterLink: RouterLinkStub } },
  })
}

describe('CourseAssessmentsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(assessmentsModule.useCourseAssessments).mockReturnValue({
      data: ref([
        {
          key: 'asm_exam',
          title: 'Examen final',
          status: 'published',
          settings: { duration_minutes: 60, max_attempts: 1 },
          scheduled_at: '2026-12-05T09:00:00Z',
          delivery_mode: 'offline',
          location: 'Salle B12',
          schedule_published_at: '2026-11-20T09:00:00Z',
          questions_count: 20,
        },
      ]),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)
    vi.mocked(certificatesModule.useMyCertificates).mockReturnValue({ data: ref([]) } as never)
  })

  it('shows a published exam schedule and opens the attempt on start', async () => {
    startMutate.mockResolvedValue({ key: 'att_9' })
    const wrapper = mountPanel()
    expect(wrapper.find('[data-test="exam-schedule"]').text()).toContain('en salle · Salle B12')

    await wrapper.find('[data-test="start-assessment"]').trigger('click')
    await flushPromises()
    expect(startMutate).toHaveBeenCalledWith('asm_exam')
    expect(push).toHaveBeenCalledWith('/formations/crs_1/evaluations/att_9')
  })

  it('shows why an attempt cannot start (e.g. attempts exhausted)', async () => {
    startMutate.mockRejectedValue(
      new ApiError('Nombre maximal de tentatives atteint.', 'VALIDATION_FAILED', 422, null, null),
    )
    const wrapper = mountPanel()
    await wrapper.find('[data-test="start-assessment"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Nombre maximal de tentatives atteint.')
    expect(push).not.toHaveBeenCalled()
  })

  it('explains when the certificate criteria are not met yet', async () => {
    certificateMutate.mockRejectedValue(
      new ApiError('Score minimum non atteint.', 'VALIDATION_FAILED', 422, null, null),
    )
    const wrapper = mountPanel()
    await wrapper.find('[data-test="certificate-block"] button').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Score minimum non atteint.')
  })
})
