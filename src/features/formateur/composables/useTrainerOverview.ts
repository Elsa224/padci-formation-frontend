import { useQuery } from '@tanstack/vue-query'
import { apiMeta, http } from '@/api/http'
import type { Cohort } from '@/features/admin/composables/useCohorts'

/** `PendingGradingResource` shape. */
export interface PendingGradingAttempt {
  key: string
  status: string
  submitted_at: string | null
  assessment?: { key: string; title: string }
  course?: { key: string; title: string }
  learner?: { key: string; name: string }
  pending_answers: Array<{ answer_key: string; question_key: string | null }>
}

/**
 * GET /admin/assessments/attempts/pending-grading — scoped server-side to
 * the courses the trainer may see. The resource carries no answer text yet,
 * so this only powers counts and a list, not a grading screen.
 */
export function usePendingGrading() {
  return useQuery({
    queryKey: ['trainer-pending-grading'],
    queryFn: async () => {
      const response = await http.get<PendingGradingAttempt[]>(
        '/admin/assessments/attempts/pending-grading',
        { params: { per_page: 25 } },
      )
      return {
        items: response.data,
        total: apiMeta(response)?.pagination?.total ?? response.data.length,
      }
    },
  })
}

/** Local calendar date as YYYY-MM-DD, comparable with the API's date strings. */
function localDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Sessions that have not started yet, soonest first. An `open` cohort that
 * started months ago is not an "upcoming" session.
 */
export function selectUpcomingCohorts(cohorts: Cohort[], now = new Date(), limit = 5): Cohort[] {
  const today = localDate(now)
  return cohorts
    .filter((cohort) => cohort.starts_at !== null && cohort.starts_at.slice(0, 10) >= today)
    .sort((a, b) => (a.starts_at ?? '').localeCompare(b.starts_at ?? ''))
    .slice(0, limit)
}

/**
 * GET /admin/cohorts filtered to planned/open sessions. The endpoint is
 * institution-wide (cohorts.view), not limited to the trainer's own
 * cohorts, so the dashboard labels it as such. It has no date sort, so we
 * take the largest page allowed (100) per status before sorting by date.
 */
export function useUpcomingCohorts() {
  return useQuery({
    queryKey: ['trainer-upcoming-cohorts'],
    queryFn: async () => {
      const responses = await Promise.all(
        (['open', 'planned'] as const).map((status) =>
          http.get<Cohort[]>('/admin/cohorts', { params: { status, per_page: 100 } }),
        ),
      )
      return selectUpcomingCohorts(responses.flatMap((response) => response.data))
    },
  })
}
