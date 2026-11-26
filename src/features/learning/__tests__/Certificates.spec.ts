import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import MesAttestations from '../views/MesAttestations.vue'
import VerifierAttestation from '@/features/public/views/VerifierAttestation.vue'
import * as certificatesModule from '../composables/useCertificates'
import { http } from '@/api/http'

const replace = vi.fn()
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => ({ query: { code: 'ABC123' } }),
  useRouter: () => ({ replace }),
}))
vi.mock('@/features/public/layouts/PublicLayout.vue', () => ({
  default: { template: '<div><slot /></div>' },
}))
vi.mock('@/api/http', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/http')>()
  return { ...actual, http: { get: vi.fn() } }
})
vi.mock('../composables/useCertificates', async (importOriginal) => ({
  ...(await importOriginal<typeof certificatesModule>()),
  useMyCertificates: vi.fn(),
  useMyExternalCertifications: vi.fn(),
  usePublicCertificate: vi.fn(),
}))

const certificate = {
  key: 'cert_1',
  status: 'issued' as const,
  code: 'ABC123',
  verification_url: 'http://localhost:5173/verifier?code=ABC123',
  download_url: 'http://localhost:8070/api/v1/learning/certificates/cert_1/download?signature=x',
  course: { key: 'crs_1', title: 'IT Support - Module 3', slug: 'it-support' },
  issued_at: '2026-11-22T10:00:00Z',
  revoked_at: null,
  revocation_reason: null,
  created_at: '2026-11-22T10:00:00Z',
}

describe('MesAttestations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(certificatesModule.useMyCertificates).mockReturnValue({
      data: ref([certificate]),
      isPending: ref(false),
      isError: ref(false),
    } as never)
    vi.mocked(certificatesModule.useMyExternalCertifications).mockReturnValue({
      data: ref([]),
      isPending: ref(false),
    } as never)
  })

  it('downloads the PDF through the authenticated client, not a bare link', async () => {
    URL.createObjectURL = vi.fn(() => 'blob:pdf')
    URL.revokeObjectURL = vi.fn()
    vi.mocked(http.get).mockResolvedValue({ data: new Blob(['%PDF-']) } as never)

    const wrapper = mount(MesAttestations)
    expect(wrapper.find('a[href*="/download"]').exists()).toBe(false)
    await wrapper.find('[data-test="download-certificate"]').trigger('click')
    await flushPromises()

    expect(http.get).toHaveBeenCalledWith(certificate.download_url, { responseType: 'blob' })
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})

describe('VerifierAttestation', () => {
  it('verifies the code from the link printed on the certificate', () => {
    vi.mocked(certificatesModule.usePublicCertificate).mockReturnValue({
      data: ref({
        valid: true,
        status: 'issued',
        holder_name: 'Demo User',
        course_title: 'IT Support - Module 3',
        issued_at: '2026-11-22T10:00:00Z',
        revoked_at: null,
      }),
      isPending: ref(false),
      isError: ref(false),
    } as never)

    const wrapper = mount(VerifierAttestation)
    const result = wrapper.find('[data-test="verify-result"]')
    expect(result.text()).toContain('Attestation valide')
    expect(result.text()).toContain('Demo User')
    expect(vi.mocked(certificatesModule.usePublicCertificate).mock.calls[0]![0]).toMatchObject({
      value: 'ABC123',
    })
  })
})
