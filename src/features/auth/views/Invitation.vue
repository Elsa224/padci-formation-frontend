<script setup lang="ts">
import AuthShell from '../components/AuthShell.vue'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ShieldCheckIcon,
  SettingsIcon,
  ScaleIcon,
  GraduationCapIcon,
  LockIcon,
  UserIcon,
  EyeIcon,
  EyeOffIcon,
  ArrowRightIcon,
  AlertTriangleIcon,
  ClockIcon,
  CheckCircle2Icon,
} from '@lucide/vue'
import { useInvitationDetails, useAcceptInvitation } from '../composables/useInvitation'
import ChecklistMotDePasse from '../components/ChecklistMotDePasse.vue'
import { peutEnvoyerMotDePasse } from '../utils/passwordRules'
import { homeFor } from '../utils/homeFor'
import { ApiError } from '@/api/http'

const route = useRoute()
const router = useRouter()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const {
  data: invitation,
  isPending: isLoadingDetails,
  isError: isTokenError,
  error: tokenError,
} = useInvitationDetails(token)

const acceptMutation = useAcceptInvitation()

const form = ref({
  first_name: '',
  last_name: '',
  password: '',
  password_confirmation: '',
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const submitErrorMessage = ref<string | null>(null)
const isSubmittedSuccess = ref(false)

const canSubmit = computed(() => {
  return (
    form.value.first_name.trim().length > 0 &&
    form.value.last_name.trim().length > 0 &&
    peutEnvoyerMotDePasse(form.value.password, form.value.password_confirmation) &&
    !acceptMutation.isPending.value
  )
})

const roleBadge = computed(() => {
  const role = invitation.value?.role
  switch (role) {
    case 'super_admin':
      return {
        label: 'Super Administrateur',
        bg: 'bg-savane-soft text-savane-ink ring-1 ring-savane/30',
        icon: ShieldCheckIcon,
      }
    case 'admin':
      return {
        label: 'Administrateur',
        bg: 'bg-info-soft text-info-ink ring-1 ring-info-line',
        icon: SettingsIcon,
      }
    case 'moderateur':
      return {
        label: 'Modérateur',
        bg: 'bg-forest-soft text-forest ring-1 ring-forest/20',
        icon: ScaleIcon,
      }
    case 'formateur':
      return {
        label: 'Formateur',
        bg: 'bg-mint text-primary-shade ring-1 ring-primary/25',
        icon: GraduationCapIcon,
      }
    default:
      return {
        label: invitation.value?.role_label || 'Collaborateur',
        bg: 'bg-canvas text-body ring-1 ring-line',
        icon: UserIcon,
      }
  }
})

function formatExpiration(iso: string | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function handleSubmit() {
  if (!canSubmit.value || !token.value) return

  submitErrorMessage.value = null

  try {
    const res = await acceptMutation.mutateAsync({
      token: token.value,
      first_name: form.value.first_name.trim(),
      last_name: form.value.last_name.trim(),
      password: form.value.password,
      password_confirmation: form.value.password_confirmation,
    })

    isSubmittedSuccess.value = true

    // Redirection fluide vers l'espace dédié
    setTimeout(() => {
      const roles = res.user?.roles || []
      // A new admin starts on the applications queue; everyone else on
      // their own workspace home.
      const isPlainAdmin = roles.includes('admin') && !roles.includes('super_admin')
      router.push(isPlainAdmin ? '/admin/candidatures' : homeFor(roles))
    }, 1800)
  } catch (err) {
    if (err instanceof ApiError) {
      submitErrorMessage.value = err.displayMessage
    } else {
      submitErrorMessage.value = 'Une erreur inattendue est survenue lors de la configuration.'
    }
  }
}
</script>

<template>
  <AuthShell
    title="Rejoignez l'équipe PADCI Formation"
    text="Vous avez été invité à encadrer des cohortes, modérer des contenus ou administrer la plateforme. Activez votre compte pour commencer."
  >
    <!-- ── ÉTAT 1 : CHARGEMENT ────────────────────────────────────────── -->
    <div v-if="isLoadingDetails" class="animate-pulse">
      <div class="space-y-6">
        <div class="h-5 w-32 bg-line rounded-full"></div>
        <div class="h-8 w-3/4 bg-line rounded-lg"></div>
        <div class="h-4 w-1/2 bg-canvas rounded-lg"></div>
        <div class="space-y-4 pt-4">
          <div class="h-12 bg-canvas rounded-xl"></div>
          <div class="h-12 bg-canvas rounded-xl"></div>
          <div class="h-12 bg-canvas rounded-xl"></div>
        </div>
        <p class="text-sm text-center text-quiet pt-2">Vérification de l'invitation en cours...</p>
      </div>
    </div>

    <!-- ── ÉTAT 2 : ERREUR / INVITATION EXPIRÉE OU INVALIDE ────────────── -->
    <div v-else-if="!token || isTokenError">
      <div class="text-center space-y-5">
        <div
          class="w-16 h-16 rounded-full bg-danger-soft text-danger-ink flex items-center justify-center mx-auto ring-8 ring-danger-line/60"
        >
          <AlertTriangleIcon class="w-8 h-8" />
        </div>

        <div>
          <h1 class="text-3xl font-bold text-ink">Invitation inaccessible</h1>
          <p class="text-sm text-quiet mt-2 max-w-md mx-auto leading-relaxed">
            {{
              tokenError instanceof ApiError
                ? tokenError.displayMessage
                : "Ce lien d'invitation est invalide, a expiré (délai de 72h) ou a déjà été utilisé pour créer un compte."
            }}
          </p>
        </div>

        <div class="pt-4 border-t border-line">
          <router-link to="/" class="app-action-secondary">
            Retour à la page de connexion
            <ArrowRightIcon class="w-4 h-4" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- ── ÉTAT 3 : SUCCÈS APRÈS VALIDATION ──────────────────────────── -->
    <div v-else-if="isSubmittedSuccess" class="bg-mint/50">
      <div class="text-center space-y-5">
        <div
          class="w-16 h-16 rounded-full bg-mint text-primary-shade flex items-center justify-center mx-auto ring-8 ring-primary/25 animate-bounce"
        >
          <CheckCircle2Icon class="w-8 h-8" />
        </div>

        <div>
          <h1 class="text-3xl font-bold text-ink">Bienvenue sur EMSP !</h1>
          <p class="text-sm text-quiet mt-2 max-w-md mx-auto leading-relaxed">
            Votre compte collaborateur a été configuré avec succès. Vous allez être redirigé
            automatiquement vers votre espace de travail...
          </p>
        </div>

        <div class="flex items-center justify-center gap-2 text-xs text-primary font-medium">
          <span class="inline-block w-2 h-2 rounded-full bg-primary animate-ping"></span>
          Connexion automatique en cours
        </div>
      </div>
    </div>

    <!-- ── ÉTAT 4 : FORMULAIRE D'ONBOARDING PRINCIPAL ────────────────── -->
    <div v-else-if="invitation">
      <div class="space-y-6">
        <!-- Header du formulaire -->
        <div class="space-y-2">
          <div
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
            :class="roleBadge.bg"
          >
            <component :is="roleBadge.icon" class="size-3.5" aria-hidden="true" />
            <span>Rôle attribué : {{ roleBadge.label }}</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Activer votre accès
          </h1>
          <p class="text-sm text-quiet">
            Renseignez vos coordonnées et choisissez un mot de passe pour finaliser la création de
            votre compte.
          </p>
        </div>

        <!-- Carte récapitulative e-mail & expiration -->
        <div
          class="p-3.5 rounded-xl bg-canvas border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
        >
          <div class="flex items-center gap-2 text-ink font-medium">
            <LockIcon class="w-4 h-4 text-quiet shrink-0" />
            <span class="truncate">{{ invitation.email }}</span>
          </div>
          <div class="flex items-center gap-1.5 text-quiet shrink-0">
            <ClockIcon class="w-3.5 h-3.5" />
            <span>Expire le {{ formatExpiration(invitation.expires_at) }}</span>
          </div>
        </div>

        <!-- Formulaire -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Nom et Prénoms (2 colonnes) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label for="last_name" class="block text-xs font-semibold text-body">
                Nom <span class="text-danger">*</span>
              </label>
              <div class="relative">
                <UserIcon
                  class="w-4 h-4 text-quiet absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="last_name"
                  v-model="form.last_name"
                  type="text"
                  required
                  placeholder="Dupont"
                  class="app-input min-h-12 text-base pl-10 pr-3.5"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label for="first_name" class="block text-xs font-semibold text-body">
                Prénoms <span class="text-danger">*</span>
              </label>
              <div class="relative">
                <UserIcon
                  class="w-4 h-4 text-quiet absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  id="first_name"
                  v-model="form.first_name"
                  type="text"
                  required
                  placeholder="Jean-Michel"
                  class="app-input min-h-12 text-base pl-10 pr-3.5"
                />
              </div>
            </div>
          </div>

          <!-- Mot de passe -->
          <div class="space-y-1.5 pt-2">
            <label for="password" class="block text-xs font-semibold text-body">
              Mot de passe <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <LockIcon
                class="w-4 h-4 text-quiet absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                class="app-input min-h-12 text-base pl-10 pr-10"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-quiet hover:text-ink transition-colors"
              >
                <EyeOffIcon v-if="showPassword" class="w-4 h-4" />
                <EyeIcon v-else class="w-4 h-4" />
              </button>
            </div>

            <!-- Checklist des 5 règles -->
            <ChecklistMotDePasse :mot-de-passe="form.password" />
          </div>

          <!-- Confirmation Mot de passe -->
          <div class="space-y-1.5 pt-2">
            <label for="password_confirmation" class="block text-xs font-semibold text-body">
              Confirmer le mot de passe <span class="text-danger">*</span>
            </label>
            <div class="relative">
              <LockIcon
                class="w-4 h-4 text-quiet absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                id="password_confirmation"
                v-model="form.password_confirmation"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                placeholder="••••••••••••"
                class="app-input min-h-12 text-base pl-10 pr-10"
              />
              <button
                type="button"
                @click="showConfirmPassword = !showConfirmPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-quiet hover:text-ink transition-colors"
              >
                <EyeOffIcon v-if="showConfirmPassword" class="w-4 h-4" />
                <EyeIcon v-else class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Erreur de soumission -->
          <div v-if="submitErrorMessage" class="app-alert app-alert-danger flex items-center gap-2">
            <AlertTriangleIcon class="w-4 h-4 shrink-0" />
            <span>{{ submitErrorMessage }}</span>
          </div>

          <!-- Bouton de soumission avec Button-in-Button Trailing Icon -->
          <div class="pt-4">
            <button
              type="submit"
              :disabled="!canSubmit"
              class="app-action-primary min-h-12 w-full text-base group relative justify-between"
            >
              <span v-if="acceptMutation.isPending.value">Activation du compte en cours...</span>
              <span v-else>Activer mon compte & Accéder à la plateforme</span>

              <span
                class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:bg-white/30 group-hover:translate-x-0.5"
              >
                <ArrowRightIcon class="w-4 h-4 text-white" />
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </AuthShell>
</template>
