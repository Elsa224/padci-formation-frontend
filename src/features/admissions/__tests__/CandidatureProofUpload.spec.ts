import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import CandidatureView from '../views/CandidatureView.vue'
import * as useCatalogModule from '@/features/catalog/composables/useCatalog'

const mockPush = vi.fn()
const mockMutate = vi.fn()
const mockUploadMutateAsync = vi.fn()

let mockRouteQuery: Record<string, string> = { pathway: 'dev-web', cohort: 'dw-promo-1' }

vi.mock('vue-router', () => ({
  useRoute: vi.fn(() => ({
    query: mockRouteQuery,
  })),
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
  RouterLink: {
    template: '<a><slot /></a>',
  },
}))

vi.mock('@/features/catalog/composables/useCatalog', () => ({
  usePathway: vi.fn(),
  usePathwayCohorts: vi.fn(),
}))

vi.mock('../composables/useCandidature', () => ({
  useSubmitApplication: vi.fn(() => ({
    mutate: mockMutate,
    isPending: ref(false),
  })),
  useUploadMedia: vi.fn(() => ({
    mutateAsync: mockUploadMutateAsync,
    isPending: ref(false),
  })),
}))

vi.mock('../composables/useLearnerApplications', () => ({
  useSubmitApplication: vi.fn(() => ({
    mutate: mockMutate,
    isPending: ref(false),
  })),
}))

