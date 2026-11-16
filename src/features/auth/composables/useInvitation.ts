import { computed, type Ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { http } from '@/api/http'
import { useAuthStore, type SessionUser } from '@/stores/auth'

export interface InvitationDetails {
  email: string
  role: string
  role_label: string
  expires_at: string
}

export interface AcceptInvitationPayload {
  token: string
  first_name: string
  last_name: string
  password: string
  password_confirmation: string
}

export interface AcceptInvitationResponse {
  token: string
  user: SessionUser & {
    id: number
    first_name: string
    last_name: string
  }
}

export function useInvitationDetails(token: Ref<string>) {
  return useQuery({
    queryKey: ['auth', 'invitation', token],
    queryFn: async (): Promise<InvitationDetails> => {
      const { data } = await http.get<InvitationDetails>('/auth/invitation', {
        params: { token: token.value },
      })
      return data
    },
    enabled: computed(() => token.value.trim().length > 0),
    retry: false,
  })
}

export function useAcceptInvitation() {
  const auth = useAuthStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AcceptInvitationPayload): Promise<AcceptInvitationResponse> => {
      const { data } = await http.post<AcceptInvitationResponse>('/auth/invitation/accept', payload)
      return data
    },
    onSuccess: (data) => {
      auth.setSession(data.token, {
        key: data.user.key,
        name: data.user.name,
        email: data.user.email,
        roles: data.user.roles,
      })
      queryClient.clear()
    },
  })
}
