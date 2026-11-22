import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRef } from 'vue'
import { apiMeta, ApiError, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'

/**
 * Admin operations (P3): course settings, catalogue (programmes/pathways),
 * enrollments, certificates, external certifications and audit. Every
 * endpoint is guarded server-side by its own permission; nothing here
 * decides who may do what.
 */

export function apiMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  return error instanceof ApiError ? error.displayMessage : fallback
}

export interface Paged<T> {
  items: T[]
  pagination: ApiPaginationMeta | null
}

async function getPaged<T>(url: string, params: Record<string, unknown>): Promise<Paged<T>> {
  const response = await http.get<T[]>(url, { params })
  return { items: response.data, pagination: apiMeta(response)?.pagination ?? null }
}

/** Drop empty filters so they are not sent as `?status=`. */
function clean(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== '' && value !== null && value !== undefined,
    ),
  )
}

function useInvalidatingMutation<TVariables, TResult = unknown>(
  keys: string[][],
  request: (variables: TVariables) => Promise<TResult>,
) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: request,
    onSuccess: () => keys.forEach((queryKey) => void client.invalidateQueries({ queryKey })),
  })
}

// ── Reports ─────────────────────────────────────────────────────────────

/** GET /admin/dashboard/reports/cohorts — per-cohort enrollment/completion. */
export interface CohortMetrics {
  cohort_key: string
  code: string
  name: string
  pathway_name: string | null
  enrolled_count: number
  completed_count: number
  /** 0..1 ratio. */
  completion_rate: number
  certificates_issued: number
  attendance_sessions_count?: number
  attendance_rate?: number | null
}

export function useDashboardByCohort() {
  return useQuery({
    queryKey: ['admin-dashboard-by-cohort'],
    queryFn: async () => (await http.get<CohortMetrics[]>('/admin/dashboard/reports/cohorts')).data,
  })
}

// ── Course settings (ADR-009 moderation toggle) ─────────────────────────

export interface CourseSettings {
  course_moderation_enabled: boolean
}

/** GET/PATCH /admin/settings/courses — courses.settings.manage. */
export function useCourseSettings() {
  return useQuery({
    queryKey: ['admin-course-settings'],
    queryFn: async () => (await http.get<CourseSettings>('/admin/settings/courses')).data,
  })
}

export function useUpdateCourseSettings() {
  return useInvalidatingMutation(
    [['admin-course-settings']],
    async (payload: CourseSettings) =>
      (await http.patch<CourseSettings>('/admin/settings/courses', payload)).data,
  )
}

// ── Catalogue: programmes and pathways ─────────────────────────────────

export type ProgrammeStatus = 'planned' | 'active' | 'completed' | 'archived'

export interface Programme {
  key: string
  code: string
  name: string
  description: string | null
  starts_at: string | null
  ends_at: string | null
  status: ProgrammeStatus
  pathways_count?: number
}

export interface EquipmentRequirements {
  min_cpu?: string | null
  min_ram_gb?: number | null
  min_storage_gb?: number | null
  notes?: string | null
}

export interface AdminPathway {
  key: string
  code: string
  name: string
  slug: string
  description: string | null
  equipment_requirements: EquipmentRequirements | null
  requires_equipment_validation: boolean
  icon: string | null
  position: number
  is_active: boolean
  programme?: { key: string; code: string; name: string }
  courses_count?: number
  cohorts_count?: number
}

export const programmeStatusLabels: Record<ProgrammeStatus, string> = {
  planned: 'Planifié',
  active: 'Actif',
  completed: 'Terminé',
  archived: 'Archivé',
}

export function useProgrammes() {
  return useQuery({
    queryKey: ['admin-programmes'],
    queryFn: () => getPaged<Programme>('/admin/programmes', { per_page: 100 }),
  })
}

export function useAdminPathways() {
  return useQuery({
    queryKey: ['admin-pathways'],
    queryFn: () => getPaged<AdminPathway>('/admin/pathways', { per_page: 100 }),
  })
}

const catalogueKeys = [['admin-programmes'], ['admin-pathways'], ['catalog-pathways']]

export function useSaveProgramme() {
  return useInvalidatingMutation(
    catalogueKeys,
    ({ key, ...payload }: Partial<Programme> & { key?: string }) =>
      key
        ? http.patch(`/admin/programmes/${key}`, payload)
        : http.post('/admin/programmes', payload),
  )
}

export function useDeleteProgramme() {
  return useInvalidatingMutation(catalogueKeys, (key: string) =>
    http.delete(`/admin/programmes/${key}`),
  )
}

export type PathwayPayload = Partial<
  Omit<AdminPathway, 'programme' | 'courses_count' | 'cohorts_count'>
> & { programme_key?: string }

export function useSavePathway() {
  return useInvalidatingMutation(catalogueKeys, ({ key, ...payload }: PathwayPayload) =>
    key ? http.patch(`/admin/pathways/${key}`, payload) : http.post('/admin/pathways', payload),
  )
}

export function useDeletePathway() {
  return useInvalidatingMutation(catalogueKeys, (key: string) =>
    http.delete(`/admin/pathways/${key}`),
  )
}

// ── Enrollments ─────────────────────────────────────────────────────────

export type EnrollmentStatus = 'active' | 'suspended' | 'completed' | 'revoked'

export interface AdminEnrollment {
  key: string
  status: EnrollmentStatus
  user?: { key: string; name: string; email: string }
  cohort?: { key: string; code: string; name: string }
  course?: { key: string; title: string }
  created_at?: string
}

