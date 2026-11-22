import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises, RouterLinkStub } from '@vue/test-utils'
import { ref } from 'vue'
import * as ops from '../composables/useAdminOperations'
import * as dashboard from '../composables/useDashboard'
import AdminRapports from '../views/AdminRapports.vue'
import AdminParametres from '../views/AdminParametres.vue'
import AdminInscriptions from '../views/AdminInscriptions.vue'
import AdminCatalogue from '../views/AdminCatalogue.vue'
import AdminAttestations from '../views/AdminAttestations.vue'
import AdminAudit from '../views/AdminAudit.vue'
import { ApiError } from '@/api/http'

const m = (fn = vi.fn()) => ({ mutateAsync: fn, isPending: ref(false) })
const q = (data: unknown) => ({
  data: ref(data),
  isPending: ref(false),
  isError: ref(false),
  error: ref(null),
})

const updateSettings = vi.fn()
const enrollmentAction = vi.fn()
const savePathway = vi.fn()
const revoke = vi.fn()

vi.mock('vue-sonner', () => ({ toast: { success: vi.fn() } }))
vi.mock('../composables/useDashboard', async (importOriginal) => ({
  ...(await importOriginal<typeof dashboard>()),
  useDashboardOverview: vi.fn(),
  useDashboardByPathway: vi.fn(),
}))
vi.mock('../composables/useAdminOperations', async (importOriginal) => ({
  ...(await importOriginal<typeof ops>()),
  useDashboardByCohort: vi.fn(),
  useCourseSettings: vi.fn(),
  useUpdateCourseSettings: vi.fn(() => m(updateSettings)),
  useAdminEnrollments: vi.fn(),
  useEnrollmentAction: vi.fn(() => m(enrollmentAction)),
  useProgrammes: vi.fn(),
  useAdminPathways: vi.fn(),
  useSaveProgramme: vi.fn(() => m()),
  useDeleteProgramme: vi.fn(() => m()),
  useSavePathway: vi.fn(() => m(savePathway)),
  useDeletePathway: vi.fn(() => m()),
  useAdminCertificates: vi.fn(),
  useRevokeCertificate: vi.fn(() => m(revoke)),
  useAdminExternalCertifications: vi.fn(),
  useCreateExternalCertification: vi.fn(() => m()),
  useDeleteExternalCertification: vi.fn(() => m()),
  useUserSearch: vi.fn(() => q([])),
  useAuditLogs: vi.fn(),
  useAuthEvents: vi.fn(),
}))

beforeEach(() => vi.clearAllMocks())

describe('AdminRapports', () => {
  it('shows live KPIs and per-cohort rows, and exports CSV', async () => {
    vi.mocked(dashboard.useDashboardOverview).mockReturnValue(
      q({
        learners_total: 120,
        active_cohorts_total: 3,
        published_courses_total: 8,
        completion_rate: 0.425,
        certificates_issued_total: 40,
      }) as never,
    )
    vi.mocked(dashboard.useDashboardByPathway).mockReturnValue(q([]) as never)
    vi.mocked(ops.useDashboardByCohort).mockReturnValue(
      q([
        {
          cohort_key: 'cht_1',
          code: 'ITS-2026-C1',
          name: 'IT Support — Cohorte 1',
          pathway_name: 'IT Support',
          enrolled_count: 40,
          completed_count: 17,
          completion_rate: 0.425,
          certificates_issued: 15,
          attendance_rate: 0.85,
          attendance_sessions_count: 4,
        },
      ]) as never,
    )
    URL.createObjectURL = vi.fn(() => 'blob:csv')
    URL.revokeObjectURL = vi.fn()

    const wrapper = mount(AdminRapports)
    expect(wrapper.text()).toContain('120')
    expect(wrapper.text()).toContain('42,5 %')
    expect(wrapper.text()).toContain('85 %')
    expect(wrapper.findAll('[data-test="report-row"]')).toHaveLength(1)

    const exportButtons = wrapper.findAll('button').filter((b) => b.text().includes('Exporter'))
    await exportButtons[1]!.trigger('click')
    const blob = vi.mocked(URL.createObjectURL).mock.calls[0]![0] as Blob
    const text = await blob.text()
    expect(text).toContain('IT Support — Cohorte 1;ITS-2026-C1 · IT Support;40;17;42,5;15;85;4')
  })
})

describe('AdminParametres', () => {
  it('toggles course moderation and puts the switch back on failure', async () => {
    vi.mocked(ops.useCourseSettings).mockReturnValue(
      q({ course_moderation_enabled: true }) as never,
    )
    updateSettings.mockRejectedValue(new ApiError('Interdit', 'FORBIDDEN', 403, null, null))
    const wrapper = mount(AdminParametres, { global: { stubs: { RouterLink: RouterLinkStub } } })
    const toggle = wrapper.find<HTMLInputElement>('[data-test="moderation-toggle"]')
    await toggle.setValue(false)
    await flushPromises()
    expect(updateSettings).toHaveBeenCalledWith({ course_moderation_enabled: false })
    expect(toggle.element.checked).toBe(true)
    expect(wrapper.text()).toContain('Interdit')
  })
})

