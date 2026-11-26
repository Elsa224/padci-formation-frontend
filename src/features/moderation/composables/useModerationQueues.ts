import { useQuery } from '@tanstack/vue-query'
import { apiMeta, http } from '@/api/http'

/**
 * Queue sizes and heads for the moderator's dashboard and review tabs.
 * Counts read `meta.pagination.total` from a one-item page, so they cost one
 * small request per status and share the cache with every screen.
 */

export interface ModerationCourse {
  key: string
  title: string
  status: string
  owner?: { name: string }
  pathway?: { name: string }
  updated_at?: string | null
}

export interface ModerationEquipmentReview {
  key: string
  status: string
  application?: { candidate?: { name: string } }
  pathway?: { name: string }
  created_at?: string | null
}

const COURSES = '/admin/courses'
const EQUIPMENT = '/moderation/equipment-reviews'

async function total(url: string, status: string): Promise<number> {
  const response = await http.get<unknown[]>(url, { params: { status, per_page: 1 } })
  return apiMeta(response)?.pagination?.total ?? response.data.length
}

/** Number of courses per status, e.g. { submitted: 2, in_review: 0 }. */
export function useCourseStatusCounts(statuses: readonly string[]) {
  return useQuery({
    queryKey: ['moderation-courses', 'counts', ...statuses],
    queryFn: async () =>
      Object.fromEntries(
        await Promise.all(statuses.map(async (s) => [s, await total(COURSES, s)] as const)),
      ) as Record<string, number>,
  })
}

/** Number of equipment reviews per status. */
export function useEquipmentStatusCounts(statuses: readonly string[]) {
  return useQuery({
    queryKey: ['moderation-equipment', 'counts', ...statuses],
    queryFn: async () =>
      Object.fromEntries(
        await Promise.all(statuses.map(async (s) => [s, await total(EQUIPMENT, s)] as const)),
      ) as Record<string, number>,
  })
}

/** First courses waiting for a decision (submitted, then in review). */
export function useCourseQueueHead(limit = 5) {
  return useQuery({
    queryKey: ['moderation-courses', 'head', limit],
    queryFn: async () => {
      const pages = await Promise.all(
        ['submitted', 'in_review'].map(
          async (status) =>
            (
              await http.get<ModerationCourse[]>(COURSES, {
                params: { status, per_page: limit },
              })
            ).data,
        ),
      )
      return pages.flat().slice(0, limit)
    },
  })
}

/** First equipment reviews waiting for a decision. */
export function useEquipmentQueueHead(limit = 5) {
  return useQuery({
    queryKey: ['moderation-equipment', 'head', limit],
    queryFn: async () =>
      (
        await http.get<ModerationEquipmentReview[]>(EQUIPMENT, {
          params: { status: 'pending', per_page: limit },
        })
      ).data,
  })
}
