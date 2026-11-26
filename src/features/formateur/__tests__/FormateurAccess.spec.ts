import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { homeFor } from '@/features/auth/utils/homeFor'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

vi.mock('@/features/auth/composables/useBootstrapAuth', () => ({
  bootstrapAuth: vi.fn(() => Promise.resolve()),
}))

function signIn(roles: string[]) {
  useAuthStore().setSession('test-token', {
    key: 'usr_test',
    name: 'Test',
    email: 'test@example.test',
    roles,
  })
}

describe('homeFor', () => {
  it('sends each role to its own workspace, highest privilege first', () => {
    expect(homeFor(['super_admin', 'formateur'])).toBe('/superadmin/dashboard')
    expect(homeFor(['admin', 'formateur'])).toBe('/admin/dashboard')
    expect(homeFor(['moderateur'])).toBe('/moderation/tableau-de-bord')
    expect(homeFor(['formateur'])).toBe('/formateur/dashboard')
    expect(homeFor(['apprenant'])).toBe('/formations/dashboard')
    expect(homeFor([])).toBe('/formations/dashboard')
  })
})

describe('formateur route guard', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await router.push('/catalogue').catch(() => {})
  })

  it('lets a trainer into the trainer workspace', async () => {
    signIn(['formateur'])
    await router.push('/formateur/cours')
    expect(router.currentRoute.value.path).toBe('/formateur/cours')
  })

  it('sends an admin who is also a trainer back to the admin workspace', async () => {
    signIn(['admin', 'formateur'])
    await router.push('/formateur/cours')
    expect(router.currentRoute.value.path).toBe('/admin/dashboard')
  })

  it('gives a trainer their own profile and settings pages', async () => {
    signIn(['formateur'])
    await router.push('/formateur/profil')
    expect(router.currentRoute.value.path).toBe('/formateur/profil')
    await router.push('/formateur/parametres')
    expect(router.currentRoute.value.path).toBe('/formateur/parametres')
  })

  it('lets an admin moderate courses inside the admin workspace', async () => {
    signIn(['admin'])
    await router.push('/admin/moderation-cours')
    expect(router.currentRoute.value.path).toBe('/admin/moderation-cours')
  })

  it('does not loop when an account has no usable role', async () => {
    signIn([])
    await router.push('/formations/dashboard')
    expect(router.currentRoute.value.path).toBe('/catalogue')
  })

  it('sends a learner away from the trainer workspace', async () => {
    signIn(['apprenant'])
    await router.push('/formateur/dashboard')
    expect(router.currentRoute.value.path).toBe('/formations/dashboard')
  })
})
