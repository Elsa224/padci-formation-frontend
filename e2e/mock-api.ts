import type { Page, Route } from '@playwright/test'

export interface MockUser {
  id: number
  key: string
  first_name: string
  last_name: string
  name: string
  email: string
  roles: string[]
  email_verified: boolean
  is_active: boolean
}

export interface MockQuestionOption {
  key: string
  body: string
  position: number
}

export interface MockQuestionResult {
  correct_option_keys: string[]
  explanation: string | null
  awarded_points: number
  is_correct: boolean | null
  grading_note: string | null
}

export interface MockAttemptQuestion {
  key: string
  type: 'single_choice' | 'multiple_choice' | 'true_false' | 'free_text'
  prompt: string
  points: number
  position: number
  options: MockQuestionOption[]
  selected_option_keys: string[]
  free_text_response: string | null
  result?: MockQuestionResult
}

export interface MockAttempt {
  key: string
  status: 'in_progress' | 'submitted' | 'expired' | 'pending_grading'
  assessment: {
    key: string
    title: string
  }
  score: number | null
  max_score: number
  started_at: string
  expires_at: string | null
  submitted_at: string | null
  auto_submitted?: boolean
  questions: MockAttemptQuestion[]
}

export interface MockCertificate {
  key: string
  code: string
  status: 'issued' | 'revoked'
  holder: {
    name: string
    email?: string
  }
  course: {
    key: string
    title: string
  }
  issued_at: string
  revoked_at: string | null
  revoked_by?: {
    name: string
  } | null
  revocation_reason?: string | null
}

export interface MockResource {
  key: string
  title: string
  type: string
  media?: {
    key: string
    original_name: string
    size_bytes: number
    mime_type?: string
    scan_status: string
  }
}

export interface MockChapter {
  key: string
  title: string
  position: number
  type: string
  resources: MockResource[]
}

export interface MockModule {
  key: string
  title: string
  position: number
  chapters: MockChapter[]
}

export interface MockCourse {
  key: string
  title: string
  status: 'draft' | 'submitted' | 'published' | 'rejected' | 'archived'
  summary?: string | null
  description?: string
  level?: string
  updated_at?: string
  created_at?: string
  pathway?: {
    key: string
    name: string
  }
  owner?: {
    key: string
    name: string
  }
  modules: MockModule[]
}

export interface MockApiState {
  users: MockUser[]
  courses: MockCourse[]
  attempts: Record<string, MockAttempt>
  certificates: MockCertificate[]
  resetTokens: Record<string, string>
  applications: Array<Record<string, unknown>>
}

