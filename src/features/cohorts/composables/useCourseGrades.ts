import { computed, toValue, type MaybeRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { http } from '@/api/http'
import type { components } from '@/api/schema'

export type CourseGrade = components['schemas']['CourseGradeResource']

export interface GradeRow {
  learner: { key: string; name: string; email: string }
  grade: CourseGrade | null
}

export interface GradeInput {
  learner_key: string
  score: number | null
  appreciation?: string | null
}

/** GET /admin/cohorts/{cohort}/grades?course_key=… — une ligne par apprenant. */
export function useCohortGrades(cohortKey: MaybeRef<string>, courseKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['course-grades', toValue(cohortKey), toValue(courseKey)]),
    enabled: computed(() => Boolean(toValue(cohortKey) && toValue(courseKey))),
    queryFn: async () =>
      (
        await http.get<GradeRow[]>(`/admin/cohorts/${toValue(cohortKey)}/grades`, {
          params: { course_key: toValue(courseKey) },
        })
      ).data,
  })
}

/** PUT /admin/cohorts/{cohort}/grades — enregistre le lot de notes saisies. */
export function useSaveGrades(cohortKey: MaybeRef<string>, courseKey: MaybeRef<string>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (grades: GradeInput[]) =>
      (
        await http.put<GradeRow[]>(`/admin/cohorts/${toValue(cohortKey)}/grades`, {
          course_key: toValue(courseKey),
          grades,
        })
      ).data,
    onSuccess: (rows) =>
      client.setQueryData(['course-grades', toValue(cohortKey), toValue(courseKey)], rows),
  })
}

/** GET /grades — notes de l'apprenant connecté. */
export function useMyGrades() {
  return useQuery({
    queryKey: ['my-grades'],
    queryFn: async () => (await http.get<CourseGrade[]>('/grades')).data,
  })
}

/** 14.5 → « 14,5 ». */
export function formatScore(score: number): string {
  return score.toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}
