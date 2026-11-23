import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, onScopeDispose } from 'vue'
import { apiMeta, http } from '@/api/http'
import { useAuthStore, type SessionUser } from '@/stores/auth'

/** `UserResource` shape, same contract as the session user plus profile detail. */
export interface Profile extends SessionUser {
  has_profile_photo: boolean
  id: number
  email_verified: boolean
  email_verified_at: string | null
  is_active: boolean
  roles: string[]
  mfa_enabled: boolean
  mfa_required: boolean
  last_login_at: string | null
  created_at: string
}

export function useProfilePhoto() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()
  const photo = useQuery({
    queryKey: ['profile-photo', auth.user?.key],
    enabled: computed(() => Boolean(auth.token)),
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8070/api/v1'}/profile/photo`,
        {
          headers: { Authorization: `Bearer ${auth.token}`, Accept: 'image/*' },
        },
      )
      if (response.status === 404) return null
      if (!response.ok) throw new Error('Impossible de charger la photo.')
      return URL.createObjectURL(await response.blob())
    },
    gcTime: 0,
  })
  const invalidate = () => {
    if (photo.data.value) URL.revokeObjectURL(photo.data.value)
    void queryClient.invalidateQueries({ queryKey: ['profile-photo'] })
    void queryClient.invalidateQueries({ queryKey: ['profile'] })
  }
  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData()
      form.append('photo', file)
      await http.post('/profile/photo', form)
    },
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: async () => {
      await http.delete('/profile/photo')
    },
    onSuccess: invalidate,
  })
  onScopeDispose(() => {
    if (photo.data.value) URL.revokeObjectURL(photo.data.value)
  })
  return { photo, upload, remove }
}

/** GET /profile. */
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data } = await http.get<Profile>('/profile')
      return data
    },
  })
}

export interface UpdateProfilePayload {
  name?: string
  email?: string
}

/** PATCH /profile - an email change resets verification (backend re-sends the link). */
export function useUpdateProfile() {
  const queryClient = useQueryClient()
  const auth = useAuthStore()

  return useMutation({
    mutationFn: async (payload: UpdateProfilePayload) => {
      const { data } = await http.patch<Profile>('/profile', payload)
      return data
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(['profile'], profile)
      if (auth.user !== null) {
        auth.user = { ...auth.user, name: profile.name, email: profile.email }
      }
    },
  })
}

export interface ChangePasswordPayload {
  current_password: string
  password: string
  password_confirmation: string
}

/** PUT /profile/password - revokes every other session's token on success. */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      await http.put('/profile/password', payload)
    },
  })
}

/**
 * Lightweight real counts for the profile page (formations suivies,
 * certificats) - `per_page=1` reads `meta.pagination.total` without
 * fetching the actual records. No per-course progress/study-time
 * aggregate exists yet (that is the learner dashboard's job, task 05),
 * so this composable only exposes what already has a real contract.
 */
export function useLearnerCounts() {
  return useQuery({
    queryKey: ['learner-counts'],
    queryFn: async () => {
      const [enrollments, certificates] = await Promise.all([
        http.get('/enrollments', { params: { per_page: 1 } }),
        http.get('/learning/certificates', { params: { per_page: 1 } }),
      ])

      return {
        enrollments: apiMeta(enrollments)?.pagination?.total ?? 0,
        certificates: apiMeta(certificates)?.pagination?.total ?? 0,
      }
    },
  })
}
