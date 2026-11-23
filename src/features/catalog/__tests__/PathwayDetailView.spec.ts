import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import PathwayDetailView from '../views/PathwayDetailView.vue'
import * as useCatalogModule from '../composables/useCatalog'
import * as authStoreModule from '@/stores/auth'
import * as useLearnerApplicationsModule from '@/features/admissions/composables/useLearnerApplications'

const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    params: { key: 'dev-web' },
  })),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    token: null,
  })),
}))

vi.mock('@/features/admissions/composables/useLearnerApplications', () => ({
  useLearnerApplications: vi.fn(() => ({
    data: ref({ items: [] }),
    isPending: ref(false),
  })),
}))

vi.mock('../composables/useCatalog', () => ({
  usePathway: vi.fn(),
  usePathwayCohorts: vi.fn(),
  usePathwayCourses: vi.fn(),
  usePathways: vi.fn(),
}))

describe('PathwayDetailView - Offline Scheduling and Cohorts Display', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref({
        id: 1,
        key: 'dev-web',
        code: 'DW-01',
        name: 'Développeur Web',
        slug: 'developpeur-web',
        description: 'Formation intensive',
        equipment_requirements: null,
        requires_equipment_validation: false,
        icon: null,
        position: 1,
        is_active: true,
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCourses).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
    } as never)
  })

  it('does not render offline dates badge when cohort has no offline_starts_at', () => {
    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 12,
          key: 'dw-2026-c3',
          code: 'DW-2026-C3',
          name: 'Développeur Web - Cohorte 3',
          capacity: 30,
          enrolled_count: 2,
          available_seats: 28,
          is_full: false,
          starts_at: '2026-04-01',
          ends_at: '2026-09-30',
          offline_starts_at: null,
          offline_ends_at: null,
          status: 'open',
          available: true,
        },
      ]),
      isPending: ref(false),
    } as never)

    const wrapper = mount(PathwayDetailView, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const offlineBadge = wrapper.find('[data-testid="cohort-offline-dates"]')
    expect(offlineBadge.exists()).toBe(false)
  })

  it('locks and replaces "Participer à cette formation" button when learner already has an active formation', () => {
    vi.mocked(authStoreModule.useAuthStore).mockReturnValue({
      token: 'jwt-learner',
    } as never)

    vi.mocked(useLearnerApplicationsModule.useLearnerApplications).mockReturnValue({
      data: ref({
        items: [
          {
            id: 99,
            key: 'app-99',
            status: 'in_review',
            motivation: null,
            payload: null,
            pathway: {
              id: 5,
              key: 'cyber-sec',
              code: 'CS-01',
              name: 'Cybersécurité',
              slug: 'cybersecurite',
            },
          },
        ],
      }),
      isPending: ref(false),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 10,
          key: 'dw-2026-c1',
          code: 'DW-2026-C1',
          name: 'Développeur Web - Cohorte 1',
          capacity: 30,
          enrolled_count: 5,
          available_seats: 25,
          is_full: false,
          starts_at: '2026-03-01',
          ends_at: '2026-08-31',
          status: 'open',
          available: true,
        },
      ]),
      isPending: ref(false),
    } as never)

    const wrapper = mount(PathwayDetailView, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const lockedBtn = wrapper.find('[data-testid="btn-already-enrolled"]')
    expect(lockedBtn.exists()).toBe(true)
    expect(lockedBtn.attributes('disabled')).toBeDefined()
    expect(lockedBtn.text()).toContain('Vous suivez déjà Cybersécurité')

    const candidaturesLink = wrapper.find('[data-testid="link-to-candidatures"]')
    expect(candidaturesLink.exists()).toBe(true)

    expect(wrapper.text()).not.toContain('Participer à cette formation')
  })
})
