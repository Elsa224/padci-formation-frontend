import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRef } from 'vue'
import { apiMeta, http } from '@/api/http'

/**
 * Trainer side of the Assessment module. Authoring (create, publish,
 * delete) needs an editable course (draft/rejected — CoursePolicy::update);
 * exam scheduling stays possible after publication
 * (CoursePolicy::scheduleAssessments). The server enforces both.
 */

export type QuestionType = 'single_choice' | 'multiple_choice' | 'true_false' | 'free_text'

/** `AdminAssessmentResource`. */
export interface TrainerAssessment {
  key: string
  title: string
  version: number
  status: 'draft' | 'published' | 'archived'
  settings: { duration_minutes?: number; max_attempts?: number } | null
  scheduled_at: string | null
  delivery_mode: 'online' | 'offline' | null
  location: string | null
  schedule_published_at: string | null
  questions_count?: number
  max_score?: number | string | null
}

export interface DraftOption {
  body: string
  is_correct: boolean
}

export interface DraftQuestion {
  type: QuestionType
  prompt: string
  points: number
  explanation: string
  options: DraftOption[]
}

export interface CreateAssessmentPayload {
  title: string
  settings: { duration_minutes: number; max_attempts: number }
  questions: Array<{
    type: QuestionType
    prompt: string
    points: number
    explanation?: string | null
    options?: DraftOption[]
  }>
}

export const questionTypeLabels: Record<QuestionType, string> = {
  single_choice: 'Choix unique',
  multiple_choice: 'Choix multiples',
  true_false: 'Vrai / Faux',
  free_text: 'Réponse libre (corrigée par vous)',
}

export function emptyQuestion(type: QuestionType = 'single_choice'): DraftQuestion {
  return {
    type,
    prompt: '',
    points: 1,
    explanation: '',
    options:
      type === 'true_false'
        ? [
            { body: 'Vrai', is_correct: true },
            { body: 'Faux', is_correct: false },
          ]
        : type === 'free_text'
          ? []
          : [
              { body: '', is_correct: true },
              { body: '', is_correct: false },
            ],
  }
}

/**
 * Client-side checks mirroring AssessmentAuthoring, for an immediate answer;
 * the server validates again. Returns one message per invalid question.
 */
export function validateQuestions(questions: DraftQuestion[]): string[] {
  const errors: string[] = []
  if (questions.length === 0) errors.push('Ajoutez au moins une question.')
  questions.forEach((question, index) => {
    const n = index + 1
    if (!question.prompt.trim()) errors.push(`Question ${n} : l'énoncé est vide.`)
    if (question.points < 1) errors.push(`Question ${n} : au moins 1 point.`)
    if (question.type === 'free_text') return
    const options = question.options.filter((option) => option.body.trim())
    const correct = options.filter((option) => option.is_correct).length
    if (options.length < 2) errors.push(`Question ${n} : au moins deux réponses.`)
    if (correct === 0) errors.push(`Question ${n} : indiquez la bonne réponse.`)
    if (question.type !== 'multiple_choice' && correct > 1) {
      errors.push(`Question ${n} : une seule bonne réponse pour ce type.`)
    }
  })
  return errors
}

export function toPayload(
  title: string,
  durationMinutes: number,
  maxAttempts: number,
  questions: DraftQuestion[],
): CreateAssessmentPayload {
  return {
    title: title.trim(),
    settings: { duration_minutes: durationMinutes, max_attempts: maxAttempts },
    questions: questions.map((question) => ({
      type: question.type,
      prompt: question.prompt.trim(),
      points: question.points,
      explanation: question.explanation.trim() || null,
      ...(question.type === 'free_text'
        ? {}
        : {
            options: question.options
              .filter((option) => option.body.trim())
              .map((option) => ({ body: option.body.trim(), is_correct: option.is_correct })),
          }),
    })),
  }
}

