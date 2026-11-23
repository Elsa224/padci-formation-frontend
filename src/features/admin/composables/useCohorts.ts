import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type Ref } from 'vue'
import { apiMeta, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'

export interface CohortTrainer {
  id: number
  key: string
  name: string
  email: string
  cohort_role: string
}

/** `CohortResource` shape. */
export interface Cohort {
  id: number
  key: string
  code: string
  name: string
  session: string | null
  capacity: number | null
  enrolled_count?: number
  available_seats?: number
  is_full?: boolean
  starts_at: string | null
  ends_at: string | null
  offline_starts_at?: string | null
  offline_ends_at?: string | null
  status: 'planned' | 'open' | 'running' | 'completed' | 'cancelled'
  pathway?: { id: number; key: string; code: string; name: string }
  trainers?: CohortTrainer[]
  enrollments_count?: number
  drained_standby_count?: number
  created_at: string
  updated_at: string
}

export interface CohortListFilters {
  pathwayKey?: string
  status?: string
  q?: string
  page?: number
}

/** GET /admin/cohorts - cohorts.view. */
export function useCohorts(filters: Ref<CohortListFilters>) {
  return useQuery({
    queryKey: computed(() => ['admin-cohorts', filters.value]),
    queryFn: async () => {
      const response = await http.get<Cohort[]>('/admin/cohorts', {
        params: {
          pathway_key: filters.value.pathwayKey || undefined,
          status: filters.value.status || undefined,
          q: filters.value.q || undefined,
          page: filters.value.page ?? 1,
          per_page: 100,
        },
      })

      return {
        items: response.data,
        pagination: apiMeta(response)?.pagination ?? (null as ApiPaginationMeta | null),
      }
    },
  })
}

export interface CreateCohortPayload {
  pathway_key: string
  code?: string
  name?: string
  session?: string | null
  capacity?: number | null
  starts_at: string
  ends_at: string
  offline_starts_at?: string
  offline_ends_at?: string
  status?: string
}

export interface UpdateCohortPayload {
  name?: string
  code?: string
  session?: string | null
  capacity?: number | null
  starts_at?: string
  ends_at?: string
  offline_starts_at?: string | null
  offline_ends_at?: string | null
  status?: string
}

export interface CreateCohortResult {
  cohort: Cohort
  drained_standby_count: number
}

/** POST /admin/cohorts - cohorts.manage. */
export function useCreateCohort() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateCohortPayload): Promise<CreateCohortResult> => {
      const response = await http.post<Cohort>('/admin/cohorts', payload)
      const meta = apiMeta(response) as { drained_standby_count?: number } | null
      const drained =
        meta?.drained_standby_count ??
        (response.data as { drained_standby_count?: number })?.drained_standby_count ??
        0
      return {
        cohort: response.data,
        drained_standby_count: drained,
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cohorts'] })
    },
  })
}

export { useCohortMembers, type CohortMember, type CohortMemberFilters } from './useCohortMembers'
