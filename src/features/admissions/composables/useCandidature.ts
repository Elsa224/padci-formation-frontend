import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { http } from '@/api/http'
import type { EquipmentDeclaration, LearnerApplication } from './useLearnerApplications'

export interface UploadedMedia {
  id?: number
  key: string
  original_name: string
  mime_detected: string
  size_bytes: number
  scan_status?: string
  download_url?: string
}

export interface SubmitApplicationDto {
  pathway_key: string
  cohort_key?: string
  motivation?: string
  equipment?: EquipmentDeclaration
  proof_media_key?: string
}

/**
 * Uploads media file to POST /api/v1/media (multipart/form-data)
 */
export function useUploadMedia() {
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('file', file)
      const { data } = await http.post<UploadedMedia>('/media', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return data
    },
  })
}

/**
 * Submits learner application (ADR-012, standby & equipment proof support).
 */
export function useSubmitApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (dto: SubmitApplicationDto) => {
      const { data } = await http.post<LearnerApplication>('/applications', dto)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner-applications'] })
    },
  })
}
