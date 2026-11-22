import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LearnerDashboard from '../views/LearnerDashboard.vue'
import * as useEnrollmentsModule from '../composables/useEnrollments'
import * as useLearnerAttendanceModule from '../composables/useLearnerAttendance'
import * as useLearnerApplicationsModule from '@/features/admissions/composables/useLearnerApplications'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({})),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

vi.mock('../composables/useEnrollments', () => ({
  useEnrollments: vi.fn(),
}))

vi.mock('../composables/useLearnerAttendance', () => ({
  useLearnerAttendance: vi.fn(),
}))

vi.mock('@/features/admissions/composables/useLearnerApplications', () => ({
  useLearnerApplications: vi.fn(),
}))

describe('LearnerDashboard - Section Mon assiduité', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useEnrollmentsModule.useEnrollments).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useLearnerApplicationsModule.useLearnerApplications).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)
  })

  it('renders the attendance section with empty state when learner has no attendance sessions', () => {
    vi.mocked(useLearnerAttendanceModule.useLearnerAttendance).mockReturnValue({
      data: ref({
        summary: {
          total: 0,
          present: 0,
          late: 0,
          absent: 0,
          excused: 0,
          rate: 0,
        },
        items: [],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    const wrapper = mount(LearnerDashboard, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    const section = wrapper.find('[data-test="learner-attendance-section"]')
    expect(section.exists()).toBe(true)
    expect(section.text()).toContain('Mon assiduité')

    const emptyState = wrapper.find('[data-test="attendance-empty-state"]')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain("Aucune séance d'émargement enregistrée pour le moment")
    expect(wrapper.find('[data-test="attendance-summary-cards"]').exists()).toBe(false)
  })

  it('renders the attendance summary and sessions list when learner has attendance records', () => {
    vi.mocked(useLearnerAttendanceModule.useLearnerAttendance).mockReturnValue({
      data: ref({
        summary: {
          total: 3,
          present: 2,
          late: 1,
          absent: 0,
          excused: 0,
          rate: 100,
        },
        items: [
          {
            key: 'att_01',
            status: 'present',
            status_label: 'Présent',
            note: null,
            session: {
              key: 'ses_01',
              title: 'Atelier Câblage',
              date: '2026-11-20',
              starts_at_time: '09:00',
              ends_at_time: '12:00',
              cohort_name: 'Cohorte Cyber 2026-A',
            },
          },
          {
            key: 'att_02',
            status: 'late',
            status_label: 'En retard',
            note: 'Retard de 10 min',
            session: {
              key: 'ses_02',
              title: 'Sécurité Réseau',
              date: '2026-11-21',
              starts_at_time: '14:00',
              ends_at_time: '17:00',
              cohort_name: 'Cohorte Cyber 2026-A',
            },
          },
        ],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    const wrapper = mount(LearnerDashboard, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    const section = wrapper.find('[data-test="learner-attendance-section"]')
    expect(section.exists()).toBe(true)

    // Rate badge in header
    const rateBadge = wrapper.find('[data-test="attendance-rate-badge"]')
    expect(rateBadge.exists()).toBe(true)
    expect(rateBadge.text()).toContain("Taux d'assiduité : 100%")

    // KPI cards
    const summaryCards = wrapper.find('[data-test="attendance-summary-cards"]')
    expect(summaryCards.exists()).toBe(true)
    expect(wrapper.find('[data-test="summary-total"]').text()).toBe('3')
    expect(wrapper.find('[data-test="summary-present"]').text()).toBe('2')
    expect(wrapper.find('[data-test="summary-late"]').text()).toBe('1')
    expect(wrapper.find('[data-test="summary-absent"]').text()).toBe('0')
    expect(wrapper.find('[data-test="summary-excused"]').text()).toBe('0')

    // Session items
    const items = wrapper.findAll('[data-test="attendance-item"]')
    expect(items).toHaveLength(2)

    // First session
    const item0 = items[0]!
    expect(item0.text()).toContain('Atelier Câblage')
    expect(item0.text()).toContain('Cohorte Cyber 2026-A')
    expect(item0.text()).toContain('09:00 - 12:00')
    const badge0 = item0.find('[data-test="attendance-status-badge"]')
    expect(badge0.text()).toBe('Présent')
    expect(badge0.classes()).toContain('text-emerald-700')

    // Second session
    const item1 = items[1]!
    expect(item1.text()).toContain('Sécurité Réseau')
    expect(item1.text()).toContain('14:00 - 17:00')
    expect(item1.text()).toContain('Retard de 10 min')
    const badge1 = item1.find('[data-test="attendance-status-badge"]')
    expect(badge1.text()).toBe('En retard')
    expect(badge1.classes()).toContain('text-amber-700')
  })

  it('renders correctly semantic badges for absent and excused statuses', () => {
    vi.mocked(useLearnerAttendanceModule.useLearnerAttendance).mockReturnValue({
      data: ref({
        summary: {
          total: 2,
          present: 0,
          late: 0,
          absent: 1,
          excused: 1,
          rate: 0,
        },
        items: [
          {
            key: 'att_03',
            status: 'absent',
            status_label: 'Absent',
            note: null,
            session: {
              key: 'ses_03',
              title: 'Cryptographie',
              date: '2026-11-22',
              starts_at_time: '10:00',
              ends_at_time: '13:00',
              cohort_name: 'Cohorte Cyber 2026-A',
            },
          },
          {
            key: 'att_04',
            status: 'excused',
            status_label: 'Excusé',
            note: 'Certificat médical',
            session: {
              key: 'ses_04',
              title: 'Audit Système',
              date: '2026-11-23',
              starts_at_time: '09:00',
              ends_at_time: '12:00',
              cohort_name: 'Cohorte Cyber 2026-A',
            },
          },
        ],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    const wrapper = mount(LearnerDashboard, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    const items = wrapper.findAll('[data-test="attendance-item"]')
    expect(items).toHaveLength(2)

    const absentBadge = items[0]!.find('[data-test="attendance-status-badge"]')
    expect(absentBadge.text()).toBe('Absent')
    expect(absentBadge.classes()).toContain('text-red-700')

    const excusedBadge = items[1]!.find('[data-test="attendance-status-badge"]')
    expect(excusedBadge.text()).toBe('Excusé')
    expect(excusedBadge.classes()).toContain('text-blue-700')
  })
})