export function createDefaultState(): MockApiState {
  return {
    applications: [],
    users: [
      {
        id: 1,
        key: 'usr_superadmin',
        first_name: 'Super',
        last_name: 'Admin',
        name: 'Super Admin',
        email: 'superadmin@emsp.test',
        roles: ['super_admin'],
        email_verified: true,
        is_active: true,
      },
      {
        id: 2,
        key: 'usr_admin',
        first_name: 'Demo',
        last_name: 'Admin',
        name: 'Demo Admin',
        email: 'admin@emsp.test',
        roles: ['admin'],
        email_verified: true,
        is_active: true,
      },
      {
        id: 3,
        key: 'usr_formateur',
        first_name: 'Demo',
        last_name: 'Formateur',
        name: 'Demo Formateur',
        email: 'formateur@emsp.test',
        roles: ['formateur'],
        email_verified: true,
        is_active: true,
      },
      {
        id: 4,
        key: 'usr_learner',
        first_name: 'Demo',
        last_name: 'User',
        name: 'Demo User',
        email: 'user@emsp.test',
        roles: ['apprenant'],
        email_verified: true,
        is_active: true,
      },
      {
        id: 5,
        key: 'usr_smoke_superadmin',
        first_name: 'Smoke',
        last_name: 'Superadmin',
        name: 'Smoke Superadmin (smoke-superadmin)',
        email: 'smoke-superadmin@example.com',
        roles: ['super_admin'],
        email_verified: true,
        is_active: true,
      },
      {
        id: 6,
        key: 'usr_example_learner',
        first_name: 'Learner',
        last_name: 'Example',
        name: 'Demo Learner Example',
        email: 'user@example.com',
        roles: ['apprenant'],
        email_verified: true,
        is_active: true,
      },
    ],
    courses: [
      {
        key: 'crs_cyber_sec',
        title: 'Introduction à la Cybersécurité',
        status: 'published',
        summary: 'Bases de la sécurité des systèmes et réseaux informatiques.',
        level: 'beginner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pathway: { key: 'pth_cyber', name: 'Cyber Sécurité' },
        owner: { key: 'usr_formateur', name: 'Demo Formateur' },
        modules: [
          {
            key: 'mod_base',
            title: 'Module 1 : Notions fondamentales',
            position: 1,
            chapters: [
              {
                key: 'chp_intro',
                title: 'Chapitre 1 : Les menaces cyber',
                position: 1,
                type: 'content',
                resources: [
                  {
                    key: 'res_pdf_1',
                    title: 'Guide des menaces cyber',
                    type: 'document',
                    media: {
                      key: 'med_pdf_1',
                      original_name: 'guide-cyber.pdf',
                      size_bytes: 1048576,
                      scan_status: 'clean',
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        key: 'crs_admin_review',
        title: "Administration Systèmes et Réseaux d'Entreprise",
        status: 'submitted',
        summary: 'Configuration et sécurisation des serveurs Linux et Windows.',
        level: 'intermediate',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pathway: { key: 'pth_cyber', name: 'Cyber Sécurité' },
        owner: { key: 'usr_formateur', name: 'Demo Formateur' },
        modules: [
          {
            key: 'mod_admin_1',
            title: 'Module 1 : Déploiement Linux',
            position: 1,
            chapters: [
              {
                key: 'chp_admin_1',
                title: 'Chapitre 1 : Installation et durcissement',
                position: 1,
                type: 'content',
                resources: [],
              },
            ],
          },
        ],
      },
    ],
    attempts: {
      att_quiz_auto: {
        key: 'att_quiz_auto',
        status: 'in_progress',
        assessment: {
          key: 'asm_sec_net',
          title: 'Quiz Réseaux et Sécurité',
        },
        score: null,
        max_score: 20,
        started_at: new Date(Date.now() - 55000).toISOString(),
        expires_at: new Date(Date.now() + 8000).toISOString(),
        submitted_at: null,
        auto_submitted: false,
        questions: [
          {
            key: 'qst_1',
            type: 'single_choice',
            prompt: 'Quel port par défaut est utilisé par le protocole HTTPS ?',
            points: 10,
            position: 1,
            options: [
              { key: 'opt_80', body: 'Port 80', position: 1 },
              { key: 'opt_443', body: 'Port 443', position: 2 },
            ],
            selected_option_keys: [],
            free_text_response: null,
          },
          {
            key: 'qst_2',
            type: 'single_choice',
            prompt: 'Quel protocole offre un accès distant sécurisé ?',
            points: 10,
            position: 2,
            options: [
              { key: 'opt_telnet', body: 'Telnet', position: 1 },
              { key: 'opt_ssh', body: 'SSH', position: 2 },
            ],
            selected_option_keys: [],
            free_text_response: null,
          },
        ],
      },
    },
    certificates: [
      {
        key: 'cert_valid_1',
        code: 'CERT-VALID-123',
        status: 'issued',
        holder: { name: 'Jean Dupont', email: 'jean.dupont@emsp.test' },
        course: { key: 'crs_cyber_sec', title: 'Introduction à la Cybersécurité' },
        issued_at: '2026-11-01T10:00:00Z',
        revoked_at: null,
      },
      {
        key: 'cert_revoked_2',
        code: 'CERT-REVOKED-456',
        status: 'revoked',
        holder: { name: 'Alice Martin', email: 'alice.martin@emsp.test' },
        course: { key: 'crs_cyber_sec', title: 'Réseaux Avancés' },
        issued_at: '2026-10-15T09:00:00Z',
        revoked_at: '2026-11-20T14:30:00Z',
        revocation_reason: "Fraude constatée lors de l'examen final",
        revoked_by: { name: 'Demo Admin' },
      },
    ],
    resetTokens: {},
  }
}

// Global active state reference
let lastState: MockApiState | null = null

export function getMockResetToken(email: string): string | undefined {
  if (!lastState) return undefined
  return lastState.resetTokens[email.toLowerCase()]
}

function jsonResponse(
  route: Route,
  data: unknown,
  status = 200,
  message = 'Success',
  meta: unknown = null,
) {
  let resolvedMeta = meta
  if (Array.isArray(data) && !resolvedMeta) {
    resolvedMeta = {
      pagination: {
        total: data.length,
        per_page: 50,
        current_page: 1,
        last_page: 1,
      },
    }
  }
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      success: status >= 200 && status < 300,
      data,
      message,
      meta: resolvedMeta,
    }),
  })
}

function errorResponse(
  route: Route,
  status: number,
  message: string,
  code = 'ERROR',
  details: Record<string, string[]> | null = null,
) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify({
      success: false,
      message,
      code,
      error: {
        code,
        message,
        details,
      },
      details,
    }),
  })
}

