import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRef } from 'vue'
import { apiMeta, http } from '@/api/http'
import type { ApiPaginationMeta, EquipmentRequirements, Pathway, PublicCohort } from '@/api/types'

export type { EquipmentRequirements, Pathway, PublicCohort }

export interface CatalogCourse {
  id: number
  key: string
  slug: string
  title: string
  summary: string | null
  description: string | null
  level: string
  language: string
  visibility: string
  status: string
  price_minor: number
  currency: string
  pathway?: {
    id: number
    key: string
    code: string
    name: string
    slug: string
  } | null
  owner?: {
    id: number
    key: string
    name: string
  } | null
}

/**
 * Public catalog: pathways list.
 */
export function usePathways() {
  return useQuery({
    queryKey: ['catalog-pathways'],
    queryFn: async () => {
      const response = await http.get<Pathway[]>('/catalog/pathways', {
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
 * Public catalog: single pathway detail.
 */
export function usePathway(key: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['catalog-pathway', toValue(key)]),
    enabled: computed(() => Boolean(toValue(key))),
    queryFn: async () => {
      const { data } = await http.get<Pathway>(`/catalog/pathways/${toValue(key)}`)
      return data
    },
  })
}

/**
 * Sessions (cohorts) for a pathway with computed availability (ADR-012).
 */
export function usePathwayCohorts(key: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['catalog-pathway-cohorts', toValue(key)]),
    enabled: computed(() => Boolean(toValue(key))),
    queryFn: async () => {
      const { data } = await http.get<PublicCohort[]>(`/catalog/pathways/${toValue(key)}/cohorts`)
      return data
    },
  })
}

/**
 * Published courses in a pathway.
 */
export function usePathwayCourses(pathwayKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['catalog-courses', toValue(pathwayKey)]),
    enabled: computed(() => Boolean(toValue(pathwayKey))),
    queryFn: async () => {
      const response = await http.get<CatalogCourse[]>('/catalog/courses', {
        params: {
          pathway_key: toValue(pathwayKey),
          per_page: 50,
        },
      })
      return {
        items: response.data,
        pagination: apiMeta(response)?.pagination ?? (null as ApiPaginationMeta | null),
      }
    },
  })
}
