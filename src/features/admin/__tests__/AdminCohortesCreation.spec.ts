import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import AdminCohortes from '../views/AdminCohortes.vue'
import * as useCohortsModule from '../composables/useCohorts'
import * as useCatalogPathwaysModule from '@/features/public/composables/useCatalogPathways'

const mockCreateCohortMutateAsync = vi.fn()

vi.mock('../composables/useCohorts', async (importOriginal) => {
  const actual = await importOriginal<typeof useCohortsModule>()
  return {
    ...actual,
    useCohorts: vi.fn(),
    useCreateCohort: vi.fn(() => ({
      mutateAsync: mockCreateCohortMutateAsync,
      mutate: mockCreateCohortMutateAsync,
      isPending: ref(false),
    })),
  }
})

vi.mock('@/features/public/composables/useCatalogPathways', () => ({
  useCatalogPathways: vi.fn(),
}))

describe('AdminCohortes Creation & Offline Dates', () => {
  const currentYear = new Date().getFullYear()

  const mockPathways = [
    {
      id: 1,
      key: 'dev-web',
      code: 'DW',
      name: 'Développeur Web',
      slug: 'dev-web',
    },
    {
      id: 2,
      key: 'data-ai',
      code: 'DAI',
      name: 'Data & Intelligence Artificielle',
      slug: 'data-ai',
    },
  ]

  const mockExistingCohorts = [
    {
      id: 1,
      key: 'cohort-dw-1',
      code: `DW-${currentYear}-C1`,
      name: 'Développeur Web — Cohorte 1',
      session: 'Cohorte 1',
      capacity: 50,
      enrolled_count: 20,
      starts_at: `${currentYear}-01-15`,
      ends_at: `${currentYear}-06-15`,
      offline_starts_at: `${currentYear}-04-01`,
      offline_ends_at: `${currentYear}-05-01`,
      status: 'open' as const,
      created_at: `${currentYear}-01-01T00:00:00Z`,
      pathway: { id: 1, key: 'dev-web', code: 'DW', name: 'Développeur Web' },
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCatalogPathwaysModule.useCatalogPathways).mockReturnValue({
      data: ref(mockPathways),
      isPending: ref(false),
    } as never)

    vi.mocked(useCohortsModule.useCohorts).mockReturnValue({
      data: ref({ items: mockExistingCohorts, pagination: null }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)
  })

  it('displays an informative offline tag on cohort cards when offline_starts_at is present', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    const offlineTag = wrapper.find('[data-testid="cohort-offline-tag"]')
    expect(offlineTag.exists()).toBe(true)
    expect(offlineTag.text()).toContain('Présentiel : dès le')
  })

  it('auto-generates code and name when selecting a pathway based on existing cohorts sequence', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    await wrapper.find('[data-testid="btn-open-create-cohort"]').trigger('click')
    await flushPromises()

    // 1 DW cohort exists in currentYear, so sequence should be C2
    await wrapper.find('[data-testid="cohort-pathway-select"]').setValue('dev-web')
    await flushPromises()

    const codeInput = wrapper.find<HTMLInputElement>('[data-testid="cohort-code-input"]')
    const nameInput = wrapper.find<HTMLInputElement>('[data-testid="cohort-name-input"]')

    expect(codeInput.element.value).toBe(`DW-${currentYear}-C2`)
    expect(nameInput.element.value).toBe('Développeur Web — Cohorte 2')

    // Selecting data-ai (0 existing cohorts) -> sequence should be C1
    await wrapper.find('[data-testid="cohort-pathway-select"]').setValue('data-ai')
    await flushPromises()

    expect(codeInput.element.value).toBe(`DAI-${currentYear}-C1`)
    expect(nameInput.element.value).toBe('Data & Intelligence Artificielle — Cohorte 1')
  })

  it('does not display session input field in the creation modal', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    await wrapper.find('[data-testid="btn-open-create-cohort"]').trigger('click')
    await flushPromises()

    const sessionInput = wrapper.find('[data-testid="cohort-session-input"]')
    expect(sessionInput.exists()).toBe(false)
  })

  it('prevents submission when starts_at or ends_at are missing', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    await wrapper.find('[data-testid="btn-open-create-cohort"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="cohort-pathway-select"]').setValue('dev-web')
    await flushPromises()

    // Submit without dates
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockCreateCohortMutateAsync).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Veuillez renseigner les dates de début et de fin en ligne.')
  })

  it('validates date coherency: ends_at >= starts_at, offline_starts_at >= starts_at, offline_ends_at >= offline_starts_at', async () => {
    const wrapper = mount(AdminCohortes)
    await flushPromises()

    await wrapper.find('[data-testid="btn-open-create-cohort"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="cohort-pathway-select"]').setValue('dev-web')
    await flushPromises()

    // 1. ends_at < starts_at
    await wrapper.find('[data-testid="cohort-starts-at-input"]').setValue('2026-06-01')
    await wrapper.find('[data-testid="cohort-ends-at-input"]').setValue('2026-05-01')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockCreateCohortMutateAsync).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(
      'La date de fin doit être postérieure ou égale à la date de début.',
    )

    // Fix ends_at
    await wrapper.find('[data-testid="cohort-ends-at-input"]').setValue('2026-10-01')

    // 2. offline_starts_at < starts_at
    await wrapper.find('[data-testid="cohort-offline-starts-at-input"]').setValue('2026-05-15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockCreateCohortMutateAsync).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(
      'La date de début du présentiel doit être postérieure ou égale à la date de début de la cohorte.',
    )

    // Fix offline_starts_at, but set offline_ends_at < offline_starts_at
    await wrapper.find('[data-testid="cohort-offline-starts-at-input"]').setValue('2026-07-01')
    await wrapper.find('[data-testid="cohort-offline-ends-at-input"]').setValue('2026-06-15')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockCreateCohortMutateAsync).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(
      'La date de fin du présentiel doit être postérieure ou égale à la date de début du présentiel.',
    )
  })

  it('passes offline dates in mutation payload when provided and valid', async () => {
    mockCreateCohortMutateAsync.mockResolvedValueOnce({
      cohort: {
        id: 2,
        key: 'cohort-dw-2',
        code: `DW-${currentYear}-C2`,
        name: 'Développeur Web — Cohorte 2',
      },
      drained_standby_count: 0,
    })

    const wrapper = mount(AdminCohortes)
    await flushPromises()

    await wrapper.find('[data-testid="btn-open-create-cohort"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="cohort-pathway-select"]').setValue('dev-web')
    await wrapper.find('[data-testid="cohort-starts-at-input"]').setValue('2026-03-01')
    await wrapper.find('[data-testid="cohort-ends-at-input"]').setValue('2026-09-01')
    await wrapper.find('[data-testid="cohort-offline-starts-at-input"]').setValue('2026-06-15')
    await wrapper.find('[data-testid="cohort-offline-ends-at-input"]').setValue('2026-07-15')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(mockCreateCohortMutateAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        pathway_key: 'dev-web',
        code: `DW-${currentYear}-C2`,
        name: 'Développeur Web — Cohorte 2',
        capacity: 100,
        starts_at: '2026-03-01',
        ends_at: '2026-09-01',
        offline_starts_at: '2026-06-15',
        offline_ends_at: '2026-07-15',
        status: 'open',
      }),
    )

    // Modal is closed after successful submission
    expect(wrapper.find('[data-testid="create-cohort-modal"]').exists()).toBe(false)
  })
})
