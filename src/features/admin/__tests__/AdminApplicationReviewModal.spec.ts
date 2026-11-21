import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import AdminCandidatures from '../views/AdminCandidatures.vue'
import AdminCohortes from '../views/AdminCohortes.vue'
import * as useApplicationsModule from '../composables/useApplications'
import * as useCohortsModule from '../composables/useCohorts'
import * as useCatalogPathwaysModule from '@/features/public/composables/useCatalogPathways'

const mockDecideMutate = vi.fn()
const mockStartReviewMutate = vi.fn()
const mockCreateCohortMutateAsync = vi.fn()

vi.mock('../composables/useApplications', async (importOriginal) => {
  const actual = await importOriginal<typeof useApplicationsModule>()
  return {
    ...actual,
    useApplications: vi.fn(),
    useApplication: vi.fn(),
    useStartApplicationReview: vi.fn(() => ({
      mutate: mockStartReviewMutate,
      isPending: ref(false),
    })),
    useDecideApplication: vi.fn(() => ({
      mutate: mockDecideMutate,
      isPending: ref(false),
    })),
  }
})

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

describe('AdminApplicationReviewModal and Cohort Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useCatalogPathwaysModule.useCatalogPathways).mockReturnValue({
      data: ref([
        {
          id: 1,
          key: 'dev-web',
          code: 'DW',
          name: 'Développeur Web',
          slug: 'dev-web',
          is_active: true,
          position: 1,
          description: null,
          equipment_requirements: null,
          icon: null,
        },
      ]),
      isPending: ref(false),
    } as any)
  })

  describe('AdminCandidatures', () => {
    const mockApplicationListItem = {
      id: 1,
      key: 'app-abc-123',
      status: 'submitted' as const,
      motivation: 'Très motivée par le numérique.',
      payload: {
        phone: '+2250701020304',
      },
      user: {
        id: 10,
        key: 'usr-10',
        name: 'Awa Kouamé',
        email: 'awa.kouame@example.com',
      },
      pathway: {
        id: 1,
        key: 'dev-web',
        code: 'DW-01',
        name: 'Développeur Web',
        slug: 'dev-web',
      },
      cohort: {
        id: 101,
        key: 'dw-promo-1',
        code: 'DW-2026-P1',
        name: 'Promotion Octobre 2026',
        session: '2026-P1',
        starts_at: '2026-10-01',
        ends_at: '2027-04-01',
        status: 'open',
      },
      equipment_review: {
        key: 'rev-001',
        status: 'approved' as const,
        reason: null,
        declaration: {
          device_type: 'laptop',
          cpu: 'Intel Core i7 11th Gen',
          ram_gb: 16,
          storage_gb: 512,
          os: 'Ubuntu Linux 24.04',
        },
      },
      proof_media_url: 'https://storage.emsp.ci/proofs/test-proof.jpg',
      submitted_at: '2026-09-15T10:00:00Z',
      decided_at: null,
      reason: null,
      created_at: '2026-09-15T10:00:00Z',
      updated_at: '2026-09-15T10:00:00Z',
    }

    const mockApplicationDetail = {
      ...mockApplicationListItem,
      pathway: {
        ...mockApplicationListItem.pathway,
        equipment_requirements: {
          min_cpu: 'Intel Core i5',
          min_ram_gb: 8,
          min_storage_gb: 256,
        },
      },
      equipment_review: {
        key: 'rev-001',
        status: 'approved' as const,
        reason: 'Matériel conforme aux prérequis',
        requirements_snapshot: {
          min_cpu: 'Intel Core i5',
          min_ram_gb: 8,
          min_storage_gb: 256,
        },
        declaration: {
          device_type: 'laptop',
          cpu: 'Intel Core i7 11th Gen',
          ram_gb: 16,
          storage_gb: 512,
          os: 'Ubuntu Linux 24.04',
        },
        proof_media: {
          id: 55,
          key: 'media-55',
          original_name: 'capture-specs.jpg',
          mime_detected: 'image/jpeg',
          size_bytes: 204800,
          download_url: 'https://storage.emsp.ci/proofs/test-proof.jpg',
        },
      },
    }

    it('opens detailed candidate drawer with candidate profile, hardware comparison and proof viewer', async () => {
      vi.mocked(useApplicationsModule.useApplications).mockReturnValue({
        data: ref({
          items: [mockApplicationListItem],
          pagination: { total: 1, per_page: 15, current_page: 1, last_page: 1, from: 1, to: 1 },
        }),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as any)

      vi.mocked(useApplicationsModule.useApplication).mockReturnValue({
        data: ref(mockApplicationDetail),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as any)

      const wrapper = mount(AdminCandidatures)
      await flushPromises()

      // Table shows candidate
      expect(wrapper.text()).toContain('Awa Kouamé')
      expect(wrapper.text()).toContain('Développeur Web')

      // Click row / view button to open side drawer
      const openBtn = wrapper.find('button[title="Voir le dossier"]')
      await openBtn.trigger('click')
      await flushPromises()

      // Drawer is open
      const drawer = wrapper.find('[data-testid="candidate-drawer"]')
      expect(drawer.exists()).toBe(true)

      // Profile details
      expect(drawer.text()).toContain('Awa Kouamé')
      expect(drawer.text()).toContain('awa.kouame@example.com')
      expect(drawer.text()).toContain('+2250701020304')
      expect(drawer.text()).toContain('Développeur Web')

      // Hardware comparison card
      const hardwareCard = wrapper.find('[data-testid="hardware-comparison-card"]')
      expect(hardwareCard.exists()).toBe(true)
      expect(hardwareCard.text()).toContain('Intel Core i7 11th Gen')
      expect(hardwareCard.text()).toContain('16 Go')
      expect(hardwareCard.text()).toContain('512 Go')
      expect(hardwareCard.text()).toContain('Intel Core i5')
      expect(hardwareCard.text()).toContain('8 Go')
      expect(hardwareCard.text()).toContain('256 Go')

      // Hardware proof viewer
      const proofViewer = wrapper.find('[data-testid="hardware-proof-viewer"]')
      expect(proofViewer.exists()).toBe(true)
      const proofImg = wrapper.find('[data-testid="proof-media-image"]')
      expect(proofImg.exists()).toBe(true)
      expect(proofImg.attributes('src')).toBe('https://storage.emsp.ci/proofs/test-proof.jpg')

      // Zoom toggle button exists
      const zoomBtn = wrapper.find('[data-testid="proof-zoom-toggle"]')
      expect(zoomBtn.exists()).toBe(true)
      await zoomBtn.trigger('click')
      expect(wrapper.find('[data-testid="proof-fullscreen-overlay"]').exists()).toBe(true)
    })

    it('approves application and displays destination preview (assigned cohort or standby)', async () => {
      vi.mocked(useApplicationsModule.useApplications).mockReturnValue({
        data: ref({
          items: [mockApplicationListItem],
          pagination: { total: 1, per_page: 15, current_page: 1, last_page: 1, from: 1, to: 1 },
        }),
        isPending: ref(false),
      } as any)

      vi.mocked(useApplicationsModule.useApplication).mockReturnValue({
        data: ref(mockApplicationDetail),
        isPending: ref(false),
      } as any)

      const wrapper = mount(AdminCandidatures)
      await flushPromises()

      // Open drawer
      await wrapper.find('button[title="Voir le dossier"]').trigger('click')
      await flushPromises()

      // Destination indicator displays cohort assignment preview
      const destinationPreview = wrapper.find('[data-testid="admission-destination-preview"]')
      expect(destinationPreview.exists()).toBe(true)
      expect(destinationPreview.text()).toContain('DW-2026-P1')

      // Click "Approuver la candidature"
      const approveBtn = wrapper.find('[data-testid="btn-approve-application"]')
      expect(approveBtn.exists()).toBe(true)
      await approveBtn.trigger('click')

      expect(mockDecideMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'app-abc-123',
          decision: 'accepted',
        }),
        expect.any(Object),
      )
    })

    it('shows standby destination preview when application has no cohort assigned', async () => {
      const standbyCandidate = {
        ...mockApplicationDetail,
        cohort: null,
      }

      vi.mocked(useApplicationsModule.useApplications).mockReturnValue({
        data: ref({
          items: [standbyCandidate],
          pagination: { total: 1, per_page: 15, current_page: 1, last_page: 1, from: 1, to: 1 },
        }),
        isPending: ref(false),
      } as any)

      vi.mocked(useApplicationsModule.useApplication).mockReturnValue({
        data: ref(standbyCandidate),
        isPending: ref(false),
      } as any)

      const wrapper = mount(AdminCandidatures)
      await flushPromises()

      await wrapper.find('button[title="Voir le dossier"]').trigger('click')
      await flushPromises()

      const destinationPreview = wrapper.find('[data-testid="admission-destination-preview"]')
      expect(destinationPreview.exists()).toBe(true)
      expect(destinationPreview.text().toLowerCase()).toContain('standby')
    })

    it('opens rejection modal, enforces motive and confirms rejection', async () => {
      vi.mocked(useApplicationsModule.useApplications).mockReturnValue({
        data: ref({
          items: [mockApplicationListItem],
          pagination: { total: 1, per_page: 15, current_page: 1, last_page: 1, from: 1, to: 1 },
        }),
        isPending: ref(false),
      } as any)

      vi.mocked(useApplicationsModule.useApplication).mockReturnValue({
        data: ref(mockApplicationDetail),
        isPending: ref(false),
      } as any)

      const wrapper = mount(AdminCandidatures)
      await flushPromises()

      await wrapper.find('button[title="Voir le dossier"]').trigger('click')
      await flushPromises()

      // Click "Rejeter"
      const rejectTrigger = wrapper.find('[data-testid="btn-reject-trigger"]')
      expect(rejectTrigger.exists()).toBe(true)
      await rejectTrigger.trigger('click')
      await flushPromises()

      // Rejection reason input is shown
      const reasonInput = wrapper.find('[data-testid="reject-reason-input"]')
      expect(reasonInput.exists()).toBe(true)

      // Try confirming without reason -> error displayed
      const confirmRejectBtn = wrapper.find('[data-testid="btn-confirm-reject"]')
      await confirmRejectBtn.trigger('click')
      expect(mockDecideMutate).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Le motif du rejet est obligatoire')

      // Type reason and submit
      await reasonInput.setValue('Prérequis techniques insuffisants pour cette session.')
      await confirmRejectBtn.trigger('click')

      expect(mockDecideMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'app-abc-123',
          decision: 'rejected',
          reason: 'Prérequis techniques insuffisants pour cette session.',
        }),
        expect.any(Object),
      )
    })
  })

  describe('AdminCohortes', () => {
    const mockCohorts = [
      {
        id: 1,
        key: 'cohort-dw-1',
        code: 'DW-2026-P1',
        name: 'Promo Web Octobre',
        session: 'Octobre 2026',
        capacity: 100,
        enrolled_count: 85,
        available_seats: 15,
        starts_at: '2026-10-01',
        ends_at: '2027-04-01',
        status: 'open' as const,
        pathway: { id: 1, key: 'dev-web', code: 'DW', name: 'Développeur Web' },
      },
    ]

    it('displays capacity, enrolled count, and available seats for each cohort', async () => {
      vi.mocked(useCohortsModule.useCohorts).mockReturnValue({
        data: ref({ items: mockCohorts, pagination: null }),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as any)

      const wrapper = mount(AdminCohortes)
      await flushPromises()

      expect(wrapper.text()).toContain('DW-2026-P1')
      expect(wrapper.text()).toContain('85')
      expect(wrapper.text()).toContain('100')
      expect(wrapper.text()).toContain('15')
    })

    it('pre-fills cohort capacity with 100 by default in creation modal and notifies standby drained count', async () => {
      vi.mocked(useCohortsModule.useCohorts).mockReturnValue({
        data: ref({ items: mockCohorts, pagination: null }),
        isPending: ref(false),
        isError: ref(false),
        error: ref(null),
      } as any)

      mockCreateCohortMutateAsync.mockResolvedValueOnce({
        cohort: {
          id: 2,
          key: 'cohort-dw-2',
          code: 'DW-2026-P2',
          name: 'Promo Web Mars',
          capacity: 100,
        },
        drained_standby_count: 4,
      })

      const wrapper = mount(AdminCohortes)
      await flushPromises()

      // Click "Nouvelle cohorte"
      const createBtn = wrapper.find('[data-testid="btn-open-create-cohort"]')
      expect(createBtn.exists()).toBe(true)
      await createBtn.trigger('click')
      await flushPromises()

      // Modal is visible
      const modal = wrapper.find('[data-testid="create-cohort-modal"]')
      expect(modal.exists()).toBe(true)

      // Capacity input defaults to 100
      const capacityInput = wrapper.find<HTMLInputElement>('[data-testid="cohort-capacity-input"]')
      expect(capacityInput.exists()).toBe(true)
      expect(Number(capacityInput.element.value)).toBe(100)

      // Fill form fields
      await wrapper.find('[data-testid="cohort-pathway-select"]').setValue('dev-web')
      await wrapper.find('[data-testid="cohort-code-input"]').setValue('DW-2026-P2')
      await wrapper.find('[data-testid="cohort-name-input"]').setValue('Promo Web Mars')

      // Submit form
      const submitBtn = wrapper.find('[data-testid="btn-submit-create-cohort"]')
      await submitBtn.trigger('click')
      await flushPromises()

      expect(mockCreateCohortMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          pathway_key: 'dev-web',
          code: 'DW-2026-P2',
          name: 'Promo Web Mars',
          capacity: 100,
        }),
      )

      // Toast / notification shows drained standby count
      const toast = wrapper.find('[data-testid="cohort-drained-notification"]')
      expect(toast.exists()).toBe(true)
      expect(toast.text()).toContain('4')
      expect(toast.text()).toContain('standby ont été automatiquement intégrés')
    })
  })
})