describe('CandidatureProofUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRouteQuery = { pathway: 'dev-web', cohort: 'dw-promo-1' }
  })

  const mockPathwayData = {
    id: 1,
    key: 'dev-web',
    code: 'DW-01',
    name: 'Développeur Web',
    requires_equipment_validation: true,
    equipment_requirements: {
      min_cpu: 'Core i5',
      min_ram_gb: 8,
      min_storage_gb: 256,
    },
  }

  const mockCohortsData = [
    {
      id: 10,
      key: 'dw-promo-1',
      code: 'DW-P1',
      name: 'Promo Automne',
      starts_at: '2026-10-01',
      ends_at: '2027-04-01',
      available_seats: 25,
      is_full: false,
    },
  ]

  it('requires equipment proof file before proceeding when pathway requires validation', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Step 1 -> Step 2
    const nextBtn = wrapper.find('button.app-action-primary')
    await nextBtn.trigger('click')
    await flushPromises()

    // Step 2 upload zone exists
    expect(wrapper.find('[data-testid="proof-upload-dropzone"]').exists()).toBe(true)

    // Attempt to proceed to Step 3 without uploading proof
    const step2NextBtn = wrapper.findAll('button.app-action-primary')[0]!
    await step2NextBtn.trigger('click')
    await flushPromises()

    // Assert validation error appears and step has NOT changed to Step 3
    expect(wrapper.text()).toContain('justificatif matériel')
    expect(wrapper.find('h2').text()).not.toContain('Récapitulatif')
  })

  it('uploads file via file input, displays thumbnail preview with replace and remove buttons', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    mockUploadMutateAsync.mockResolvedValueOnce({
      key: 'media_proof_abc123',
      original_name: 'capture-specs.png',
      mime_detected: 'image/png',
      size_bytes: 1024 * 350,
    })

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Advance to Step 2
    await wrapper.find('button.app-action-primary').trigger('click')
    await flushPromises()

    // Trigger file input
    const fileInput = wrapper.find('input[type="file"]')
    expect(fileInput.exists()).toBe(true)

    const testFile = new File(['dummy-content'], 'capture-specs.png', { type: 'image/png' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [testFile],
    })
    await fileInput.trigger('change')
    await flushPromises()

    expect(mockUploadMutateAsync).toHaveBeenCalledWith(testFile)

    // Preview should now be visible
    expect(wrapper.find('[data-testid="proof-preview"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('capture-specs.png')
    expect(wrapper.find('[data-testid="replace-proof-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="remove-proof-btn"]').exists()).toBe(true)

    // Now proceeding to Step 3 should succeed
    const step2NextBtn = wrapper.findAll('button.app-action-primary')[0]!
    await step2NextBtn.trigger('click')
    await flushPromises()

    expect(wrapper.find('h2').text()).toContain('Récapitulatif')
  })

  it('allows removing uploaded proof and resets proof_media_key', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    mockUploadMutateAsync.mockResolvedValueOnce({
      key: 'media_proof_abc123',
      original_name: 'capture-specs.png',
      mime_detected: 'image/png',
      size_bytes: 1024 * 350,
    })

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Advance to Step 2
    await wrapper.find('button.app-action-primary').trigger('click')
    await flushPromises()

    // Upload
    const fileInput = wrapper.find('input[type="file"]')
    const testFile = new File(['dummy-content'], 'capture-specs.png', { type: 'image/png' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [testFile],
    })
    await fileInput.trigger('change')
    await flushPromises()

    expect(wrapper.find('[data-testid="proof-preview"]').exists()).toBe(true)

    // Click remove button
    await wrapper.find('[data-testid="remove-proof-btn"]').trigger('click')
    await flushPromises()

    // Preview should be gone, dropzone back
    expect(wrapper.find('[data-testid="proof-preview"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="proof-upload-dropzone"]').exists()).toBe(true)

    // Attempting step 3 should fail again
    await wrapper.findAll('button.app-action-primary')[0]!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('justificatif matériel')
  })

  it('allows applying directly to pathway without selecting a cohort', async () => {
    mockRouteQuery = { pathway: 'dev-web' } // no cohort in query

    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref({
        ...mockPathwayData,
        requires_equipment_validation: false, // validation not required for this test
      }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Step 1: verify next button is enabled even without cohort
    const nextBtn = wrapper.find('button.app-action-primary')
    expect(nextBtn.attributes('disabled')).toBeUndefined()

    // Advance Step 1 -> Step 2
    await nextBtn.trigger('click')
    await flushPromises()
    expect(wrapper.find('h2').text()).toContain('Équipement')

    // Advance Step 2 -> Step 3
    await wrapper.findAll('button.app-action-primary')[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('h2').text()).toContain('Récapitulatif')

    // Confirm submission
    const submitBtn = wrapper.findAll('button.app-action-primary')[0]!
    await submitBtn.trigger('click')
    await flushPromises()

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const payload = mockMutate.mock.calls[0]![0]
    expect(payload.pathway_key).toBe('dev-web')
    expect(payload.cohort_key).toBeUndefined()
  })

  it('submits complete payload with proof_media_key, cohort_key, and equipment specs', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    mockUploadMutateAsync.mockResolvedValueOnce({
      key: 'media_proof_final_789',
      original_name: 'rapport_systeme.pdf',
      mime_detected: 'application/pdf',
      size_bytes: 1024 * 500,
    })

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Step 1: fill motivation
    const textarea = wrapper.find('textarea')
    await textarea.setValue('Très motivé pour cette session!')
    await wrapper.find('button.app-action-primary').trigger('click')
    await flushPromises()

    // Step 2: fill equipment details
    const inputs = wrapper.findAll('input[type="text"]')
    // CPU input is first text input
    await inputs[0]!.setValue('Intel Core i7-12700H')

    const numberInputs = wrapper.findAll('input[type="number"]')
    // RAM is first number input
    await numberInputs[0]!.setValue('16')
    // Storage is second number input
    await numberInputs[1]!.setValue('512')

    // OS input is the second text input (or by label)
    const osInput = wrapper.find('input#os-name')
    await osInput.setValue('Ubuntu 24.04 LTS')

    // Upload proof
    const fileInput = wrapper.find('input[type="file"]')
    const testFile = new File(['dummy-pdf'], 'rapport_systeme.pdf', { type: 'application/pdf' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [testFile],
    })
    await fileInput.trigger('change')
    await flushPromises()

    // Step 2 -> Step 3
    await wrapper.findAll('button.app-action-primary')[0]!.trigger('click')
    await flushPromises()
    expect(wrapper.find('h2').text()).toContain('Récapitulatif')

    // Submit
    await wrapper.findAll('button.app-action-primary')[0]!.trigger('click')
    await flushPromises()

    expect(mockMutate).toHaveBeenCalledTimes(1)
    const payload = mockMutate.mock.calls[0]![0]
    expect(payload.pathway_key).toBe('dev-web')
    expect(payload.cohort_key).toBeUndefined()
    expect(payload.motivation).toBe('Très motivé pour cette session!')
    expect(payload.proof_media_key).toBe('media_proof_final_789')
    expect(payload.equipment).toMatchObject({
      cpu_model: 'Intel Core i7-12700H',
      ram_gb: 16,
      storage_total_gb: 512,
      os_name: 'Ubuntu 24.04 LTS',
    })
  })

  it('handles drag and drop upload with valid image file', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    mockUploadMutateAsync.mockResolvedValueOnce({
      key: 'media_drag_drop_123',
      original_name: 'mac-specs.webp',
      mime_detected: 'image/webp',
      size_bytes: 1024 * 120,
    })

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Advance to Step 2
    await wrapper.find('button.app-action-primary').trigger('click')
    await flushPromises()

    const dropzone = wrapper.find('[data-testid="proof-upload-dropzone"]')
    expect(dropzone.exists()).toBe(true)

    // Dragover
    await dropzone.trigger('dragover')
    expect(dropzone.classes()).toContain('border-primary')

    // Dragleave
    await dropzone.trigger('dragleave')
    expect(dropzone.classes()).not.toContain('scale-[1.01]')

    // Drop file
    const droppedFile = new File(['content'], 'mac-specs.webp', { type: 'image/webp' })
    await dropzone.trigger('drop', {
      dataTransfer: {
        files: [droppedFile],
      },
    })
    await flushPromises()

    expect(mockUploadMutateAsync).toHaveBeenCalledWith(droppedFile)
    expect(wrapper.find('[data-testid="proof-preview"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('mac-specs.webp')
  })

  it('rejects unsupported file formats with user-friendly error', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Advance to Step 2
    await wrapper.find('button.app-action-primary').trigger('click')
    await flushPromises()

    const dropzone = wrapper.find('[data-testid="proof-upload-dropzone"]')
    const invalidFile = new File(['binary-content'], 'malware.exe', {
      type: 'application/x-msdownload',
    })

    await dropzone.trigger('drop', {
      dataTransfer: {
        files: [invalidFile],
      },
    })
    await flushPromises()

    expect(mockUploadMutateAsync).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Format non supporté')
    expect(wrapper.find('[data-testid="proof-preview"]').exists()).toBe(false)
  })

  it('revokes previous object URL on replace and resets file input value', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    const createObjectURLSpy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValueOnce('blob:http://localhost/first-url')
      .mockReturnValueOnce('blob:http://localhost/second-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    mockUploadMutateAsync
      .mockResolvedValueOnce({
        key: 'media_first',
        original_name: 'first.png',
        mime_detected: 'image/png',
        size_bytes: 1024,
      })
      .mockResolvedValueOnce({
        key: 'media_second',
        original_name: 'second.png',
        mime_detected: 'image/png',
        size_bytes: 2048,
      })

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Advance to Step 2
    await wrapper.find('button.app-action-primary').trigger('click')
    await flushPromises()

    const fileInput = wrapper.find('input[type="file"]')
    const file1 = new File(['content1'], 'first.png', { type: 'image/png' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [file1],
      writable: true,
    })
    await fileInput.trigger('change')
    await flushPromises()

    expect(createObjectURLSpy).toHaveBeenCalledWith(file1)
    expect((fileInput.element as HTMLInputElement).value).toBe('')

    // Now replace with second file
    const file2 = new File(['content2'], 'second.png', { type: 'image/png' })
    Object.defineProperty(fileInput.element, 'files', {
      value: [file2],
      writable: true,
    })
    await fileInput.trigger('change')
    await flushPromises()

    // Must revoke previous URL
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:http://localhost/first-url')
    expect(createObjectURLSpy).toHaveBeenCalledWith(file2)
    expect(wrapper.text()).toContain('second.png')

    createObjectURLSpy.mockRestore()
    revokeObjectURLSpy.mockRestore()
  })

  it('rejects image formats not in explicit allowlist like gif or svg', async () => {
    vi.mocked(useCatalogModule.usePathway).mockReturnValue({
      data: ref(mockPathwayData),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as never)

    vi.mocked(useCatalogModule.usePathwayCohorts).mockReturnValue({
      data: ref(mockCohortsData),
      isPending: ref(false),
    } as never)

    const wrapper = mount(CandidatureView, {
      global: {
        stubs: { RouterLink: true },
      },
    })

    // Advance to Step 2
    await wrapper.find('button.app-action-primary').trigger('click')
    await flushPromises()

    const dropzone = wrapper.find('[data-testid="proof-upload-dropzone"]')
    const gifFile = new File(['gif-content'], 'animation.gif', {
      type: 'image/gif',
    })

    await dropzone.trigger('drop', {
      dataTransfer: {
        files: [gifFile],
      },
    })
    await flushPromises()

    expect(mockUploadMutateAsync).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Format non supporté')
  })
})
