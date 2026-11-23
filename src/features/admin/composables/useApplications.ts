import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { apiMeta, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'

export interface ApplicationPathway {
  id: number
  key: string
  code: string
  name: string
  slug: string
  requires_equipment_validation?: boolean
  equipment_requirements?: {
    min_cpu?: string
    min_ram_gb?: number
    min_storage_gb?: number
    notes?: string
  } | null
}

export interface ApplicationCohort {
  id: number
  key: string
  code: string
  name: string
  session: string | null
  capacity?: number | null
  enrolled_count?: number
  available_seats?: number
  starts_at: string | null
  ends_at: string | null
  status: string
}

export interface ApplicationUser {
  id: number
  key: string
  name: string
  email: string
  phone?: string | null
}

export interface ApplicationEquipmentReview {
  key: string
  status: 'not_required' | 'pending' | 'needs_info' | 'approved' | 'rejected'
  declaration: Record<string, unknown> | null
  requirements_snapshot?: Record<string, unknown> | null
  reason: string | null
  proof_media?: {
    id: number
    key: string
    original_name: string
    mime_detected: string
    size_bytes: number
    download_url: string
  } | null
  proof_media_url?: string | null
  reviewed_by?: { key: string; name: string } | null
}

/** `ApplicationResource` shape. `payload` is free-form — see StoreApplicationRequest. */
export interface Application {
  id: number
  key: string
  status:
    | 'submitted'
    | 'in_review'
    | 'accepted'
    | 'waitlisted'
    | 'rejected'
    | 'withdrawn'
    | 'standby'
  motivation: string | null
  payload: Record<string, unknown> | null
  equipment_review?: ApplicationEquipmentReview | null
  proof_media_url?: string | null
  user?: ApplicationUser
  pathway?: ApplicationPathway
  cohort?: ApplicationCohort | null
  decided_by?: { id: number; key: string; name: string } | null
  reason: string | null
  submitted_at: string | null
  decided_at: string | null
  created_at: string
  updated_at: string
}

export interface ApplicationListFilters {
  status?: string
  pathwayKey?: string
  q?: string
  page?: number
}

/** GET /admin/applications — admissions.view. Server-side filtering/paging. */
export function useApplications(filters: Ref<ApplicationListFilters>) {
  return useQuery({
    queryKey: computed(() => ['admin-applications', filters.value]),
    queryFn: async () => {
      const response = await http.get<Application[]>('/admin/applications', {
        params: {
          status: filters.value.status || undefined,
          pathway_key: filters.value.pathwayKey || undefined,
          q: filters.value.q || undefined,
          page: filters.value.page ?? 1,
        },
      })

      return {
        items: response.data,
        pagination: apiMeta(response)?.pagination ?? (null as ApiPaginationMeta | null),
      }
    },
  })
}

/** GET /admin/applications/{application} — full detail (cohort, decided_by). */
export function useApplication(key: Ref<string | null>) {
  return useQuery({
    queryKey: computed(() => ['admin-application', key.value]),
    queryFn: async () => {
      const { data } = await http.get<Application>(`/admin/applications/${key.value}`)
      return data
    },
    enabled: computed(() => key.value !== null),
  })
}

/** POST /admin/applications/{application}/start-review — admissions.manage. */
export function useStartApplicationReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (key: string) => {
      const { data } = await http.post<Application>(`/admin/applications/${key}/start-review`)
      return data
    },
    onSuccess: (application) => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-application-status-counts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-application', application.key] })
    },
  })
}

export interface DecideApplicationPayload {
  key: string
  decision: 'accepted' | 'waitlisted' | 'rejected'
  /** Required by the backend when decision is 'rejected' (DecideApplicationRequest). */
  reason?: string
}

/** POST /admin/applications/{application}/decide — admissions.manage. */
export function useDecideApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ key, decision, reason }: DecideApplicationPayload) => {
      const { data } = await http.post<Application>(`/admin/applications/${key}/decide`, {
        decision,
        reason,
      })
      return data
    },
    onSuccess: (application) => {
      queryClient.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient.invalidateQueries({ queryKey: ['admin-application-status-counts'] })
      queryClient.invalidateQueries({ queryKey: ['admin-application', application.key] })
    },
  })
}

export interface DecideEquipmentReviewPayload {
  key: string
  decision: 'approved' | 'rejected' | 'needs_info'
  reason?: string
}

/** POST /moderation/equipment-reviews/{review}/decide — equipment.review or admissions.manage */
export function useDecideEquipmentReview() {
  let queryClient: ReturnType<typeof useQueryClient> | null = null
  try {
    queryClient = useQueryClient()
  } catch {
    // Vue query client not found in test context
  }

  return useMutation({
    mutationFn: async ({ key, decision, reason }: DecideEquipmentReviewPayload) => {
      const { data } = await http.post(`/moderation/equipment-reviews/${key}/decide`, {
        decision,
        reason,
      })
      return data
    },
    onSuccess: () => {
      queryClient?.invalidateQueries({ queryKey: ['admin-applications'] })
      queryClient?.invalidateQueries({ queryKey: ['admin-application-status-counts'] })
      queryClient?.invalidateQueries({ queryKey: ['admin-application'] })
    },
  })
}
