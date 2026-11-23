/**
 * Each role's own workspace home — the single source of truth for every
 * "where does this user land" decision (router guard, login, MFA setup,
 * invitation onboarding, public header). Highest-privilege role wins.
 */
export function homeFor(roles: readonly string[]): string {
  if (roles.includes('super_admin')) return '/superadmin/dashboard'
  if (roles.includes('admin')) return '/admin/dashboard'
  if (roles.includes('moderateur')) return '/moderation/tableau-de-bord'
  if (roles.includes('formateur')) return '/formateur/dashboard'
  return '/formations/dashboard'
}
