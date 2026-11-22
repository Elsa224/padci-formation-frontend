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

  it('displays available seats and total capacity for each cohort', () => {
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

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 10,
          key: 'dw-promo-1',
          code: 'DW-P1',
          name: 'Promo Automne',
          session: '2026-A',
          capacity: 100,
          enrolled_count: 75,
          available_seats: 25,
          is_full: false,
          starts_at: '2026-10-01',
          ends_at: '2027-04-01',
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

    // Assert visual indicator contains "25 places disponibles" and "100"
    expect(wrapper.text()).toContain('25 places disponibles')
    expect(wrapper.text()).toContain('100')
    expect(wrapper.text()).toContain('75 / 100 réservées')
    expect(wrapper.text()).toContain('Ouverte')
    expect(wrapper.text()).toContain('75% remplie')
    expect(wrapper.text()).toContain('Participer à cette formation')

    const progressbar = wrapper.find('[role="progressbar"]')
    expect(progressbar.exists()).toBe(true)
    expect(progressbar.attributes('aria-valuenow')).toBe('75')
    expect(progressbar.attributes('aria-valuemax')).toBe('100')
  })

  it('displays full status and distinct styling when cohort is full', () => {
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

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 11,
          key: 'dw-promo-full',
          code: 'DW-PFULL',
          name: 'Promo Complète',
          session: '2026-B',
          capacity: 100,
          enrolled_count: 100,
          available_seats: 0,
          is_full: true,
          starts_at: '2026-11-01',
          ends_at: '2027-05-01',
          available: false,
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

    expect(wrapper.text()).toContain('Complète')
    expect(wrapper.text()).toContain('0 place disponible')
    expect(wrapper.text()).toContain('100 / 100 réservées')
    expect(wrapper.text()).toContain('100% remplie')

    const article = wrapper.find('article')
    expect(article.classes()).toContain('border-amber-200')

    const progressFill = wrapper.find('[role="progressbar"] div')
    expect(progressFill.classes()).toContain('bg-amber-500')

    const button = wrapper.find('button')
    expect(button.classes()).toContain('app-action-secondary')
    expect(button.classes()).not.toContain('app-action-primary')
  })

  it('renders full status and secondary action when cohort is open but full (status: open, is_full: true)', () => {
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
          id: 13,
          key: 'dw-promo-open-full',
          code: 'DW-POPFULL',
          name: 'Promo Ouverte Mais Pleine',
          session: '2026-C',
          capacity: 50,
          enrolled_count: 50,
          available_seats: 0,
          is_full: true,
          status: 'open',
          starts_at: '2026-12-01',
          ends_at: '2027-06-01',
          available: false,
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

    const statusBadge = wrapper.find('article span.rounded-full.border')
    expect(statusBadge.text()).toBe('Complète')
    expect(wrapper.text()).toContain('0 place disponible')
    expect(wrapper.text()).toContain('50 / 50 réservées')

    const article = wrapper.find('article')
    expect(article.classes()).toContain('border-amber-200')

    const progressFill = wrapper.find('[role="progressbar"] div')
    expect(progressFill.classes()).toContain('bg-amber-500')

    // Must use app-action-secondary for full cohort even if status === 'open'
    const button = wrapper.find('button')
    expect(button.classes()).toContain('app-action-secondary')
    expect(wrapper.find('button.app-action-primary').exists()).toBe(false)
  })

  it('displays planned status when cohort is not yet open', () => {
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

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 12,
          key: 'dw-promo-planned',
          code: 'DW-PPLAN',
          name: 'Promo Planifiée',
          session: '2027-A',
          capacity: 80,
          enrolled_count: 0,
          available_seats: 80,
          is_full: false,
          status: 'planned',
          starts_at: '2027-06-01',
          ends_at: '2027-12-01',
          available: false,
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

    expect(wrapper.text()).toContain('Planifiée')
    expect(wrapper.text()).toContain('80 places disponibles')
    expect(wrapper.text()).toContain('Inscriptions fermées')
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

    expect(wrapper.text()).toContain('2 session(s) ouverte(s)')
  })
})
