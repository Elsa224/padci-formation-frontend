import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import LearnerDashboard from '../views/LearnerDashboard.vue'
import MesCandidaturesView from '@/features/admissions/views/MesCandidaturesView.vue'
import * as useEnrollmentsModule from '../composables/useEnrollments'
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

vi.mock('@/features/admissions/composables/useLearnerApplications', () => ({
  useLearnerApplications: vi.fn(),
  useRespondToEquipmentReview: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: ref(false),
  })),
  useWithdrawApplication: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: ref(false),
  })),
}))

describe('LearnerDashboard Cohort Status & Standby', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('displays standby status badge and reassuring message when application is in standby', () => {
    vi.mocked(useEnrollmentsModule.useEnrollments).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    vi.mocked(useLearnerApplicationsModule.useLearnerApplications).mockReturnValue({
      data: ref({
        items: [
          {
            id: 1,
            key: 'app-standby-1',
            status: 'standby',
            pathway: {
              id: 10,
              key: 'dev-web',
              code: 'DW-01',
              name: 'Développeur Web',
              slug: 'developpeur-web',
            },
            cohort: null,
            created_at: '2026-11-20T10:00:00Z',
          },
        ],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    const wrapper = mount(LearnerDashboard, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    const standbyBanner = wrapper.find('[data-testid="standby-banner"]')
    expect(standbyBanner.exists()).toBe(true)
    expect(standbyBanner.text()).toContain('Dossier validé avec succès !')
    expect(standbyBanner.text()).toContain('liste prioritaire')
    expect(standbyBanner.text()).toContain('Standby')
    expect(standbyBanner.text()).toContain(
      "serez automatiquement affecté dès l'ouverture de la prochaine session",
    )
  })

  it('displays prominent status card and notice when user is assigned to a cohort via application', () => {
    vi.mocked(useEnrollmentsModule.useEnrollments).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    vi.mocked(useLearnerApplicationsModule.useLearnerApplications).mockReturnValue({
      data: ref({
        items: [
          {
            id: 2,
            key: 'app-accepted-1',
            status: 'accepted',
            pathway: {
              id: 10,
              key: 'dev-web',
              code: 'DW-01',
              name: 'Développeur Web',
              slug: 'developpeur-web',
            },
            cohort: {
              id: 101,
              key: 'dw-promo-2026',
              code: 'DW-P1',
              name: 'Promo Automne 2026',
              session: '2026-A',
              starts_at: '2026-10-01',
              ends_at: '2027-04-01',
              status: 'open',
            },
            created_at: '2026-11-20T10:00:00Z',
          },
        ],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    const wrapper = mount(LearnerDashboard, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    const cohortCard = wrapper.find('[data-testid="cohort-status-card"]')
    expect(cohortCard.exists()).toBe(true)
    expect(cohortCard.text()).toContain('Inscrit à la Cohorte Promo Automne 2026')
    expect(cohortCard.text()).toContain('Rentrée le')
    expect(cohortCard.text()).toContain('1 oct. 2026')
    expect(cohortCard.text()).toContain(
      "Les modules pédagogiques s'activeront à l'ouverture de votre session.",
    )
  })

  it('displays cohort status card when assigned via active enrollment', () => {
    vi.mocked(useEnrollmentsModule.useEnrollments).mockReturnValue({
      data: ref({
        items: [
          {
            id: 5,
            key: 'enr-1',
            status: 'active',
            cohort: {
              id: 102,
              key: 'dw-promo-winter',
              code: 'DW-W1',
              name: 'Promo Hiver 2026',
              session: '2026-B',
              status: 'open',
              starts_at: '2026-12-01',
            },
            course: {
              id: 201,
              key: 'course-html-css',
              slug: 'html-css',
              title: 'Fondamentaux HTML & CSS',
              status: 'published',
            },
            created_at: '2026-11-20T10:00:00Z',
          },
        ],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    vi.mocked(useLearnerApplicationsModule.useLearnerApplications).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    const wrapper = mount(LearnerDashboard, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    const cohortCard = wrapper.find('[data-testid="cohort-status-card"]')
    expect(cohortCard.exists()).toBe(true)
    expect(cohortCard.text()).toContain('Inscrit à la Cohorte Promo Hiver 2026')
    expect(cohortCard.text()).toContain('Rentrée le')
    expect(cohortCard.text()).toContain(
      "Les modules pédagogiques s'activeront à l'ouverture de votre session.",
    )
  })
})

describe('MesCandidaturesView Standby Status Support', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders standby status badge and explanation for standby applications', () => {
    vi.mocked(useLearnerApplicationsModule.useLearnerApplications).mockReturnValue({
      data: ref({
        items: [
          {
            id: 3,
            key: 'app-standby-2',
            status: 'standby',
            pathway: {
              id: 10,
              key: 'dev-web',
              code: 'DW-01',
              name: 'Développeur Web',
              slug: 'developpeur-web',
            },
            cohort: null,
            equipment_review: null,
            created_at: '2026-11-20T10:00:00Z',
            submitted_at: '2026-11-20T10:00:00Z',
          },
        ],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    const wrapper = mount(MesCandidaturesView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    expect(wrapper.text()).toContain('En attente de cohorte (Standby)')
    expect(wrapper.text()).toContain('Dossier validé avec succès !')
    expect(wrapper.text()).toContain('liste prioritaire (Standby)')
    expect(wrapper.text()).toContain(
      "automatiquement affecté dès l'ouverture de la prochaine session",
    )
  })
})