export const enrollmentStatusLabels: Record<EnrollmentStatus, string> = {
  active: 'Active',
  suspended: 'Suspendue',
  completed: 'Terminée',
  revoked: 'Révoquée',
}

export interface EnrollmentFilters {
  status?: string
  cohort_key?: string
  q?: string
  page?: number
}

export function useAdminEnrollments(filters: MaybeRef<EnrollmentFilters>) {
  return useQuery({
    queryKey: computed(() => ['admin-enrollments', toValue(filters)]),
    queryFn: () =>
      getPaged<AdminEnrollment>('/admin/enrollments', clean({ ...toValue(filters), per_page: 50 })),
  })
}

export type EnrollmentAction = 'suspend' | 'revoke' | 'reinstate' | 'complete'

/** POST /admin/enrollments/{enrollment}/{action} — suspend/revoke take a reason. */
export function useEnrollmentAction() {
  return useInvalidatingMutation(
    [['admin-enrollments']],
    ({ key, action, reason }: { key: string; action: EnrollmentAction; reason?: string | null }) =>
      http.post(
        `/admin/enrollments/${key}/${action}`,
        action === 'suspend' || action === 'revoke' ? { reason: reason || null } : undefined,
      ),
  )
}

// ── Certificates ────────────────────────────────────────────────────────

export interface AdminCertificate {
  key: string
  status: 'pending' | 'issued' | 'revoked'
  holder?: { key: string; name: string; email: string }
  course?: { key: string; title: string }
  revoked_by?: { key: string; name: string } | null
  revocation_reason: string | null
  issued_at: string | null
  revoked_at: string | null
}

export function useAdminCertificates(filters: MaybeRef<{ status?: string; page?: number }>) {
  return useQuery({
    queryKey: computed(() => ['admin-certificates', toValue(filters)]),
    queryFn: () =>
      getPaged<AdminCertificate>(
        '/admin/certificates',
        clean({ ...toValue(filters), per_page: 50 }),
      ),
  })
}

export function useRevokeCertificate() {
  return useInvalidatingMutation(
    [['admin-certificates']],
    ({ key, reason }: { key: string; reason: string }) =>
      http.post(`/admin/certificates/${key}/revoke`, { reason }),
  )
}

// ── External certifications (Cisco, Oracle…) ────────────────────────────

export interface AdminExternalCertification {
  key: string
  provider: 'cisco' | 'oracle' | 'other'
  provider_label: string | null
  name: string
  credential_id: string | null
  issued_at: string | null
  expires_at: string | null
  is_expired: boolean
  holder?: { key: string; name: string; email?: string }
  recorded_by?: { key: string; name: string } | null
}

export function useAdminExternalCertifications() {
  return useQuery({
    queryKey: ['admin-external-certifications'],
    queryFn: () =>
      getPaged<AdminExternalCertification>('/admin/external-certifications', { per_page: 100 }),
  })
}

export interface ExternalCertificationPayload {
  user_key: string
  provider: 'cisco' | 'oracle' | 'other'
  provider_label?: string | null
  name: string
  credential_id?: string | null
  issued_at?: string | null
  expires_at?: string | null
}

export function useCreateExternalCertification() {
  return useInvalidatingMutation(
    [['admin-external-certifications']],
    (payload: ExternalCertificationPayload) => http.post('/admin/external-certifications', payload),
  )
}

export function useDeleteExternalCertification() {
  return useInvalidatingMutation([['admin-external-certifications']], (key: string) =>
    http.delete(`/admin/external-certifications/${key}`),
  )
}

/** GET /admin/users?q= — to pick the learner of a certification. */
export function useUserSearch(term: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['admin-user-search', toValue(term)]),
    enabled: computed(() => toValue(term).trim().length >= 2),
    queryFn: async () =>
      (
        await http.get<Array<{ key: string; name: string; email: string }>>('/admin/users', {
          params: { q: toValue(term).trim(), per_page: 10 },
        })
      ).data,
  })
}

// ── Audit ───────────────────────────────────────────────────────────────

export interface AuditLog {
  key: string
  action: string
  actor: { key: string; name: string } | null
  target_type: string | null
  target_key: string | null
  metadata: Record<string, unknown> | null
  ip: string | null
  created_at: string
}

export interface AuthEvent {
  key: string
  event: string
  user_key: string | null
  email: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

export function useAuditLogs(
  filters: MaybeRef<{ action?: string; from?: string; to?: string; page?: number }>,
) {
  return useQuery({
    queryKey: computed(() => ['admin-audit-logs', toValue(filters)]),
    queryFn: () =>
      getPaged<AuditLog>('/admin/audit-logs', clean({ ...toValue(filters), per_page: 50 })),
  })
}

export function useAuthEvents(
  filters: MaybeRef<{ event?: string; email?: string; page?: number }>,
) {
  return useQuery({
    queryKey: computed(() => ['admin-auth-events', toValue(filters)]),
    queryFn: () =>
      getPaged<AuthEvent>('/admin/auth-events', clean({ ...toValue(filters), per_page: 50 })),
  })
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—'
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  )
}

const percentFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

/** 0..1 ratio → "42,5 %" (French decimal comma). */
export function formatPercent(ratio: number): string {
  return `${percentFormatter.format(ratio * 100)} %`
}

/** 0..1 ratio → "42,5" for CSV cells (French Excel reads the comma). */
export function percentNumber(ratio: number): string {
  return percentFormatter.format(ratio * 100)
}