export async function setupDisposableApi(
  page: Page,
  customState?: Partial<MockApiState>,
): Promise<MockApiState> {
  const state = { ...createDefaultState(), ...customState }
  lastState = state

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.replace(/^\/api\/v1/, '')
    const method = request.method()

    // 1. AUTH / ME
    if (path === '/auth/me' && method === 'GET') {
      const authHeader = request.headers()['authorization'] ?? ''
      let user = state.users.find((u) => u.email === 'user@emsp.test')
      if (authHeader.includes('smoke-superadmin')) {
        user = state.users.find((u) => u.email === 'smoke-superadmin@example.com')
      } else if (authHeader.includes('super_admin') || authHeader.includes('superadmin')) {
        user = state.users.find((u) => u.roles.includes('super_admin'))
      } else if (authHeader.includes('admin')) {
        user = state.users.find(
          (u) => u.roles.includes('admin') && !u.roles.includes('super_admin'),
        )
      } else if (authHeader.includes('formateur')) {
        user = state.users.find((u) => u.roles.includes('formateur'))
      } else if (authHeader.includes('learner') || authHeader.includes('apprenant')) {
        user = state.users.find((u) => u.email === 'user@emsp.test')
      }
      return jsonResponse(route, user)
    }

    // 2. AUTH / LOGIN
    if (path === '/auth/login' && method === 'POST') {
      const body = request.postDataJSON() as { email?: string; password?: string }
      const email = (body.email ?? '').toLowerCase()
      const user = state.users.find((u) => u.email.toLowerCase() === email)

      if (!user) {
        return errorResponse(route, 401, 'Identifiants invalides.', 'AUTH_INVALID_CREDENTIALS')
      }
      if (!user.email_verified) {
        const referer = request.headers()['referer'] ?? ''
        if (referer.includes('verified=1')) {
          user.email_verified = true
        } else {
          return errorResponse(route, 403, 'Adresse email non vérifiée.', 'AUTH_EMAIL_NOT_VERIFIED')
        }
      }

      return jsonResponse(route, {
        token: `mock-${user.roles[0]}-token`,
        token_type: 'Bearer',
        user,
      })
    }

    // 3. AUTH / REGISTER
    if (path === '/auth/register' && method === 'POST') {
      const body = request.postDataJSON() as {
        name?: string
        email?: string
        password?: string
        password_confirmation?: string
      }
      const password = body.password ?? ''
      const confirmation = body.password_confirmation ?? ''

      if (password !== confirmation) {
        return errorResponse(
          route,
          422,
          'Les mots de passe ne correspondent pas.',
          'VALIDATION_FAILED',
          { password: ['Les mots de passe ne correspondent pas.'] },
        )
      }
      if (password.length < 8) {
        return errorResponse(
          route,
          422,
          'Le mot de passe doit comporter au moins 8 caractères.',
          'VALIDATION_FAILED',
          { password: ['Le mot de passe doit comporter au moins 8 caractères.'] },
        )
      }

      const email = (body.email ?? '').toLowerCase()
      const newUser: MockUser = {
        id: state.users.length + 1,
        key: `usr_${Date.now()}`,
        first_name: (body.name ?? 'Utilisateur').split(' ')[0] ?? '',
        last_name: (body.name ?? 'Utilisateur').split(' ').slice(1).join(' ') || '',
        name: body.name ?? 'Utilisateur E2E',
        email,
        roles: ['apprenant'],
        email_verified: false,
        is_active: true,
      }
      state.users.push(newUser)

      return jsonResponse(
        route,
        {
          user: newUser,
          verification_url: `http://localhost:8070/api/v1/auth/verify-email?email=${encodeURIComponent(email)}`,
        },
        201,
      )
    }

    // 3b. AUTH / VERIFY-EMAIL (Backend signed URL that marks user verified and redirects to SPA)
    if (path.startsWith('/auth/verify-email') && method === 'GET') {
      const verifyEmail = (url.searchParams.get('email') ?? '').toLowerCase()
      const user = state.users.find((u) => u.email.toLowerCase() === verifyEmail)
      if (user) {
        user.email_verified = true
      }
      return route.fulfill({
        status: 302,
        headers: {
          Location: 'http://localhost:5173/connexion?verified=1',
        },
      })
    }

    // 4. AUTH / FORGOT-PASSWORD
    if (path === '/auth/forgot-password' && method === 'POST') {
      const body = request.postDataJSON() as { email?: string }
      const email = (body.email ?? '').toLowerCase()
      const resetToken = `reset_token_${Date.now()}`
      state.resetTokens[email] = resetToken
      return jsonResponse(route, { message: 'Email envoyé !' })
    }

    // 5. AUTH / RESET-PASSWORD
    if (path === '/auth/reset-password' && method === 'POST') {
      const body = request.postDataJSON() as { email?: string; token?: string; password?: string }
      const email = (body.email ?? '').toLowerCase()
      const user = state.users.find((u) => u.email.toLowerCase() === email)
      if (user) {
        user.email_verified = true
      }
      return jsonResponse(route, { message: 'Mot de passe modifié !' })
    }

    // 6. PUBLIC CERTIFICATES VERIFICATION (/public/certificates/:code)
    const publicCertMatch = path.match(/^\/public\/certificates\/([^/]+)$/)
    if (publicCertMatch && method === 'GET') {
      const code = decodeURIComponent(publicCertMatch[1] ?? '')
      const cert = state.certificates.find((c) => c.code.toLowerCase() === code.toLowerCase())
      if (!cert) {
        return errorResponse(
          route,
          404,
          'Aucune attestation ne correspond à ce code.',
          'CERTIFICATE_NOT_FOUND',
        )
      }
      return jsonResponse(route, {
        valid: cert.status === 'issued',
        holder_name: cert.holder.name,
        course_title: cert.course.title,
        issued_at: cert.issued_at,
        revoked_at: cert.revoked_at,
      })
    }

    // 7. LEARNING ATTEMPTS
    const attemptMatch = path.match(/^\/learning\/attempts\/([^/]+)$/)
    if (attemptMatch && method === 'GET') {
      const attemptKey = attemptMatch[1] ?? ''
      const attempt = state.attempts[attemptKey]
      if (!attempt) {
        return errorResponse(route, 404, 'Évaluation introuvable.')
      }
      return jsonResponse(route, attempt)
    }

    const answerMatch = path.match(/^\/learning\/attempts\/([^/]+)\/answers\/([^/]+)$/)
    if (answerMatch && method === 'PUT') {
      const attemptKey = answerMatch[1] ?? ''
      const questionKey = answerMatch[2] ?? ''
      const payload = request.postDataJSON() as {
        option_keys?: string[]
        free_text_response?: string | null
      }
      const attempt = state.attempts[attemptKey]
      if (attempt) {
        const question = attempt.questions.find((q) => q.key === questionKey)
        if (question) {
          if (payload.option_keys !== undefined) {
            question.selected_option_keys = payload.option_keys
          }
          if (payload.free_text_response !== undefined) {
            question.free_text_response = payload.free_text_response
          }
        }
      }
      return jsonResponse(route, attempt)
    }

    const submitAttemptMatch = path.match(/^\/learning\/attempts\/([^/]+)\/submit$/)
    if (submitAttemptMatch && method === 'POST') {
      const attemptKey = submitAttemptMatch[1] ?? ''
      const attempt = state.attempts[attemptKey]
      if (attempt) {
        attempt.status = 'submitted'
        attempt.submitted_at = new Date().toISOString()
        attempt.auto_submitted = true
        attempt.score = 10
        for (const q of attempt.questions) {
          q.result = {
            correct_option_keys: [q.options[1]?.key ?? q.options[0]?.key ?? ''],
            explanation: 'Bonne réponse enregistrée.',
            awarded_points: q.selected_option_keys.length > 0 ? q.points : 0,
            is_correct: q.selected_option_keys.length > 0,
            grading_note: null,
          }
        }
      }
      return jsonResponse(route, attempt)
    }

    // 8. COURSES (TRAINER & ADMIN /admin/courses)
    const singleCourseMatch = path.match(/^\/admin\/courses\/([^/]+)$/)
    if (singleCourseMatch && method === 'GET') {
      const courseKey = singleCourseMatch[1] ?? ''
      const course = state.courses.find((c) => c.key === courseKey)
      if (!course) return errorResponse(route, 404, 'Cours non trouvé.')
      return jsonResponse(route, course)
    }

    if (path === '/admin/courses' && method === 'GET') {
      const statusFilter = url.searchParams.get('status')
      const filtered = statusFilter
        ? state.courses.filter((c) => c.status === statusFilter)
        : state.courses
      return jsonResponse(route, filtered)
    }

    if (path === '/admin/courses' && method === 'POST') {
      const body = request.postDataJSON() as {
        title: string
        pathway_key: string
        summary?: string
        level?: string
      }
      const newCourse: MockCourse = {
        key: `crs_${Date.now()}`,
        title: body.title,
        status: 'draft',
        summary: body.summary,
        level: body.level ?? 'beginner',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        pathway: { key: body.pathway_key, name: 'Cyber Sécurité' },
        owner: { key: 'usr_formateur', name: 'Demo Formateur' },
        modules: [],
      }
      state.courses.push(newCourse)
      return jsonResponse(route, newCourse, 201)
    }

    const courseModulesMatch = path.match(/^\/admin\/courses\/([^/]+)\/modules$/)
    if (courseModulesMatch && method === 'GET') {
      const courseKey = courseModulesMatch[1] ?? ''
      const course = state.courses.find((c) => c.key === courseKey)
      return jsonResponse(route, course?.modules ?? [])
    }

    if (courseModulesMatch && method === 'POST') {
      const courseKey = courseModulesMatch[1] ?? ''
      const course = state.courses.find((c) => c.key === courseKey)
      const body = request.postDataJSON() as { title: string; position?: number }
      const newModule: MockModule = {
        key: `mod_${Date.now()}`,
        title: body.title,
        position: (course?.modules.length ?? 0) + 1,
        chapters: [],
      }
      course?.modules.push(newModule)
      return jsonResponse(route, newModule, 201)
    }

    const courseChaptersMatch = path.match(
      /^\/admin\/courses\/([^/]+)\/modules\/([^/]+)\/chapters$/,
    )
    if (courseChaptersMatch && method === 'POST') {
      const courseKey = courseChaptersMatch[1] ?? ''
      const moduleKey = courseChaptersMatch[2] ?? ''
      const course = state.courses.find((c) => c.key === courseKey)
      const mod = course?.modules.find((m) => m.key === moduleKey)
      const body = request.postDataJSON() as { title: string; type?: string }
      const newChapter: MockChapter = {
        key: `chp_${Date.now()}`,
        title: body.title,
        position: (mod?.chapters.length ?? 0) + 1,
        type: body.type ?? 'content',
        resources: [],
      }
      mod?.chapters.push(newChapter)
      return jsonResponse(route, newChapter, 201)
    }

    // 9. MEDIA UPLOAD & RESOURCE CREATION
    if (path === '/media' && method === 'POST') {
      const mediaKey = `med_${Date.now()}`
      return jsonResponse(route, {
        key: mediaKey,
        original_name: 'support-cours.pdf',
        size_bytes: 102400,
        mime_type: 'application/pdf',
        scan_status: 'clean',
      })
    }

    const createResourceMatch = path.match(
      /^\/admin\/courses\/([^/]+)\/modules\/([^/]+)\/chapters\/([^/]+)\/resources$/,
    )
    if (createResourceMatch && method === 'POST') {
      const courseKey = createResourceMatch[1] ?? ''
      const moduleKey = createResourceMatch[2] ?? ''
      const chapterKey = createResourceMatch[3] ?? ''
      const course = state.courses.find((c) => c.key === courseKey)
      const mod = course?.modules.find((m) => m.key === moduleKey)
      const chp = mod?.chapters.find((c) => c.key === chapterKey)
      const body = request.postDataJSON() as { title: string; type: string; media_key?: string }
      const newResource: MockResource = {
        key: `res_${Date.now()}`,
        title: body.title,
        type: body.type,
        media: {
          key: body.media_key ?? `med_${Date.now()}`,
          original_name: 'support-cours.pdf',
          size_bytes: 102400,
          mime_type: 'application/pdf',
          scan_status: 'clean',
        },
      }
      chp?.resources.push(newResource)
      return jsonResponse(route, newResource, 201)
    }

    const publishCourseMatch = path.match(/^\/admin\/courses\/([^/]+)\/publish$/)
    if (publishCourseMatch && method === 'POST') {
      const courseKey = publishCourseMatch[1] ?? ''
      const course = state.courses.find((c) => c.key === courseKey)
      if (course) {
        course.status = 'published'
      }
      return jsonResponse(route, course)
    }

    // 10. ADMIN CERTIFICATES & REVOCATION
    if (path === '/admin/certificates' && method === 'GET') {
      const statusFilter = url.searchParams.get('status')
      const filtered = statusFilter
        ? state.certificates.filter((c) => c.status === statusFilter)
        : state.certificates
      return jsonResponse(route, filtered)
    }

    const revokeCertMatch = path.match(/^\/admin\/certificates\/([^/]+)\/revoke$/)
    if (revokeCertMatch && method === 'POST') {
      const certKey = revokeCertMatch[1] ?? ''
      const body = request.postDataJSON() as { reason?: string }
      const cert = state.certificates.find((c) => c.key === certKey)
      if (cert) {
        cert.status = 'revoked'
        cert.revoked_at = new Date().toISOString()
        cert.revocation_reason = body.reason ?? 'Révocation administrative'
        cert.revoked_by = { name: 'Demo Admin' }
      }
      return jsonResponse(route, cert)
    }

    // 11. CATALOG & PATHWAYS
    if (path === '/catalog/pathways' && method === 'GET') {
      return jsonResponse(route, [
        {
          key: 'pth_cyber',
          code: 'CYBER',
          name: 'Cyber Sécurité',
          summary: 'Maîtriser la défense et la sécurité des infrastructures numériques.',
          hardware_requirements: 'Configuration minimale requise : 8 Go RAM, processeur i5 minimum',
          courses_count: 3,
        },
        {
          key: 'pth_ai',
          code: 'AI',
          name: 'Artificial Intelligence',
          summary: "Développement de modèles d'intelligence artificielle et data science.",
          hardware_requirements: 'Configuration minimale requise : 16 Go RAM, GPU recommandé',
          courses_count: 2,
        },
      ])
    }

    const pathwayDetailMatch = path.match(/^\/catalog\/pathways\/([^/]+)$/)
    if (pathwayDetailMatch && method === 'GET') {
      return jsonResponse(route, {
        key: 'pth_cyber',
        code: 'CYBER',
        name: 'Cyber Sécurité',
        summary: 'Maîtriser la défense et la sécurité des infrastructures numériques.',
        equipment_requirements: {
          min_cpu: 'Intel Core i5',
          min_ram_gb: 8,
          min_storage_gb: 256,
          notes: 'Configuration minimale requise pour les travaux pratiques.',
        },
        sessions: [
          {
            key: 'coh_cyber_2026',
            name: 'Cohorte Cyber Sécurité Promo 2026',
            starts_at: '2026-12-01',
            ends_at: '2027-06-30',
            status: 'open',
            available_seats: 30,
          },
        ],
      })
    }

    if (path.includes('/cohorts') && method === 'GET') {
      return jsonResponse(route, [
        {
          key: 'coh_cyber_2026',
          name: 'Cohorte Cyber Sécurité Promo 2026',
          starts_at: '2026-12-01',
          ends_at: '2027-06-30',
          status: 'open',
          available_seats: 30,
        },
      ])
    }

    // 12. APPLICATIONS
    if (path === '/applications' && method === 'POST') {
      const newApp = {
        key: `app_${Date.now()}`,
        status: 'submitted',
        cohort: { name: 'Cohorte Cyber Sécurité Promo 2026' },
        pathway: { name: 'Cyber Sécurité' },
        created_at: new Date().toISOString(),
      }
      state.applications.push(newApp)
      return jsonResponse(route, newApp, 201)
    }
    if ((path === '/applications' || path === '/applications/my') && method === 'GET') {
      return jsonResponse(route, state.applications)
    }

    // 12b. ENROLLMENTS
    if (path === '/enrollments' && method === 'GET') {
      return jsonResponse(route, [
        {
          id: 1,
          key: 'enr_1',
          status: 'active',
          cohort: {
            id: 1,
            key: 'coh_1',
            code: 'CYBER-2026',
            name: 'Cohorte Cyber 2026',
            session: 'Session Printemps 2026',
            status: 'active',
          },
          course: {
            id: 1,
            key: 'crs_cyber_sec',
            slug: 'intro-cyber',
            title: 'Introduction à la Cybersécurité',
            status: 'published',
          },
          enrolled_at: new Date().toISOString(),
          completed_at: null,
          created_at: new Date().toISOString(),
        },
      ])
    }

    // 13. LEARNING DASHBOARD & ASSESSMENTS
    if (path === '/learning/dashboard' && method === 'GET') {
      return jsonResponse(route, {
        cohort: { key: 'coh_1', name: 'Cohorte Cyber 2026', status: 'active' },
        courses: [
          {
            key: 'crs_cyber_sec',
            title: 'Introduction à la Cybersécurité',
            progress_percent: 50,
          },
        ],
        enrollments: [
          {
            key: 'enr_1',
            course: { key: 'crs_cyber_sec', title: 'Introduction à la Cybersécurité' },
            progress_percent: 50,
          },
        ],
      })
    }

    const learningCourseDetailMatch = path.match(/^\/learning\/courses\/([^/]+)$/)
    if (learningCourseDetailMatch && method === 'GET') {
      const courseKey = learningCourseDetailMatch[1] ?? ''
      const course = state.courses.find((c) => c.key === courseKey) ?? state.courses[0]
      return jsonResponse(route, course)
    }

    const learningAssessmentsMatch = path.match(/^\/learning\/courses\/([^/]+)\/assessments$/)
    if (learningAssessmentsMatch && method === 'GET') {
      return jsonResponse(route, [
        {
          key: 'asm_sec_net',
          title: 'Quiz Réseaux et Sécurité',
          status: 'published',
          settings: { duration_minutes: 10, max_attempts: 2 },
          attempts_used: 0,
          attempts_remaining: 2,
          last_attempt: null,
        },
      ])
    }

    // 14. SUPERADMIN SPECIFIC ENDPOINTS
    if (path === '/admin/dashboard/overview' && method === 'GET') {
      return jsonResponse(route, {
        learners_total: 150,
        active_cohorts_total: 8,
        published_courses_total: 12,
        completion_rate: 0.82,
        certificates_issued_total: 45,
      })
    }

    if (path === '/admin/dashboard/reports/pathways' && method === 'GET') {
      return jsonResponse(route, [
        {
          pathway_key: 'pth_cyber',
          name: 'Cyber Sécurité',
          enrolled_count: 85,
          completed_count: 65,
          completion_rate: 0.76,
          certificates_issued: 30,
        },
      ])
    }

    if (path === '/admin/budget-lines' && method === 'GET') {
      return jsonResponse(route, [
        {
          key: 'bl_1',
          code: 'BL-2026-PADCI',
          name: 'Infrastructures & Matériels Informatiques',
          allocated_amount: 100000000,
          disbursed_amount: 40000000,
          committed_amount: 20000000,
        },
      ])
    }

    if (path === '/admin/users' && method === 'GET') {
      return jsonResponse(route, state.users)
    }

    if (path === '/admin/disbursement-requests' && method === 'GET') {
      return jsonResponse(route, [
        {
          id: 1,
          key: 'disb_1',
          beneficiary: 'Cisco Networking Academy',
          purpose: 'Licences et examens de certification Cisco',
          amount_minor: 2500000000,
          currency: 'XOF',
          status: 'pending_ano',
          ano_request: null,
          created_at: '2026-11-01T10:00:00Z',
          updated_at: '2026-11-01T10:00:00Z',
        },
      ])
    }

    const payDisbursementMatch = path.match(
      /^\/admin\/disbursement-requests\/([^/]+)\/(?:pay|mark-paid)$/,
    )
    if (payDisbursementMatch && method === 'POST') {
      return errorResponse(
        route,
        422,
        'Un décaissement ne peut être marqué payé que si une ANO signée y est rattachée.',
        'ANO_REQUIRED',
      )
    }

    if (path === '/admin/ano-requests' && method === 'GET') {
      return jsonResponse(route, [
        {
          key: 'ano_1',
          title: 'Avis de Non-Objection (UCP / Banque Mondiale)',
          reference: 'ANO-BM-2026-004',
          status: 'pending',
          file_name: 'ano-validation.pdf',
        },
      ])
    }

    // Default fallback: return empty success array
    return jsonResponse(route, [])
  })

  return state
}
