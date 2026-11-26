import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRef } from 'vue'
import { apiMeta, ApiError, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'
import type { Schema } from '@/api/contract'
import type { ResourceMedia } from '@/features/learning/composables/useLearningCourse'

/**
 * Trainer ("formateur") side of the Catalog module. Every endpoint lives
 * under /admin/courses: the backend scopes the list to the courses the
 * current user owns (Course::scopeVisibleTo) and CoursePolicy enforces
 * ownership on writes - this file never filters anything for security.
 */

export type CourseStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'published'
  | 'rejected'
  | 'suspended'
  | 'archived'

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced'

/** `CourseResource` shape. */
export interface TrainerCourse {
  id: number
  key: string
  slug: string
  title: string
  summary: string | null
  description: string | null
  level: CourseLevel
  language: string
  visibility: string
  status: CourseStatus
  pathway?: { id: number; key: string; code: string; name: string; slug: string }
  owner?: { id: number; key: string; name: string }
  created_at: string
  updated_at: string
}

/** `LearningResourceResource` shape. */
export interface CourseResourceItem {
  id: number
  key: string
  title: string
  type: 'text' | 'link' | 'video' | 'document'
  body: string | null
  external_url: string | null
  media?: ResourceMedia | null
  visibility: 'preview' | 'enrolled' | 'download'
  position: number
}

/** Accepted document uploads: the backend document MIME allowlist. */
export const DOCUMENT_ACCEPT = '.pdf,.txt,.docx,.xlsx,.pptx'
export const DOCUMENT_MIMES = [
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]
/** config('media.max_kb') default: 20 MB. */
export const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024

export type ChapterType = 'lesson' | 'video' | 'document' | 'external_link'

/** `ChapterResource` shape. */
export interface CourseChapter {
  id: number
  key: string
  title: string
  type: ChapterType
  body: string | null
  duration_seconds: number | null
  preview_enabled: boolean
  position: number
  resources?: CourseResourceItem[]
}

/** `CourseModuleResource` shape. */
export interface CourseModule {
  id: number
  key: string
  title: string
  summary: string | null
  position: number
  chapters?: CourseChapter[]
}

/** Only draft and rejected courses accept content edits (CourseStatus::isEditable). */
export function isEditable(status: CourseStatus): boolean {
  return status === 'draft' || status === 'rejected'
}

/** Workflow `submit` transition: from draft or rejected. */
export function canSubmit(status: CourseStatus): boolean {
  return isEditable(status)
}

export const courseStatusLabels: Record<CourseStatus, string> = {
  draft: 'Brouillon',
  submitted: 'Soumis',
  in_review: "En cours d'examen",
  approved: 'Approuvé',
  published: 'Publié',
  rejected: 'Rejeté',
  suspended: 'Suspendu',
  archived: 'Archivé',
}

export const courseLevelLabels: Record<CourseLevel, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

export { safeHttpUrl } from '@/lib/safeUrl'

export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  return error instanceof ApiError ? error.displayMessage : fallback
}

export interface TrainerCourseFilters {
  status?: CourseStatus | ''
  page?: number
}

export const TRAINER_COURSES_PER_PAGE = 24

/**
 * GET /admin/courses - courses.view, scoped server-side to the owner.
 * The query key is normalized (status/page defaults spelled out) so every
 * caller asking for the same page shares one cache entry.
 */
export function useTrainerCourses(filters: MaybeRef<TrainerCourseFilters> = {}) {
  const status = computed(() => toValue(filters).status || 'all')
  const page = computed(() => toValue(filters).page ?? 1)
  return useQuery({
    queryKey: computed(() => ['trainer-courses', status.value, page.value]),
    queryFn: async () => {
      const response = await http.get<TrainerCourse[]>('/admin/courses', {
        params: {
          status: status.value === 'all' ? undefined : status.value,
          page: page.value,
          per_page: TRAINER_COURSES_PER_PAGE,
        },
      })
      return {
        items: response.data,
        pagination: apiMeta(response)?.pagination ?? (null as ApiPaginationMeta | null),
      }
    },
  })
}