/** GET /admin/courses/{course}/assessments. */
export function useCourseAssessmentsAdmin(courseKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['trainer-assessments', toValue(courseKey)]),
    queryFn: async () =>
      (await http.get<TrainerAssessment[]>(`/admin/courses/${toValue(courseKey)}/assessments`))
        .data,
  })
}

function useAssessmentMutation<TVariables>(
  courseKey: MaybeRef<string>,
  request: (variables: TVariables) => Promise<unknown>,
) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['trainer-assessments', toValue(courseKey)] }),
  })
}

/** POST /admin/courses/{course}/assessments — created as draft. */
export function useCreateAssessment(courseKey: MaybeRef<string>) {
  return useAssessmentMutation(
    courseKey,
    async (payload: CreateAssessmentPayload) =>
      (
        await http.post<TrainerAssessment>(
          `/admin/courses/${toValue(courseKey)}/assessments`,
          payload,
        )
      ).data,
  )
}

/** POST /admin/assessments/{assessment}/publish. */
export function usePublishAssessment(courseKey: MaybeRef<string>) {
  return useAssessmentMutation(courseKey, (assessmentKey: string) =>
    http.post(`/admin/assessments/${assessmentKey}/publish`),
  )
}

/** DELETE /admin/assessments/{assessment} — drafts only. */
export function useDeleteAssessment(courseKey: MaybeRef<string>) {
  return useAssessmentMutation(courseKey, (assessmentKey: string) =>
    http.delete(`/admin/assessments/${assessmentKey}`),
  )
}

export interface SchedulePayload {
  assessmentKey: string
  scheduled_at: string
  delivery_mode: 'online' | 'offline'
  location: string | null
}

/**
 * POST /admin/assessments/{a}/schedule then …/schedule/publish: fixing the
 * date and announcing it are two steps server-side; publishing notifies
 * enrolled learners.
 */
export function useScheduleExam(courseKey: MaybeRef<string>) {
  return useAssessmentMutation(
    courseKey,
    async ({ assessmentKey, ...payload }: SchedulePayload) => {
      await http.post(`/admin/assessments/${assessmentKey}/schedule`, payload)
    },
  )
}

export function usePublishSchedule(courseKey: MaybeRef<string>) {
  return useAssessmentMutation(courseKey, (assessmentKey: string) =>
    http.post(`/admin/assessments/${assessmentKey}/schedule/publish`),
  )
}

// ── Manual grading ──────────────────────────────────────────────────────

/** `PendingGradingResource` (emsp-api feat/grading-answer-payload). */
export interface PendingAnswer {
  answer_key: string
  question_key: string | null
  question_prompt: string | null
  question_points: number
  question_position: number
  response: string | null
}

export interface PendingAttempt {
  key: string
  status: string
  submitted_at: string | null
  assessment?: { key: string; title: string }
  course?: { key: string; title: string }
  learner?: { key: string; name: string }
  pending_answers: PendingAnswer[]
}

/** GET /admin/assessments/attempts/pending-grading — scoped server-side. */
export function usePendingAttempts() {
  return useQuery({
    queryKey: ['trainer-pending-grading'],
    queryFn: async () => {
      const response = await http.get<PendingAttempt[]>(
        '/admin/assessments/attempts/pending-grading',
        { params: { per_page: 100 } },
      )
      return {
        items: response.data,
        total: apiMeta(response)?.pagination?.total ?? response.data.length,
      }
    },
  })
}

/** PATCH /admin/assessments/attempts/{attempt}/answers/{answer}/grade. */
export function useGradeAnswer() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      attemptKey: string
      answerKey: string
      awarded_points: number
      note: string | null
    }) =>
      http.patch(
        `/admin/assessments/attempts/${input.attemptKey}/answers/${input.answerKey}/grade`,
        { awarded_points: input.awarded_points, note: input.note },
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ['trainer-pending-grading'] }),
  })
}
