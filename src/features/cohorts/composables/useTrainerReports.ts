import { computed, toValue, type MaybeRef } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { apiMeta, http } from '@/api/http'
import type { components } from '@/api/schema'

export type TrainerReport = components['schemas']['TrainerReportResource']
export type TrainerReportStatus = components['schemas']['TrainerReportStatus']

export const reportStatusLabels: Record<TrainerReportStatus, string> = {
  submitted: 'À valider',
  approved: 'Validé',
  rejected: 'Rejeté',
}

export const reportStatusChip: Record<TrainerReportStatus, string> = {
  submitted: 'app-chip-savane',
  approved: 'app-chip-leaf',
  rejected: 'app-chip-danger',
}

/** GET /admin/cohorts/{cohort}/reports — rapports d'une cohorte encadrée. */
export function useCohortReports(cohortKey: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['trainer-reports', toValue(cohortKey)]),
    enabled: computed(() => Boolean(toValue(cohortKey))),
    queryFn: async () =>
      (await http.get<TrainerReport[]>(`/admin/cohorts/${toValue(cohortKey)}/reports`)).data,
  })
}

/** Dépôt d'un rapport : envoi du PDF (POST /media) puis du rapport. */
export function useSubmitReport(cohortKey: MaybeRef<string>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      period_label?: string
      summary?: string
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
        await http.post<TrainerReport>(`/admin/cohorts/${toValue(cohortKey)}/reports`, {
          title: input.title,
          period_label: input.period_label || null,
          summary: input.summary || null,
          media_key: media.key,
        })
      ).data
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['trainer-reports'] }),
  })
}

/** GET /admin/trainer-reports — tous les rapports (administration). */
export function useAllReports(status: MaybeRef<string>) {
  return useQuery({
    queryKey: computed(() => ['admin-trainer-reports', toValue(status)]),
    queryFn: async () => {
      const response = await http.get<TrainerReport[]>('/admin/trainer-reports', {
        params: { status: toValue(status) || undefined, per_page: 100 },
      })
      return { items: response.data, pagination: apiMeta(response)?.pagination ?? null }
    },
  })
}

/** Compteur des rapports à valider (tableau de bord admin). */
export function usePendingReportCount() {
  return useQuery({
    queryKey: ['admin-trainer-reports', 'count', 'submitted'],
    queryFn: async () => {
      const response = await http.get<TrainerReport[]>('/admin/trainer-reports', {
        params: { status: 'submitted', per_page: 1 },
      })
      return apiMeta(response)?.pagination?.total ?? response.data.length
    },
  })
}

export function useDecideReport() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: async (input: { key: string; decision: 'approved' | 'rejected'; note?: string }) =>
      (
        await http.post<TrainerReport>(`/admin/trainer-reports/${input.key}/decide`, {
          decision: input.decision,
          note: input.note || null,
        })
      ).data,
    onSuccess: () => client.invalidateQueries({ queryKey: ['admin-trainer-reports'] }),
  })
}