/**
 * Exact number of the trainer's courses in the given statuses, read from
 * the paginator total (per_page=1) rather than counted from one page.
 */
export function useTrainerCourseCount(statuses: Array<CourseStatus | 'all'>) {
  return useQuery({
    queryKey: ['trainer-courses', 'count', ...statuses],
    queryFn: async () => {
      const totals = await Promise.all(
        statuses.map(async (status) => {
          const response = await http.get<TrainerCourse[]>('/admin/courses', {
            params: { status: status === 'all' ? undefined : status, per_page: 1 },
          })
          return apiMeta(response)?.pagination?.total ?? response.data.length
        }),
      )
      return totals.reduce((sum, total) => sum + total, 0)
    },
  })
}

/** GET /admin/courses/{course}. */
export function useTrainerCourse(courseKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['trainer-course', toValue(courseKey)]),
    queryFn: async () =>
      (await http.get<TrainerCourse>(`/admin/courses/${toValue(courseKey)}`)).data,
  })
}

/** GET /admin/courses/{course}/modules - modules with chapters and resources. */
export function useCourseModules(courseKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['trainer-course-modules', toValue(courseKey)]),
    queryFn: async () =>
      (await http.get<CourseModule[]>(`/admin/courses/${toValue(courseKey)}/modules`)).data,
  })
}

export interface CreateCoursePayload {
  pathway_key: string
  title: string
  summary?: string | null
  description?: string | null
  level?: CourseLevel
  language?: string
}

/** POST /admin/courses - courses.manage. The course starts as a draft. */
export function useCreateCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateCoursePayload) =>
      (await http.post<TrainerCourse>('/admin/courses', payload)).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['trainer-courses'] }),
  })
}

/**
 * POST /admin/courses/{course}/submit. Depending on the moderation toggle
 * (ADR-009) the course becomes `submitted` or is published directly - the
 * returned resource tells which.
 */
export function useSubmitCourse() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (courseKey: string) =>
      (await http.post<TrainerCourse>(`/admin/courses/${courseKey}/submit`)).data,
    onSuccess: (_data, courseKey) => {
      void client.invalidateQueries({ queryKey: ['trainer-courses'] })
      void client.invalidateQueries({ queryKey: ['trainer-course', courseKey] })
    },
  })
}

/** POST /admin/courses/{course}/revert-to-draft - from `rejected` only. */
export function useRevertCourseToDraft() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (courseKey: string) =>
      (await http.post<TrainerCourse>(`/admin/courses/${courseKey}/revert-to-draft`)).data,
    onSuccess: (_data, courseKey) => {
      void client.invalidateQueries({ queryKey: ['trainer-courses'] })
      void client.invalidateQueries({ queryKey: ['trainer-course', courseKey] })
    },
  })
}

function useModulesInvalidation(courseKey: MaybeRef<string>) {
  const client = useQueryClient()
  return () =>
    client.invalidateQueries({ queryKey: ['trainer-course-modules', toValue(courseKey)] })
}

export interface UpdateCoursePayload {
  title?: string
  summary?: string | null
  description?: string | null
  level?: CourseLevel
}

/** PATCH /admin/courses/{course} - while editable (draft/rejected). */
export function useUpdateCourse(courseKey: MaybeRef<string>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateCoursePayload) =>
      (await http.patch<TrainerCourse>(`/admin/courses/${toValue(courseKey)}`, payload)).data,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['trainer-course', toValue(courseKey)] })
      void client.invalidateQueries({ queryKey: ['trainer-courses'] })
    },
  })
}

/**
 * Rename or delete a node of the course structure. `path` is the part
 * after /admin/courses/{course}/, e.g. `modules/{m}` or
 * `modules/{m}/chapters/{c}/resources/{r}`. Deleting a module or chapter
 * cascades server-side to what it contains.
 */
export function useUpdateStructureNode(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: ({ path, title }: { path: string; title: string }) =>
      http.patch(`/admin/courses/${toValue(courseKey)}/${path}`, { title }),
    onSuccess: invalidate,
  })
}

export function useDeleteStructureNode(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: (path: string) => http.delete(`/admin/courses/${toValue(courseKey)}/${path}`),
    onSuccess: invalidate,
  })
}

