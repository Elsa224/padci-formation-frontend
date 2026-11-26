import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationReturnType,
  type UseQueryReturnType,
} from '@tanstack/vue-query'
import { computed, inject, ref, unref, type MaybeRef } from 'vue'
import { http, type ApiError } from '@/api/http'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused'

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  late: 'En retard',
  excused: 'Excusé',
}

export interface AttendanceRecord {
  key: string
  status: AttendanceStatus
  status_label: string
  note: string | null
  marked_at: string | null
  enrollment_key?: string
  learner?: {
    key: string
    name: string
    email: string
  }
  marked_by?: {
    key: string
    name: string
  } | null
}

export interface AttendanceSession {
  key: string
  date: string
  title: string | null
  starts_at_time: string | null
  ends_at_time: string | null
  cohort_key?: string
  creator?: {
    key: string
    name: string
  } | null
  stats?: {
    total: number
    present: number
    absent: number
    late: number
    excused: number
    rate: number
  }
  attendances?: AttendanceRecord[]
  created_at?: string
}

export interface LearnerAttendanceSummary {
  enrollment_key: string
  learner: {
    key: string
    name: string
    email: string
  }
  total_sessions: number
  present: number
  absent: number
  late: number
  excused: number
  rate: number
}

export interface CohortAttendanceSummary {
  cohort_key: string
  total_sessions: number
  learners: LearnerAttendanceSummary[]
}

export interface CreateAttendanceSessionPayload {
  date: string
  title?: string | null
  starts_at_time: string
  ends_at_time?: string | null
}

export interface UpdateAttendanceBatchPayload {
  title?: string | null
  starts_at_time?: string | null
  ends_at_time?: string | null
  attendances: Array<{
    key: string
    status: AttendanceStatus
    note?: string | null
  }>
}

/** GET /api/v1/admin/cohorts/{cohort}/attendance/sessions */
export function useCohortAttendanceSessions(cohortKey: MaybeRef<string | null | undefined>) {
  const key = computed(() => unref(cohortKey)?.trim() || '')
  const client = inject('VUE_QUERY_CLIENT', null)
  if (!client) {
    return {
      data: ref([] as AttendanceSession[]),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: () => Promise.resolve(),
    } as unknown as UseQueryReturnType<AttendanceSession[], ApiError>
  }

  return useQuery({
    queryKey: computed(() => ['cohort-attendance-sessions', key.value]),
    queryFn: async () => {
      if (!key.value) return []
      const res = await http.get<AttendanceSession[]>(
        `/admin/cohorts/${key.value}/attendance/sessions`,
      )
      return res.data
    },
    enabled: computed(() => !!key.value),
  })
}

/** GET /api/v1/admin/cohorts/{cohort}/attendance/sessions/{session} */
export function useCohortAttendanceSessionDetail(
  cohortKey: MaybeRef<string | null | undefined>,
  sessionKey: MaybeRef<string | null | undefined>,
) {
  const cKey = computed(() => unref(cohortKey)?.trim() || '')
  const sKey = computed(() => unref(sessionKey)?.trim() || '')
  const client = inject('VUE_QUERY_CLIENT', null)
  if (!client) {
    return {
      data: ref(null as AttendanceSession | null),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: () => Promise.resolve(),
    } as unknown as UseQueryReturnType<AttendanceSession | null, ApiError>
  }

  return useQuery({
    queryKey: computed(() => ['cohort-attendance-session-detail', cKey.value, sKey.value]),
    queryFn: async () => {
      if (!cKey.value || !sKey.value) return null
      const res = await http.get<AttendanceSession>(
        `/admin/cohorts/${cKey.value}/attendance/sessions/${sKey.value}`,
      )
      return res.data
    },
    enabled: computed(() => !!cKey.value && !!sKey.value),
  })
}

/** GET /api/v1/admin/cohorts/{cohort}/attendance/summary */
export function useCohortAttendanceSummary(cohortKey: MaybeRef<string | null | undefined>) {
  const key = computed(() => unref(cohortKey)?.trim() || '')
  const client = inject('VUE_QUERY_CLIENT', null)
  if (!client) {
    return {
      data: ref(null as CohortAttendanceSummary | null),
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
      refetch: () => Promise.resolve(),
    } as unknown as UseQueryReturnType<CohortAttendanceSummary | null, ApiError>
  }

  return useQuery({
    queryKey: computed(() => ['cohort-attendance-summary', key.value]),
    queryFn: async () => {
      if (!key.value) return null
      const res = await http.get<CohortAttendanceSummary>(
        `/admin/cohorts/${key.value}/attendance/summary`,
      )
      return res.data
    },
    enabled: computed(() => !!key.value),
  })
}

/** POST /api/v1/admin/cohorts/{cohort}/attendance/sessions */
export function useCreateAttendanceSession(cohortKey: MaybeRef<string>) {
  const client = inject('VUE_QUERY_CLIENT', null)
  if (!client) {
    return {
      mutate: () => {},
      mutateAsync: async () => ({}) as AttendanceSession,
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as unknown as UseMutationReturnType<
      AttendanceSession,
      ApiError,
      CreateAttendanceSessionPayload,
      unknown
    >
  }
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: CreateAttendanceSessionPayload) => {
      const res = await http.post<AttendanceSession>(
        `/admin/cohorts/${unref(cohortKey)}/attendance/sessions`,
        payload,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cohort-attendance-sessions', unref(cohortKey)],
      })
      queryClient.invalidateQueries({
        queryKey: ['cohort-attendance-summary', unref(cohortKey)],
      })
    },
  })
}

/** PUT /api/v1/admin/cohorts/{cohort}/attendance/sessions/{session} */
export function useUpdateAttendanceBatch(
  cohortKey: MaybeRef<string>,
  sessionKey: MaybeRef<string>,
) {
  const client = inject('VUE_QUERY_CLIENT', null)
  if (!client) {
    return {
      mutate: () => {},
      mutateAsync: async () => ({}) as AttendanceSession,
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as unknown as UseMutationReturnType<
      AttendanceSession,
      ApiError,
      UpdateAttendanceBatchPayload,
      unknown
    >
  }
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: UpdateAttendanceBatchPayload) => {
      const res = await http.put<AttendanceSession>(
        `/admin/cohorts/${unref(cohortKey)}/attendance/sessions/${unref(sessionKey)}`,
        payload,
      )
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cohort-attendance-sessions', unref(cohortKey)],
      })
      queryClient.invalidateQueries({
        queryKey: ['cohort-attendance-session-detail', unref(cohortKey), unref(sessionKey)],
      })
      queryClient.invalidateQueries({
        queryKey: ['cohort-attendance-summary', unref(cohortKey)],
      })
    },
  })
}

/** DELETE /api/v1/admin/cohorts/{cohort}/attendance/sessions/{session} */
export function useDeleteAttendanceSession(cohortKey: MaybeRef<string>) {
  const client = inject('VUE_QUERY_CLIENT', null)
  if (!client) {
    return {
      mutate: () => {},
      mutateAsync: async () => {},
      isPending: ref(false),
      isError: ref(false),
      error: ref(null),
    } as unknown as UseMutationReturnType<void, ApiError, string, unknown>
  }
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionKey: string) => {
      await http.delete(`/admin/cohorts/${unref(cohortKey)}/attendance/sessions/${sessionKey}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['cohort-attendance-sessions', unref(cohortKey)],
      })
      queryClient.invalidateQueries({
        queryKey: ['cohort-attendance-summary', unref(cohortKey)],
      })
    },
  })
}
