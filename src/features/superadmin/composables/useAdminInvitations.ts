import { computed, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { http, apiMeta } from '@/api/http'
import type { ApiMeta } from '@/api/types'

export interface AdminInvitation {
  id: number
  key: string
  email: string
  role: string
  role_label: string
  invited_by: {
    key: string
    name: string
    email: string
  } | null
  expires_at: string
  accepted_at: string | null
  is_expired: boolean
  is_accepted: boolean
  is_pending: boolean
  created_at: string
}

export interface CreateInvitationPayload {
  email: string
  role: string
}

export function useAdminInvitations(status?: Ref<string>) {
  return useQuery({
    queryKey: ['admin', 'invitations', status],
    queryFn: async (): Promise<{
      items: AdminInvitation[]
      pagination: ApiMeta['pagination'] | null
    }> => {
      const response = await http.get<AdminInvitation[]>('/admin/invitations', {
        params: {
          status: status?.value ?? 'pending',
          per_page: 50,
        },
      })
      return {
        items: response.data ?? [],
        pagination: apiMeta(response)?.pagination ?? null,
      }
    },
  })
}

export function useCreateAdminInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateInvitationPayload): Promise<AdminInvitation> => {
      const { data } = await http.post<AdminInvitation>('/admin/invitations', payload)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] })
    },
  })
}

export function useRevokeAdminInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (key: string): Promise<void> => {
      await http.delete(`/admin/invitations/${key}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'invitations'] })
    },
  })
}