/** POST /admin/courses/{course}/modules. */
export function useCreateModule(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: async (payload: { title: string; summary?: string | null }) =>
      (await http.post<CourseModule>(`/admin/courses/${toValue(courseKey)}/modules`, payload)).data,
    onSuccess: invalidate,
  })
}

export interface CreateChapterPayload {
  moduleKey: string
  title: string
  type: ChapterType
  body?: string | null
}

/** POST /admin/courses/{course}/modules/{module}/chapters. */
export function useCreateChapter(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: async ({ moduleKey, ...payload }: CreateChapterPayload) =>
      (
        await http.post<CourseChapter>(
          `/admin/courses/${toValue(courseKey)}/modules/${moduleKey}/chapters`,
          payload,
        )
      ).data,
    onSuccess: invalidate,
  })
}

export interface CreateResourcePayload {
  moduleKey: string
  chapterKey: string
  title: string
  /** `document` carries an uploaded file (media_key); video is not wired yet. */
  type: 'text' | 'link' | 'document'
  body?: string | null
  external_url?: string | null
  /** Key of a file the current user uploaded via POST /media. */
  media_key?: string
}

/**
 * Upload a file (POST /media, private) then attach it to the chapter as a
 * `document` resource. The backend checks the file belongs to the uploader
 * and is a document type.
 */
export function useAddDocumentResource(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: async (input: {
      moduleKey: string
      chapterKey: string
      title: string
      file: File
    }) => {
      const form = new FormData()
      form.append('file', input.file)
      const media = (
        await http.post<{ key: string }>('/media', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      ).data
      return (
        await http.post<CourseResourceItem>(
          `/admin/courses/${toValue(courseKey)}/modules/${input.moduleKey}/chapters/${input.chapterKey}/resources`,
          { title: input.title, type: 'document', media_key: media.key },
        )
      ).data
    },
    onSuccess: invalidate,
  })
}

/** POST /admin/courses/{course}/modules/{module}/chapters/{chapter}/resources. */
export function useCreateResource(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: async ({ moduleKey, chapterKey, ...payload }: CreateResourcePayload) =>
      (
        await http.post<CourseResourceItem>(
          `/admin/courses/${toValue(courseKey)}/modules/${moduleKey}/chapters/${chapterKey}/resources`,
          payload,
        )
      ).data,
    onSuccess: invalidate,
  })
}

/** POST /admin/courses/{course}/modules/reorder. */
export function useReorderModules(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: async (moduleKeys: string[]) =>
      (
        await http.post<CourseModule[]>(`/admin/courses/${toValue(courseKey)}/modules/reorder`, {
          module_keys: moduleKeys,
        })
      ).data,
    onSuccess: invalidate,
  })
}

/** POST /admin/courses/{course}/modules/{module}/chapters/reorder. */
export function useReorderChapters(courseKey: MaybeRef<string>) {
  const invalidate = useModulesInvalidation(courseKey)
  return useMutation({
    mutationFn: async ({ moduleKey, chapterKeys }: { moduleKey: string; chapterKeys: string[] }) =>
      (
        await http.post<CourseChapter[]>(
          `/admin/courses/${toValue(courseKey)}/modules/${moduleKey}/chapters/reorder`,
          { chapter_keys: chapterKeys },
        )
      ).data,
    onSuccess: invalidate,
  })
}

// ── Contract drift guard ───────────────────────────────────────────────
// Compile-time only: if the generated contract (src/api/schema.d.ts) stops
// matching these hand-written shapes, `npm run type-check` fails here.
type ContractCourse = Schema<'CourseResource'>
type ContractResource = Schema<'LearningResourceResource'>
export type _CourseMatchesContract =
  ContractCourse extends Pick<TrainerCourse, 'key' | 'title' | 'status' | 'level' | 'summary'>
    ? true
    : never
export type _ResourceMatchesContract =
  ContractResource extends Pick<CourseResourceItem, 'key' | 'title' | 'type' | 'external_url'>
    ? true
    : never
const _contractChecks: [_CourseMatchesContract, _ResourceMatchesContract] = [true, true]
void _contractChecks
