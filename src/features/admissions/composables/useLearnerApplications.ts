import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { apiMeta, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'

export interface EquipmentDeclaration {
  device_type: string
  cpu_model: string
  cpu?: string
  cpu_cores?: number
  ram_gb: number
  storage_total_gb: number
  storage_gb?: number
  storage_free_gb?: number
  os_name: string
  os?: string
  os_version?: string
  virtualization_supported?: boolean
  notes?: string
}

export interface ApplicationPayload {
  [key: string]: unknown
}

export interface EquipmentReview {
  id: number
  key: string
  status: 'not_required' | 'pending' | 'needs_info' | 'approved' | 'rejected'
  requirements_snapshot: Record<string, unknown> | null
  declaration: EquipmentDeclaration | null
  reason: string | null
  submitted_at: string | null
  decided_at: string | null
}

export interface LearnerApplication {
  id: number
  key: string
  status: 'submitted' | 'in_review' | 'accepted' | 'waitlisted' | 'rejected' | 'withdrawn'
  motivation: string | null
  payload: ApplicationPayload | null
  equipment_review?: EquipmentReview | null
  pathway?: {
    id: number
    key: string
    code: string
    name: string
    slug: string
  } | null
  cohort?: {
    id: number
    key: string
    code: string
    name: string
    session: string
    starts_at: string | null
    ends_at: string | null
    status: string
  } | null
  reason: string | null
  submitted_at: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export interface SubmitApplicationDto {
  pathway_key: string
  cohort_key?: string
  motivation?: string
  equipment?: EquipmentDeclaration
  proof_media_key?: string
}

export function useRespondToEquipmentReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      applicationKey,
      equipment,
    }: {
      applicationKey: string
      equipment: EquipmentDeclaration
    }) => {
      const { data } = await http.patch<EquipmentReview>(
        `/applications/${applicationKey}/equipment-review`,
        { equipment },
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner-applications'] })
    },
  })
}

/**
 * Learner: list of applications submitted by the current user.
 */
export function useLearnerApplications() {
  return useQuery({
    queryKey: ['learner-applications'],
    queryFn: async () => {
      const response = await http.get<LearnerApplication[]>('/applications', {
        params: { per_page: 50 },
      })
      return {
        items: response.data,
        pagination: apiMeta(response)?.pagination ?? (null as ApiPaginationMeta | null),
      }
    },
  })
}

/**
 * Learner: submit a new application (ADR-012).
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

/**
 * Learner: withdraw a pending application.
 */
export function useWithdrawApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await http.post<LearnerApplication>(`/applications/${key}/withdraw`)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['learner-applications'] })
    },
  })
}
