<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  XIcon,
  MailIcon,
  ArrowRightIcon,
  ClockIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
} from '@lucide/vue'
import { useCreateAdminInvitation, type AdminInvitation } from '../composables/useAdminInvitations'
import { ApiError } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

withDefaults(
  defineProps<{
    open: boolean
  }>(),
  {
    open: false,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'invited', invitation: AdminInvitation): void
}>()

const auth = useAuthStore()
const createMutation = useCreateAdminInvitation()

const email = ref('')
const selectedRole = ref('admin')
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const isSuperAdmin = computed(() => auth.hasRole('super_admin'))

const availableRoles = computed(() => {
  const roles = [
    {
      value: 'admin',
      label: 'Administrateur',
      desc: 'Gestion opérationnelle, utilisateurs, formations et cohortes',
      badge: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    },
    {
      value: 'moderateur',
      label: 'Modérateur',
      desc: 'Revue, validation et publication des contenus de formation',
      badge: 'bg-purple-50 text-purple-700 ring-1 ring-purple-200',
    },
    {
      value: 'formateur',
      label: 'Formateur',
      desc: 'Création et animation des cours et évaluations',
      badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    },
  ]

  if (isSuperAdmin.value) {
    roles.unshift({
      value: 'super_admin',
      label: 'Super Administrateur',
      desc: 'Accès total : gouvernance, paramètres critiques, signature ANO',
      badge: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
    })
  }

  return roles
})

const isValidEmail = computed(() => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())
})

const canSubmit = computed(() => {
  return isValidEmail.value && !createMutation.isPending.value
})

async function handleSubmit() {
  if (!canSubmit.value) return

  errorMessage.value = null
  successMessage.value = null

  try {
    const invitation = await createMutation.mutateAsync({
      email: email.value.trim().toLowerCase(),
      role: selectedRole.value,
    })

    successMessage.value = `Invitation envoyée avec succès à ${invitation.email}.`
    emit('invited', invitation)

    setTimeout(() => {
      email.value = ''
      successMessage.value = null
      emit('close')
    }, 1200)
  } catch (err) {
    if (err instanceof ApiError) {
      errorMessage.value = err.displayMessage
    } else {
      errorMessage.value = "Une erreur est survenue lors de l'envoi de l'invitation."
    }
  }
}

function handleClose() {
  if (createMutation.isPending.value) return
  errorMessage.value = null
  successMessage.value = null
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
    <!-- Backdrop flouté -->
    <div
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
      @click="handleClose"
    ></div>

    <!-- Double-Bezel Modal Window -->
    <div
      class="relative z-10 w-full max-w-lg rounded-[2rem] p-2 bg-white/20 ring-1 ring-white/30 backdrop-blur-xl shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] animate-fade-in-up"
    >
      <div class="rounded-[calc(2rem-0.5rem)] bg-white p-6 sm:p-8 space-y-6">
        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <div
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary/10 text-primary"
            >
              <ClockIcon class="w-3 h-3" />
              <span>Validité 72 Heures</span>
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Inviter un collaborateur
            </h2>
            <p class="text-xs sm:text-sm text-quiet">
              Un e-mail d'activation sera envoyé avec un lien sécurisé pour définir le mot de passe.
            </p>
          </div>

          <button
            type="button"
            @click="handleClose"
            class="p-2 rounded-xl text-quiet hover:text-ink hover:bg-canvas transition-colors"
          >
            <XIcon class="w-5 h-5" />
          </button>
        </div>

        <!-- Success Alert -->
        <div
          v-if="successMessage"
          class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800 animate-fade-in"
        >
          <CheckCircle2Icon class="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{{ successMessage }}</span>
        </div>

        <!-- Error Alert -->
        <div
          v-if="errorMessage"
          class="p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-xs text-red-700 animate-fade-in"
        >
          <AlertTriangleIcon class="w-5 h-5 text-red-500 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-5">
          <!-- Email Input -->
          <div class="space-y-1.5">
            <label for="invite-email" class="block text-xs font-semibold text-body">
              Adresse e-mail institutionnelle <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <MailIcon
                class="w-4 h-4 text-quiet absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                id="invite-email"
                v-model="email"
                type="email"
                required
                placeholder="collaborateur@emsp.ci"
                class="w-full pl-10 pr-3.5 py-2.5 text-sm bg-canvas border border-line rounded-xl text-ink focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all duration-300"
              />
            </div>
          </div>

          <!-- Role Selection Grid -->
          <div class="space-y-2">
            <label class="block text-xs font-semibold text-body">
              Rôle attribué <span class="text-red-500">*</span>
            </label>

            <div class="space-y-2">
              <label
                v-for="role in availableRoles"
                :key="role.value"
                class="flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer"
                :class="
                  selectedRole === role.value
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-line hover:border-line-strong bg-white'
                "
              >
                <input
                  type="radio"
                  name="role"
                  :value="role.value"
                  v-model="selectedRole"
                  class="mt-1 text-primary focus:ring-primary"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-ink">{{ role.label }}</span>
                    <span
                      class="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      :class="role.badge"
                    >
                      {{ role.value }}
                    </span>
                  </div>
                  <p class="text-xs text-quiet mt-0.5 leading-relaxed">
                    {{ role.desc }}
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              @click="handleClose"
              class="px-5 py-2.5 rounded-full text-xs font-semibold text-body hover:text-ink hover:bg-canvas transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              :disabled="!canSubmit"
              class="group relative inline-flex items-center gap-3 pl-5 pr-2 py-2 rounded-full font-semibold text-xs text-white bg-gradient-to-r from-primary to-primary-bright hover:from-primary-shade hover:to-primary shadow-md hover:shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <span v-if="createMutation.isPending.value">Envoi en cours...</span>
              <span v-else>Envoyer l'invitation</span>

              <span
                class="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 group-hover:bg-white/30 group-hover:translate-x-0.5"
              >
                <ArrowRightIcon class="w-3.5 h-3.5 text-white" />
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
