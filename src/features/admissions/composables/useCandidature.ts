import { useMutation } from '@tanstack/vue-query'
import { http } from '@/api/http'

export {
  useSubmitApplication,
  type SubmitApplicationDto,
  type EquipmentDeclaration,
} from './useLearnerApplications'

export interface UploadedMedia {
  id?: number
  key: string
  original_name: string
  mime_detected: string
  size_bytes: number
  scan_status?: string
  download_url?: string
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
