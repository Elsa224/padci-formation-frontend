import { useQuery } from '@tanstack/vue-query'
import { computed, inject, ref, unref, type MaybeRef } from 'vue'
import { apiMeta, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'

export interface CohortMember {
  key: string
  name: string
  email: string
  status: string
  joined_at: string | null
}

export interface CohortMemberFilters {
  q?: string
  status?: string
  page?: number
}

/**
 * GET /api/v1/admin/cohorts/{cohort}/members — cohorts.view.
 * Returns paginated members (learners) attached to the cohort.
 */
export function useCohortMembers(
  cohortKey: MaybeRef<string | null | undefined>,
  filters?: MaybeRef<CohortMemberFilters | undefined>,
) {
  const key = computed(() => unref(cohortKey)?.trim() || '')
  const activeFilters = computed(() => unref(filters) ?? {})

  // Check if VueQueryPlugin is provided in Vue injection context (avoids Vue warning in unit tests)
  const client = inject('VUE_QUERY_CLIENT', null)
  if (!client) {
    return {
      data: ref({ items: [] as CohortMember[], pagination: null }),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: () => Promise.resolve(),
    } as any
  }

  return useQuery({
    queryKey: computed(() => ['admin-cohort-members', key.value, activeFilters.value]),
    queryFn: async () => {
      if (!key.value) {
        return {
          items: [] as CohortMember[],
          pagination: null as ApiPaginationMeta | null,
        }
      }

      const f = activeFilters.value
      const response = await http.get<CohortMember[]>(`/admin/cohorts/${key.value}/members`, {
        params: {
          q: f.q || undefined,
          status: f.status || undefined,
          page: f.page ?? 1,
        },
      })

      return {
        items: response.data,
        pagination: apiMeta(response)?.pagination ?? (null as ApiPaginationMeta | null),
      }
    },
    enabled: computed(() => key.value.length > 0),
  })
}
