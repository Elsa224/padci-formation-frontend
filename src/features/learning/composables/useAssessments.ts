import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRef } from 'vue'
import { http } from '@/api/http'

/**
 * Learner side of the Assessment module (/learning/assessments, /attempts).
 * Scores and correct answers are computed and revealed server-side only once
 * an attempt is submitted (AttemptResource) - this file never grades.
 *
 * Shapes are written by hand on purpose: Scramble cannot infer the nested
 * question payloads built in closures (it emits `questions: string[]`), so
 * the generated `Schema<'AttemptResource'>` is imprecise for them.
 */

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'free_text'
export type AttemptStatus = 'in_progress' | 'submitted' | 'expired' | 'pending_grading'

export interface LearnerAssessmentAttemptSummary {
  key: string
  status: AttemptStatus | string
  score: number | null
  submitted_at: string | null
  auto_submitted: boolean
}

/** `LearnerAssessmentResource` (index: without questions). */
export interface LearnerAssessment {
  key: string
  title: string
  status: string
  settings: { duration_minutes: number; max_attempts: number }
  scheduled_at: string | null
  delivery_mode: string | null
  location: string | null
  schedule_published_at: string | null
  questions_count?: number
  max_score?: number | string | null
  attempts_used?: number
  attempts_remaining?: number
  best_score?: number | null
  last_attempt?: LearnerAssessmentAttemptSummary | null
}

export interface AttemptOption {
  key: string
  body: string
  position: number
}

export interface AttemptQuestion {
  key: string
  type: QuestionType
  prompt: string
  points: number
  position: number
  options: AttemptOption[]
  selected_option_keys: string[]
  free_text_response: string | null
  /** Present only once the attempt is submitted. */
  result?: {
    correct_option_keys: string[]
    explanation: string | null
    awarded_points: number
    is_correct: boolean | null
    grading_note: string | null
  }
}

/** `AttemptResource`. */
export interface Attempt {
  key: string
  status: AttemptStatus
  assessment?: { key: string; title: string }
  score: number | null
  max_score: number
  started_at: string
  expires_at: string | null
  submitted_at: string | null
  auto_submitted?: boolean
  questions: AttemptQuestion[]
}

export interface AnswerPayload {
  option_keys?: string[]
  free_text_response?: string | null
}

/** GET /learning/courses/{course}/assessments - published assessments only. */
export function useCourseAssessments(
  courseKey: MaybeRef<string>,
  enabled: MaybeRef<boolean> = true,
) {
  return useQuery({
    queryKey: computed(() => ['learning-assessments', toValue(courseKey)]),
    enabled: computed(() => toValue(enabled) && toValue(courseKey) !== ''),
    queryFn: async () =>
      (await http.get<LearnerAssessment[]>(`/learning/courses/${toValue(courseKey)}/assessments`))
        .data,
  })
}

/**
 * POST /learning/assessments/{assessment}/attempts. Returns the attempt in
 * progress when one exists (resume), otherwise starts a new one; a 422
 * explains why (attempts exhausted, exam window closed…).
 */
export function useStartAttempt() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (assessmentKey: string) =>
      (await http.post<Attempt>(`/learning/assessments/${assessmentKey}/attempts`)).data,
    onSuccess: (attempt) => client.setQueryData(['learning-attempt', attempt.key], attempt),
  })
}

/** GET /learning/attempts/{attempt}. */
export function useAttempt(attemptKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['learning-attempt', toValue(attemptKey)]),
    queryFn: async () =>
      (await http.get<Attempt>(`/learning/attempts/${toValue(attemptKey)}`)).data,
  })
}

/** PUT /learning/attempts/{attempt}/answers/{question} - saves one answer. */
export function useSaveAnswer(attemptKey: MaybeRef<string>) {
  return useMutation({
    mutationFn: async ({ questionKey, ...payload }: AnswerPayload & { questionKey: string }) =>
      (
        await http.put<Attempt>(
          `/learning/attempts/${toValue(attemptKey)}/answers/${questionKey}`,
          payload,
        )
      ).data,
  })
}

/** POST /learning/attempts/{attempt}/submit - server computes the score. */
export function useSubmitAttempt(attemptKey: MaybeRef<string>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async () =>
      (await http.post<Attempt>(`/learning/attempts/${toValue(attemptKey)}/submit`)).data,
    onSuccess: (attempt) => client.setQueryData(['learning-attempt', attempt.key], attempt),
  })
}

/** Seconds left before `expires_at`, never negative; null when untimed. */
export function secondsLeft(expiresAt: string | null, now: number): number | null {
  if (!expiresAt) return null
  return Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000))
}

export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export const attemptStatusLabels: Record<AttemptStatus, string> = {
  in_progress: 'En cours',
  submitted: 'Terminée',
  expired: 'Temps écoulé',
  pending_grading: 'En attente de correction',
}