describe('AdminInscriptions', () => {
  beforeEach(() => {
    vi.mocked(ops.useAdminEnrollments).mockReturnValue(
      q({
        items: [
          { key: 'enr_a', status: 'active', user: { key: 'u1', name: 'Aya', email: 'a@x.ci' } },
          { key: 'enr_s', status: 'suspended', user: { key: 'u2', name: 'Yao', email: 'y@x.ci' } },
          { key: 'enr_r', status: 'revoked', user: { key: 'u3', name: 'Koffi', email: 'k@x.ci' } },
        ],
        pagination: null,
      }) as never,
    )
  })

  it('only offers the transitions the workflow allows', () => {
    const rows = mount(AdminInscriptions).findAll('[data-test="enrollment-row"]')
    expect(rows[0]!.find('[data-test="action-suspend"]').exists()).toBe(true)
    expect(rows[0]!.find('[data-test="action-reinstate"]').exists()).toBe(false)
    expect(rows[1]!.find('[data-test="action-reinstate"]').exists()).toBe(true)
    expect(rows[1]!.find('[data-test="action-complete"]').exists()).toBe(false)
    expect(rows[2]!.findAll('button')).toHaveLength(0)
  })

  it('sends a revocation with its reason', async () => {
    enrollmentAction.mockResolvedValue({})
    const wrapper = mount(AdminInscriptions)
    await wrapper.find('[data-test="action-revoke"]').trigger('click')
    await wrapper.find('#reason-enr_a').setValue('Fraude à l’évaluation')
    await wrapper.find('[data-test="action-form"]').trigger('submit')
    await flushPromises()
    expect(enrollmentAction).toHaveBeenCalledWith({
      key: 'enr_a',
      action: 'revoke',
      reason: 'Fraude à l’évaluation',
    })
  })
})

describe('AdminCatalogue', () => {
  it('saves a pathway with its equipment requirements', async () => {
    vi.mocked(ops.useProgrammes).mockReturnValue(
      q({
        items: [{ key: 'prg_1', code: 'PADCI', name: 'PADCI', status: 'active' }],
        pagination: null,
      }) as never,
    )
    vi.mocked(ops.useAdminPathways).mockReturnValue(q({ items: [], pagination: null }) as never)
    savePathway.mockResolvedValue({})
    const wrapper = mount(AdminCatalogue)
    await wrapper.find('[data-test="new-pathway"]').trigger('click')
    await wrapper.find('#pathway-code').setValue('ITSUP')
    await wrapper.find('#pathway-name').setValue('IT Support')
    await wrapper.find('#pathway-cpu').setValue('Intel Core i5')
    await wrapper.find('#pathway-ram').setValue(8)
    await wrapper.find('#pathway-storage').setValue(256)
    await wrapper.find('#pathway-validation').setValue(true)
    await wrapper.find('[data-test="pathway-form"]').trigger('submit')
    await flushPromises()
    expect(savePathway).toHaveBeenCalledWith(
      expect.objectContaining({
        programme_key: 'prg_1',
        code: 'ITSUP',
        requires_equipment_validation: true,
        equipment_requirements: {
          min_cpu: 'Intel Core i5',
          min_ram_gb: 8,
          min_storage_gb: 256,
          notes: null,
        },
      }),
    )
  })
})

describe('AdminAttestations', () => {
  it('revokes an issued certificate with a reason', async () => {
    vi.mocked(ops.useAdminCertificates).mockReturnValue(
      q({
        items: [
          {
            key: 'cert_1',
            status: 'issued',
            holder: { key: 'u1', name: 'Aya', email: 'a@x.ci' },
            course: { key: 'c1', title: 'IT Support' },
            revocation_reason: null,
            issued_at: '2026-11-22T10:00:00Z',
            revoked_at: null,
          },
        ],
        pagination: null,
      }) as never,
    )
    vi.mocked(ops.useAdminExternalCertifications).mockReturnValue(
      q({ items: [], pagination: null }) as never,
    )
    revoke.mockResolvedValue({})
    const wrapper = mount(AdminAttestations)
    await wrapper.find('[data-test="revoke"]').trigger('click')
    await wrapper.find('#revoke-reason-cert_1').setValue('Erreur de délivrance')
    await wrapper.find('[data-test="revoke-form"]').trigger('submit')
    await flushPromises()
    expect(revoke).toHaveBeenCalledWith({ key: 'cert_1', reason: 'Erreur de délivrance' })
  })
})

describe('AdminAudit', () => {
  it('lists audit entries with pagination and switches to sign-in events', async () => {
    vi.mocked(ops.useAuditLogs).mockReturnValue(
      q({
        items: [
          {
            key: 'aud_1',
            action: 'course.published',
            actor: { key: 'u1', name: 'Demo Admin' },
            target_type: 'course',
            target_key: 'crs_1',
            metadata: null,
            ip: '127.0.0.1',
            created_at: '2026-11-22T10:00:00Z',
          },
        ],
        pagination: { current_page: 1, per_page: 50, from: 1, to: 1, total: 120, last_page: 3 },
      }) as never,
    )
    vi.mocked(ops.useAuthEvents).mockReturnValue(q({ items: [], pagination: null }) as never)
    const wrapper = mount(AdminAudit)
    expect(wrapper.find('[data-test="audit-row"]').text()).toContain('course.published')
    expect(wrapper.find('nav[aria-label="Pagination"]').text()).toContain('Page 1 sur 3')
    await wrapper.find('[data-test="tab-auth"]').trigger('click')
    expect(wrapper.text()).toContain('Aucun événement')
  })
})
