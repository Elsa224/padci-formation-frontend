import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRef } from 'vue'
import { apiMeta, ApiError, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'

/**
 * Trainer ("formateur") side of the Catalog module. Every endpoint lives
 * under /admin/courses: the backend scopes the list to the courses the
 * current user owns (Course::scopeVisibleTo) and CoursePolicy enforces
 * ownership on writes — this file never filters anything for security.
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
  visibility: 'preview' | 'enrolled' | 'download'
  position: number
}

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

export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  return error instanceof ApiError ? error.displayMessage : fallback
}

export interface TrainerCourseFilters {
  status?: CourseStatus | ''
  page?: number
}

/** GET /admin/courses — courses.view, scoped server-side to the owner. */
export function useTrainerCourses(filters: MaybeRef<TrainerCourseFilters> = {}) {
  return useQuery({
    queryKey: computed(() => ['trainer-courses', toValue(filters)]),
    queryFn: async () => {
      const current = toValue(filters)
      const response = await http.get<TrainerCourse[]>('/admin/courses', {
        params: {
          status: current.status || undefined,
          page: current.page ?? 1,
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

/** GET /admin/courses/{course}. */
export function useTrainerCourse(courseKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['trainer-course', toValue(courseKey)]),
    queryFn: async () =>
      (await http.get<TrainerCourse>(`/admin/courses/${toValue(courseKey)}`)).data,
  })
}

/** GET /admin/courses/{course}/modules — modules with chapters and resources. */
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

/** POST /admin/courses — courses.manage. The course starts as a draft. */
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
 * (ADR-009) the course becomes `submitted` or is published directly — the
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

/** POST /admin/courses/{course}/revert-to-draft — from `rejected` only. */
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
  /** Media-backed types (video/document) are not wired to uploads server-side yet. */
  type: 'text' | 'link'
  body?: string | null
  external_url?: string | null
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
