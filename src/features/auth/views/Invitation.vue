<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ShieldCheckIcon,
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
import logoEmsp from '@/assets/images/logoemsp.png'
import bgPhoto from '@/assets/images/photodecybersecurite.jpg'

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
        icon: '🛡️',
      }
    case 'admin':
      return {
        label: 'Administrateur',
        bg: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
        icon: '⚙️',
      }
    case 'moderateur':
      return {
        label: 'Modérateur',
        bg: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
        icon: '⚖️',
      }
    case 'formateur':
      return {
        label: 'Formateur',
        bg: 'bg-mint text-primary-shade ring-1 ring-primary/25',
        icon: '🎓',
      }
    default:
      return {
        label: invitation.value?.role_label || 'Collaborateur',
        bg: 'bg-canvas text-body ring-1 ring-line',
        icon: '👤',
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
  <div
    class="min-h-[100dvh] flex flex-col md:flex-row relative bg-canvas text-ink selection:bg-primary/20 selection:text-primary"
  >
    <!-- ================= COLONNE FORMULAIRE / ONBOARDING (GAUCHE) ================= -->
    <div
      class="flex w-full md:w-1/2 min-h-screen items-center justify-center p-6 sm:p-10 lg:p-14 relative z-10"
    >
      <div class="w-full max-w-xl">
        <!-- Logo Header -->
        <div class="flex items-center gap-3 mb-8">
          <img :src="logoEmsp" alt="EMSP LMS" class="h-10 w-auto object-contain" />
          <div class="h-6 w-px bg-line"></div>
          <span class="app-label"> Plateforme Institutionnelle </span>
        </div>

        <!-- ── ÉTAT 1 : CHARGEMENT ────────────────────────────────────────── -->
        <div
          v-if="isLoadingDetails"
          class="rounded-[2rem] p-2 ring-1 ring-black/5 bg-canvas/60 animate-pulse"
        >
          <div class="rounded-[calc(2rem-0.5rem)] bg-white p-8 sm:p-10 space-y-6">
            <div class="h-5 w-32 bg-line rounded-full"></div>
            <div class="h-8 w-3/4 bg-line rounded-lg"></div>
            <div class="h-4 w-1/2 bg-canvas rounded-lg"></div>
            <div class="space-y-4 pt-4">
              <div class="h-12 bg-canvas rounded-xl"></div>
              <div class="h-12 bg-canvas rounded-xl"></div>
              <div class="h-12 bg-canvas rounded-xl"></div>
            </div>
            <p class="text-sm text-center text-quiet pt-2">
              Vérification de l'invitation en cours...
            </p>
          </div>
        </div>

        <!-- ── ÉTAT 2 : ERREUR / INVITATION EXPIRÉE OU INVALIDE ────────────── -->
        <div
          v-else-if="!token || isTokenError"
          class="rounded-[2rem] p-2 ring-1 ring-red-200 bg-red-50/50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        >
          <div
            class="rounded-[calc(2rem-0.5rem)] bg-white p-8 sm:p-10 text-center space-y-5 shadow-sm"
          >
            <div
              class="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto ring-8 ring-red-50/60"
            >
              <AlertTriangleIcon class="w-8 h-8" />
            </div>

            <div>
              <h1 class="text-2xl font-bold text-ink">Invitation inaccessible</h1>
              <p class="text-sm text-quiet mt-2 max-w-md mx-auto leading-relaxed">
                {{
                  tokenError instanceof ApiError
                    ? tokenError.displayMessage
                    : "Ce lien d'invitation est invalide, a expiré (délai de 72h) ou a déjà été utilisé pour créer un compte."
                }}
              </p>
            </div>

            <div class="pt-4 border-t border-line">
              <router-link
                to="/"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                Retour à la page de connexion
                <ArrowRightIcon class="w-4 h-4" />
              </router-link>
            </div>
          </div>
        </div>

        <!-- ── ÉTAT 3 : SUCCÈS APRÈS VALIDATION ──────────────────────────── -->
        <div
          v-else-if="isSubmittedSuccess"
          class="rounded-[2rem] p-2 ring-1 ring-primary/25 bg-mint/50 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
        >
          <div
            class="rounded-[calc(2rem-0.5rem)] bg-white p-8 sm:p-10 text-center space-y-5 shadow-sm"
          >
            <div
              class="w-16 h-16 rounded-full bg-mint text-primary-shade flex items-center justify-center mx-auto ring-8 ring-primary/25 animate-bounce"
            >
              <CheckCircle2Icon class="w-8 h-8" />
            </div>

            <div>
              <h1 class="text-2xl font-bold text-ink">Bienvenue sur EMSP !</h1>
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
        <div
          v-else-if="invitation"
          class="rounded-[2rem] p-2 ring-1 ring-black/5 bg-canvas/80 backdrop-blur-sm transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl shadow-slate-200/50"
        >
          <div class="rounded-[calc(2rem-0.5rem)] bg-white p-7 sm:p-10 space-y-6">
            <!-- Header du formulaire -->
            <div class="space-y-2">
              <div
                class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
                :class="roleBadge.bg"
              >
                <span>{{ roleBadge.icon }}</span>
                <span>Rôle attribué : {{ roleBadge.label }}</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                Activer votre accès
              </h1>
              <p class="text-sm text-quiet">
                Renseignez vos coordonnées et choisissez un mot de passe pour finaliser la création
                de votre compte.
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
                    Nom <span class="text-red-500">*</span>
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
                      class="w-full pl-10 pr-3.5 py-2.5 text-sm bg-canvas border border-line rounded-xl text-ink focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                    />
                  </div>
                </div>

                <div class="space-y-1.5">
                  <label for="first_name" class="block text-xs font-semibold text-body">
                    Prénoms <span class="text-red-500">*</span>
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
                      class="w-full pl-10 pr-3.5 py-2.5 text-sm bg-canvas border border-line rounded-xl text-ink focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
                    />
                  </div>
                </div>
              </div>

              <!-- Mot de passe -->
              <div class="space-y-1.5 pt-2">
                <label for="password" class="block text-xs font-semibold text-body">
                  Mot de passe <span class="text-red-500">*</span>
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
                    class="w-full pl-10 pr-10 py-2.5 text-sm bg-canvas border border-line rounded-xl text-ink focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
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
                  Confirmer le mot de passe <span class="text-red-500">*</span>
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
                    class="w-full pl-10 pr-10 py-2.5 text-sm bg-canvas border border-line rounded-xl text-ink focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
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
              <div
                v-if="submitErrorMessage"
                class="p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-600"
              >
                <AlertTriangleIcon class="w-4 h-4 shrink-0" />
                <span>{{ submitErrorMessage }}</span>
              </div>

              <!-- Bouton de soumission avec Button-in-Button Trailing Icon -->
              <div class="pt-4">
                <button
                  type="submit"
                  :disabled="!canSubmit"
                  class="group relative w-full inline-flex items-center justify-between pl-6 pr-2 py-2 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-primary to-primary-bright hover:from-primary-shade hover:to-primary shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
                >
                  <span v-if="acceptMutation.isPending.value"
                    >Activation du compte en cours...</span
                  >
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

        <p class="text-center text-xs text-quiet mt-8">
          EMSP • École Multinationale Supérieure des Postes © 2026
        </p>
      </div>
    </div>

    <!-- ================= COLONNE BRANDING / VISUELLE (DROITE) ================= -->
    <div
      class="hidden md:flex md:w-1/2 relative bg-slate-900 overflow-hidden min-h-screen items-center justify-center p-12"
    >
      <!-- Background Photo with Overlay -->
      <img
        :src="bgPhoto"
        alt="EMSP Excellence"
        class="absolute inset-0 w-full h-full object-cover opacity-35 scale-105 transition-transform duration-1000 ease-out hover:scale-100"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent"
      ></div>

      <!-- Contenu textuel d'inspiration -->
      <div class="relative z-10 max-w-lg text-white space-y-6">
        <div
          class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-md border border-white/15 text-white"
        >
          <ShieldCheckIcon class="w-4 h-4 text-primary" />
          Espace Collaborateur Sécurisé
        </div>

        <h2 class="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
          L'excellence de la formation postale et numérique.
        </h2>

        <p class="text-slate-300 text-sm lg:text-base leading-relaxed">
          Rejoignez l'équipe pédagogique et administrative de l'EMSP. Participez à l'encadrement des
          cohortes, à la modération académique et au rayonnement des compétences sur tout le
          continent.
        </p>

        <div class="pt-6 grid grid-cols-2 gap-4 border-t border-white/10 text-xs text-quiet">
          <div>
            <p class="text-white font-semibold text-sm">72 Heures</p>
            <p class="mt-0.5">Délai de sécurisation du lien d'onboarding.</p>
          </div>
          <div>
            <p class="text-white font-semibold text-sm">Double Chiffrement</p>
            <p class="mt-0.5">Protection des identifiants et données de session.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
