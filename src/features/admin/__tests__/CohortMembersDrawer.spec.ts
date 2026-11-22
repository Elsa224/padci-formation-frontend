import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { computed, ref } from 'vue'
import AdminCohortes from '../views/AdminCohortes.vue'
import * as useCohortsModule from '../composables/useCohorts'
import * as useCatalogPathwaysModule from '@/features/public/composables/useCatalogPathways'
import { useCohortMembers } from '../composables/useCohortMembers'
import { http } from '@/api/http'

vi.mock('../composables/useCohorts', async (importOriginal) => {
  const actual = await importOriginal<typeof useCohortsModule>()
  return {
    ...actual,
    useCohorts: vi.fn(),
    useCreateCohort: vi.fn(() => ({
      mutateAsync: vi.fn(),
      mutate: vi.fn(),
      isPending: ref(false),
    })),
    useCohortMembers: vi.fn(),
  }
})

vi.mock('@/features/public/composables/useCatalogPathways', () => ({
  useCatalogPathways: vi.fn(),
}))

vi.mock('@/api/http', () => ({
  http: {
    get: vi.fn(),
  },
  apiMeta: vi.fn(),
}))

describe('CohortMembersDrawer in AdminCohortes', () => {
  const mockPathways = [
    {
      id: 1,
      key: 'dev-web',
      code: 'DW',
      name: 'Développeur Web',
      slug: 'dev-web',
    },
  ]

  const mockCohorts = [
    {
      id: 1,
      key: 'cohort-dw-1',
      code: 'DW-2026-C1',
      name: 'Développeur Web — Cohorte 1',
      session: 'Cohorte 1',
      capacity: 30,
      enrolled_count: 2,
      available_seats: 28,
      starts_at: '2026-06-01',
      ends_at: '2026-12-31',
      status: 'open' as const,
      created_at: '2026-01-01T00:00:00Z',
      pathway: { id: 1, key: 'dev-web', code: 'DW', name: 'Développeur Web' },
    },
    {
      id: 2,
      key: 'cohort-empty',
      code: 'DW-2026-C2',
      name: 'Développeur Web — Cohorte 2',
      session: 'Cohorte 2',
      capacity: 50,
      enrolled_count: 0,
      available_seats: 50,
      starts_at: '2026-07-01',
      ends_at: '2026-12-31',
      status: 'planned' as const,
      created_at: '2026-01-02T00:00:00Z',
      pathway: { id: 1, key: 'dev-web', code: 'DW', name: 'Développeur Web' },
    },
  ]

  const mockMembers = [
    {
      key: 'usr-1',
      name: 'Alice Martin',
      email: 'alice.martin@example.com',
      status: 'active',
      joined_at: '2026-05-10T09:30:00Z',
      progress_rate: 0.75,
      completed_chapters_count: 6,
      total_chapters_count: 8,
      attendance_rate: 1.0,
    },
    {
      key: 'usr-2',
      name: 'Bob Durand',
      email: 'bob.durand@example.com',
      status: 'enrolled',
      joined_at: '2026-05-12T14:00:00Z',
      progress_rate: 0.25,
      completed_chapters_count: 2,
      total_chapters_count: 8,
      attendance_rate: 0.5,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(useCatalogPathwaysModule.useCatalogPathways).mockReturnValue({
      data: ref(mockPathways),
      isPending: ref(false),
    } as any)

    vi.mocked(useCohortsModule.useCohorts).mockReturnValue({
      data: ref({ items: mockCohorts, pagination: null }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as any)

    vi.mocked(useCohortsModule.useCohortMembers).mockImplementation((cohortKey: any) => {
      const data = computed(() => {
        const keyVal =
          typeof cohortKey === 'function' ? cohortKey() : (cohortKey?.value ?? cohortKey)
        if (keyVal === 'cohort-dw-1') {
          return { items: mockMembers, pagination: null }
        }
        return { items: [], pagination: null }
      })
      return {
        data,
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as any
    })
  })

  it('renders "Voir les apprenants (X)" button on each cohort card and opens drawer on click', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    const viewButtons = wrapper.findAll('[data-testid="btn-view-cohort-members"]')
    expect(viewButtons.length).toBe(2)
    expect(viewButtons[0]!.text()).toContain('Voir les apprenants (2)')
    expect(viewButtons[1]!.text()).toContain('Voir les apprenants (0)')

    // Drawer is closed initially
    expect(wrapper.find('[data-testid="cohort-members-drawer"]').exists()).toBe(false)

    // Click to open drawer for cohort 1
    await viewButtons[0]!.trigger('click')
    await flushPromises()

    const drawer = wrapper.find('[data-testid="cohort-members-drawer"]')
    expect(drawer.exists()).toBe(true)

    // Header displays cohort name & code
    expect(drawer.text()).toContain('Développeur Web — Cohorte 1')
    expect(drawer.text()).toContain('DW-2026-C1')

    // Quick stats banner
    expect(drawer.text()).toContain('2 / 30')
    expect(drawer.text()).toContain('28 places')
  })

  it('renders learner members list with avatar initials, name, email, status, and joined date', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    const viewButtons = wrapper.findAll('[data-testid="btn-view-cohort-members"]')
    await viewButtons[0]!.trigger('click')
    await flushPromises()

    const rows = wrapper.findAll('[data-testid="cohort-member-row"]')
    expect(rows.length).toBe(2)

    // Member 1: Alice Martin
    expect(rows[0]!.find('[data-testid="cohort-member-name"]').text()).toBe('Alice Martin')
    expect(rows[0]!.find('[data-testid="cohort-member-email"]').text()).toBe(
      'alice.martin@example.com',
    )
    expect(rows[0]!.find('[data-testid="cohort-member-status"]').text()).toBe('Actif')
    expect(rows[0]!.find('[data-testid="cohort-member-progress"]').text()).toContain('Cours : 75%')
    expect(rows[0]!.find('[data-testid="cohort-member-attendance"]').text()).toContain(
      'Assiduité 100%',
    )
    expect(rows[0]!.find('[data-testid="cohort-member-joined"]').text()).toContain(
      'Inscrit le 10/05/2026',
    )
    expect(rows[0]!.text()).toContain('AM')

    // Member 2: Bob Durand
    expect(rows[1]!.find('[data-testid="cohort-member-name"]').text()).toBe('Bob Durand')
    expect(rows[1]!.find('[data-testid="cohort-member-email"]').text()).toBe(
      'bob.durand@example.com',
    )
    expect(rows[1]!.find('[data-testid="cohort-member-status"]').text()).toBe('Inscrit')
    expect(rows[1]!.find('[data-testid="cohort-member-progress"]').text()).toContain('Cours : 25%')
    expect(rows[1]!.find('[data-testid="cohort-member-attendance"]').text()).toContain(
      'Assiduité 50%',
    )
    expect(rows[1]!.find('[data-testid="cohort-member-joined"]').text()).toContain(
      'Inscrit le 12/05/2026',
    )
    expect(rows[1]!.text()).toContain('BD')
  })

  it('filters learner members by search query in the drawer and displays empty state when no match', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    const viewButtons = wrapper.findAll('[data-testid="btn-view-cohort-members"]')
    await viewButtons[0]!.trigger('click')
    await flushPromises()

    const searchInput = wrapper.find<HTMLInputElement>('[data-testid="cohort-members-search"]')
    expect(searchInput.exists()).toBe(true)

    // Search for "Alice"
    await searchInput.setValue('Alice')
    await flushPromises()

    let rows = wrapper.findAll('[data-testid="cohort-member-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0]!.text()).toContain('Alice Martin')
    expect(rows[0]!.text()).not.toContain('Bob Durand')

    // Search by email "bob.durand"
    await searchInput.setValue('bob.durand')
    await flushPromises()

    rows = wrapper.findAll('[data-testid="cohort-member-row"]')
    expect(rows.length).toBe(1)
    expect(rows[0]!.text()).toContain('Bob Durand')

    // Search for non-matching query
    await searchInput.setValue('Inconnu')
    await flushPromises()

    rows = wrapper.findAll('[data-testid="cohort-member-row"]')
    expect(rows.length).toBe(0)

    const emptyState = wrapper.find('[data-testid="cohort-members-empty"]')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('Aucun apprenant dans cette cohorte pour le moment')
  })

  it('closes the drawer when clicking the close button', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    await wrapper.findAll('[data-testid="btn-view-cohort-members"]')[0]!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="cohort-members-drawer"]').exists()).toBe(true)

    const closeButton = wrapper.find('[data-testid="btn-close-members-drawer"]')
    expect(closeButton.exists()).toBe(true)
    await closeButton.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="cohort-members-drawer"]').exists()).toBe(false)
  })

  it('closes the drawer on backdrop click and on Escape key', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    // Open drawer
    await wrapper.findAll('[data-testid="btn-view-cohort-members"]')[0]!.trigger('click')
    await flushPromises()

    const drawerBackdrop = wrapper.find('[data-testid="cohort-members-drawer"]')
    expect(drawerBackdrop.exists()).toBe(true)

    // Trigger click on backdrop (.self)
    await drawerBackdrop.trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="cohort-members-drawer"]').exists()).toBe(false)

    // Re-open drawer and press Escape key
    await wrapper.findAll('[data-testid="btn-view-cohort-members"]')[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="cohort-members-drawer"]').exists()).toBe(true)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(wrapper.find('[data-testid="cohort-members-drawer"]').exists()).toBe(false)
  })

  it('shows empty state for a cohort with 0 members', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    const viewButtons = wrapper.findAll('[data-testid="btn-view-cohort-members"]')
    // Open cohort 2 (empty)
    await viewButtons[1]!.trigger('click')
    await flushPromises()

    const emptyState = wrapper.find('[data-testid="cohort-members-empty"]')
    expect(emptyState.exists()).toBe(true)
    expect(emptyState.text()).toContain('Aucun apprenant dans cette cohorte pour le moment')
    expect(wrapper.findAll('[data-testid="cohort-member-row"]').length).toBe(0)
  })
})

