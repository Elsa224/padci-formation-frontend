import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import PathwayDetailView from '../views/PathwayDetailView.vue'
import * as useCatalogModule from '../composables/useCatalog'

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

  it('renders offline date range badge when both offline_starts_at and offline_ends_at are provided', () => {
    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 10,
          key: 'dw-2026-c1',
          code: 'DW-2026-C1',
          name: 'Développeur Web — Cohorte 1',
          capacity: 30,
          enrolled_count: 5,
          available_seats: 25,
          is_full: false,
          starts_at: '2026-03-01',
          ends_at: '2026-08-31',
          offline_starts_at: '2026-05-10',
          offline_ends_at: '2026-05-24',
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
    expect(offlineBadge.exists()).toBe(true)
    expect(offlineBadge.text()).toContain('Ateliers présentiels : du')
    expect(offlineBadge.text()).toContain('au')
    expect(offlineBadge.text()).toContain('2026')
  })

  it('renders offline start date badge when only offline_starts_at is provided', () => {
    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 11,
          key: 'dw-2026-c2',
          code: 'DW-2026-C2',
          name: 'Développeur Web — Cohorte 2',
          capacity: 30,
          enrolled_count: 0,
          available_seats: 30,
          is_full: false,
          starts_at: '2026-09-01',
          ends_at: '2027-02-28',
          offline_starts_at: '2026-11-15',
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
    expect(offlineBadge.exists()).toBe(true)
    expect(offlineBadge.text()).toContain('Ateliers présentiels : dès le')
    expect(offlineBadge.text()).not.toContain('au')
    expect(offlineBadge.text()).toContain('2026')
  })

  it('does not render offline dates badge when cohort has no offline_starts_at', () => {
    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref([
        {
          id: 12,
          key: 'dw-2026-c3',
          code: 'DW-2026-C3',
          name: 'Développeur Web — Cohorte 3',
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
})
