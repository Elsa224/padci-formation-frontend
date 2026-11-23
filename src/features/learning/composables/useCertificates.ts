import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRef } from 'vue'
import { http } from '@/api/http'
import type { Schema } from '@/api/contract'

/** `CertificateResource` - generated from the contract (accurate here). */
export type Certificate = Schema<'CertificateResource'>
/** `PublicCertificateResource` - what anyone can see from a code. */
export type PublicCertificate = Schema<'PublicCertificateResource'>
/** `ExternalCertificationResource` (Cisco, Oracle…), recorded by staff. */
export type ExternalCertification = Schema<'ExternalCertificationResource'>

/** GET /learning/certificates - the learner's own certificates. */
export function useMyCertificates() {
  return useQuery({
    queryKey: ['learning-certificates'],
    queryFn: async () => (await http.get<Certificate[]>('/learning/certificates')).data,
  })
}

/**
 * POST /learning/courses/{course}/certificate. The server checks the
 * criteria (ADR-008: progress + minimum score) and answers 422 with the
 * reason when they are not met.
 */
export function useRequestCertificate() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (courseKey: string) =>
      (await http.post<Certificate>(`/learning/courses/${courseKey}/certificate`)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['learning-certificates'] }),
  })
}

/** GET /learning/external-certifications. */
export function useMyExternalCertifications() {
  return useQuery({
    queryKey: ['learning-external-certifications'],
    queryFn: async () =>
      (await http.get<ExternalCertification[]>('/learning/external-certifications')).data,
  })
}

/** GET /public/certificates/{code} - no authentication. */
export function usePublicCertificate(code: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['public-certificate', toValue(code)]),
    enabled: computed(() => toValue(code).trim() !== ''),
    retry: false,
    queryFn: async () =>
      (
        await http.get<PublicCertificate>(
          `/public/certificates/${encodeURIComponent(toValue(code).trim())}`,
        )
      ).data,
  })
}

/**
 * The download route is both signed and behind auth:sanctum, so a plain
 * link (no Authorization header) gets 401: fetch it with the authenticated
 * client and hand the PDF to the browser as a file.
 */
export async function downloadCertificatePdf(certificate: Certificate): Promise<void> {
  if (!certificate.download_url) return
  const response = await http.get<Blob>(certificate.download_url, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  try {
    const link = document.createElement('a')
    link.href = url
    link.download = `attestation-${certificate.code}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
  } finally {
    // Give the browser a moment to start the download before revoking.
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }
}

export const certificateStatusLabels: Record<Certificate['status'], string> = {
  pending: 'En préparation',
  issued: 'Délivrée',
  revoked: 'Révoquée',
}
