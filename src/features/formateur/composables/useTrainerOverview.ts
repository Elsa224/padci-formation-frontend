import { useQuery } from '@tanstack/vue-query'
import { http } from '@/api/http'
import type { Cohort } from '@/features/admin/composables/useCohorts'

/**
 * Pending grading lives in useTrainerAssessments (one query, one cache key);
 * re-exported here for the dashboard.
 */
export {
  usePendingAttempts as usePendingGrading,
  type PendingAttempt as PendingGradingAttempt,
} from './useTrainerAssessments'

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
 * GET /admin/cohorts filtered to planned/open sessions. Server-side the
 * list is scoped to the cohorts the trainer teaches (Cohort::scopeVisibleTo,
 * emsp-api fix/cohort-trainer-scope). It has no date sort, so we take the
 * largest page allowed (100) per status before sorting by date.
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
