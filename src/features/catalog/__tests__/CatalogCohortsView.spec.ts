import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import PathwayDetailView from '../views/PathwayDetailView.vue'
import CatalogView from '../views/CatalogView.vue'
import * as useCatalogModule from '../composables/useCatalog'

const mockPush = vi.fn()

vi.mock('vue-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('vue-router')>()
  return {
    ...actual,
    useRoute: vi.fn(() => ({
      params: { key: 'dev-web' },
    })),
    useRouter: vi.fn(() => ({
      push: mockPush,
    })),
    RouterLink: {
      template: '<a><slot /></a>',
    },
  }
})

vi.mock('@/stores/auth', () => ({
  useAuthStore: vi.fn(() => ({
    token: null,
    user: null,
    hasRole: () => false,
  })),
}))

vi.mock('@/features/admissions/composables/useLearnerApplications', () => ({
  useLearnerApplications: vi.fn(() => ({
    data: ref([]),
    isLoading: ref(false),
  })),
}))

vi.mock('../composables/useCatalog', () => ({
  usePathway: vi.fn(),
  usePathwayCohorts: vi.fn(),
  usePathwayCourses: vi.fn(),
  usePathways: vi.fn(),
}))

describe('PathwayDetailView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  function mountWith(cohorts: unknown[]) {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref({ id: 1, key: 'dev-web', code: 'DW', name: 'Développeur Web', slug: 'dw' }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)
    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(cohorts),
      isPending: ref(false),
    } as never)
    vi.mocked(useCatalogModule.usePathwayCourses).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
    } as never)
    return mount(PathwayDetailView, { global: { stubs: { RouterLink: true } } })
  }

  const openCohort = {
    id: 10,
    key: 'c1',
    code: 'DW-P1',
    name: 'Promo Automne',
    session: '2026-A',
    status: 'open',
    capacity: 100,
    enrolled_count: 75,
    available_seats: 25,
    is_full: false,
    available: true,
  }

  it('lets the learner apply to the pathway without showing any session', () => {
    const wrapper = mountWith([openCohort])
    expect(wrapper.findAll('[data-testid="btn-apply-pathway"]')).toHaveLength(1)
    expect(wrapper.find('[data-testid="seats-available"]').exists()).toBe(true)
    // FIFO : ni nom de session, ni code, ni places, ni dates
    expect(wrapper.text()).not.toContain('Promo Automne')
    expect(wrapper.text()).not.toContain('DW-P1')
    expect(wrapper.text()).not.toContain('places disponibles')
    expect(wrapper.text()).not.toContain('Choisissez votre session')
  })

  it('announces the waiting list when no session has a free seat', () => {
    const wrapper = mountWith([{ ...openCohort, available_seats: 0, is_full: true }])
    expect(wrapper.find('[data-testid="waitlist-note"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="btn-apply-pathway"]').exists()).toBe(true)
  })

  it('navigates to login with redirect when unauthenticated user clicks CTA', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref({
        id: 1,
        key: 'dev-web',
        code: 'DW-01',
        name: 'Développeur Web',
        slug: 'developpeur-web',
        description: 'Formation intensive',
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 10,
          key: 'dw-promo-1',
          code: 'DW-P1',
          name: 'Promo Automne',
          session: '2026-A',
          capacity: 100,
          enrolled_count: 10,
          available_seats: 90,
          is_full: false,
          available: true,
        },
      ]),
      isPending: ref(false),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCourses).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
    } as never)

    const wrapper = mount(PathwayDetailView, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    const button = wrapper.find('button.app-action-primary')
    await button.trigger('click')

    expect(mockPush).toHaveBeenCalledWith(
      '/connexion?redirect=' + encodeURIComponent('/candidature?pathway=dev-web'),
    )
  })
})

describe('PathwayDetailView — staff', () => {
  it('replaces the apply button for a non-learner account', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    vi.mocked(useAuthStore).mockReturnValue({
      token: 'tok',
      user: { roles: ['formateur'] },
      hasRole: (role: string) => role === 'formateur',
    } as never)
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref({ id: 1, key: 'dev-web', code: 'DW', name: 'Développeur Web', slug: 'dw' }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)
    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 10,
          key: 'c1',
          code: 'C1',
          name: 'Promo',
          capacity: 100,
          enrolled_count: 0,
          available_seats: 100,
          is_full: false,
          available: true,
        },
      ]),
      isPending: ref(false),
    } as never)
    vi.mocked(useCatalogModule.usePathwayCourses).mockReturnValue({
      data: ref({ items: [] }),
      isPending: ref(false),
    } as never)

    const wrapper = mount(PathwayDetailView, { global: { stubs: { RouterLink: true } } })

    expect(wrapper.find('[data-testid="apply-learners-only"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="staff-cannot-apply"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Participer à cette formation')
  })
})

describe('CatalogView', () => {
  it('displays open cohorts count badge on pathway card', () => {
    vi.mocked(useCatalogModule.usePathways).mockReturnValue({
      data: ref({
        items: [
          {
            id: 1,
            key: 'dev-web',
            code: 'DW-01',
            name: 'Développeur Web',
            slug: 'developpeur-web',
            description: 'Formation certifiante',
            courses_count: 4,
            open_cohorts_count: 2,
            cohorts_count: 3,
            position: 1,
            is_active: true,
          },
        ],
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    const wrapper = mount(CatalogView, {
      global: {
        stubs: {
          RouterLink: true,
        },
      },
    })

    expect(wrapper.text()).toContain('Places disponibles')
  })
})