describe('useCohortMembers composable', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls GET /admin/cohorts/{cohort}/members with query params when enabled', async () => {
    const { QueryClient, VueQueryPlugin } = await import('@tanstack/vue-query')
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    vi.mocked(http.get).mockResolvedValueOnce({
      data: [
        {
          key: 'usr-1',
          name: 'Alice Martin',
          email: 'alice.martin@example.com',
          status: 'active',
          joined_at: '2026-05-10T09:30:00Z',
        },
      ],
    } as any)

    const TestComponent = {
      setup() {
        const filters = ref({ q: 'alice', status: 'active', page: 1 })
        useCohortMembers('cohort-123', filters)
        return () => null
      },
    }

    mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })

    await flushPromises()

    expect(http.get).toHaveBeenCalledWith('/admin/cohorts/cohort-123/members', {
      params: {
        q: 'alice',
        status: 'active',
        page: 1,
      },
    })
  })

  it('does not trigger query when cohortKey is empty', async () => {
    const { QueryClient, VueQueryPlugin } = await import('@tanstack/vue-query')
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })

    const TestComponent = {
      setup() {
        useCohortMembers('')
        return () => null
      },
    }

    mount(TestComponent, {
      global: {
        plugins: [[VueQueryPlugin, { queryClient }]],
      },
    })

    await flushPromises()

    expect(http.get).not.toHaveBeenCalled()
  })
})
