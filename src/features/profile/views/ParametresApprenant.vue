<template>
  <div class="app-page max-w-4xl">
    <!-- ================= EN-TÊTE ================= -->
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Paramètres</h1>
        <p class="app-page-copy">Gérez vos informations et la sécurité de votre compte.</p>
      </div>
    </div>

    <!-- ================= SECTION : PROFIL ================= -->
    <div class="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
      <div class="px-6 py-4 border-b border-line bg-canvas/50">
        <h2 class="text-lg font-bold text-ink flex items-center gap-2">
          <CircleUserIcon class="text-primary" :size="20" /> Profil
        </h2>
      </div>
      <div class="p-6 space-y-4">
        <div v-if="isProfilePending" class="text-sm text-quiet">Chargement…</div>
        <form v-else @submit.prevent="submitProfile" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-ink mb-1">Nom</label>
            <input v-model="profileForm.name" type="text" class="app-input" />
            <p v-if="profileErrors.name" class="text-xs text-red-600 mt-1">
              {{ profileErrors.name[0] }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink mb-1">Email</label>
            <input v-model="profileForm.email" type="email" class="app-input" />
            <p v-if="profileErrors.email" class="text-xs text-red-600 mt-1">
              {{ profileErrors.email[0] }}
            </p>
            <p v-else-if="emailChanged" class="text-xs text-amber-600 mt-1">
              Changer l'email nécessite de le vérifier à nouveau avant la prochaine connexion.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="submit"
              :disabled="updateProfileMutation.isPending.value"
              class="app-action-primary gap-2"
            >
              <SaveIcon :size="18" />
              Enregistrer
            </button>
            <span v-if="profileSaved" class="text-sm text-primary font-medium">Enregistré.</span>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= SECTION : SÉCURITÉ ================= -->
    <div class="bg-white rounded-xl shadow-sm border border-line overflow-hidden">
      <div class="px-6 py-4 border-b border-line bg-canvas/50">
        <h2 class="text-lg font-bold text-ink flex items-center gap-2">
          <ShieldHalfIcon class="text-primary" :size="20" /> Sécurité
        </h2>
      </div>
      <div class="p-6 space-y-6">
        <!-- Mot de passe -->
        <form @submit.prevent="submitPassword" class="space-y-4">
          <p class="font-medium text-ink">Changer le mot de passe</p>
          <div>
            <label class="block text-sm font-medium text-ink mb-1">Mot de passe actuel</label>
            <input v-model="passwordForm.current_password" type="password" class="app-input" />
            <p v-if="passwordErrors.current_password" class="text-xs text-red-600 mt-1">
              {{ passwordErrors.current_password[0] }}
            </p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-ink mb-1">Nouveau mot de passe</label>
              <input v-model="passwordForm.password" type="password" class="app-input" />
              <p v-if="passwordErrors.password" class="text-xs text-red-600 mt-1">
                {{ passwordErrors.password[0] }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-ink mb-1">Confirmation</label>
              <input
                v-model="passwordForm.password_confirmation"
                type="password"
                class="app-input"
              />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button
              type="submit"
              :disabled="changePasswordMutation.isPending.value"
              class="app-action-primary"
            >
              Changer le mot de passe
            </button>
            <span v-if="passwordChanged" class="text-sm text-primary font-medium"
              >Mot de passe changé. Vos autres sessions ont été déconnectées.</span
            >
          </div>
        </form>

        <!-- Double authentification (2FA) -->
        <div class="flex items-center justify-between gap-4 pt-6 border-t border-line">
          <div>
            <p class="font-medium text-ink">Double authentification (2FA)</p>
            <p class="text-sm text-quiet">
              {{
                profile?.mfa_enabled
                  ? 'Activée sur ce compte.'
                  : 'Ajoutez une couche de sécurité supplémentaire.'
              }}
            </p>
          </div>
          <router-link
            v-if="!profile?.mfa_enabled"
            to="/mfa/configuration"
            class="app-action-secondary shrink-0"
          >
            Activer
          </router-link>
          <button
            v-else
            @click="disableMfa"
            :disabled="mfaDisableMutation.isPending.value"
            class="app-action-secondary shrink-0 text-red-700"
          >
            Désactiver
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CircleUserIcon, SaveIcon, ShieldHalfIcon } from '@lucide/vue'
import { useQueryClient } from '@tanstack/vue-query'
import { computed, reactive, ref, watch } from 'vue'
import type { ApiError } from '@/api/http'
import { useMfaDisable } from '@/features/auth/composables/useMfaSetup'
import { useChangePassword, useProfile, useUpdateProfile } from '../composables/useProfile'

// ==================== PROFIL (nom / email) ====================
const { data: profile, isPending: isProfilePending } = useProfile()

const profileForm = reactive({ name: '', email: '' })
watch(
  profile,
  (value) => {
    if (value) {
      profileForm.name = value.name
      profileForm.email = value.email
    }
  },
  { immediate: true },
)

const emailChanged = computed(
  () =>
    profile.value !== undefined &&
    profile.value !== null &&
    profileForm.email !== profile.value.email,
)

const updateProfileMutation = useUpdateProfile()
const profileErrors = ref<Record<string, string[]>>({})
const profileSaved = ref(false)

function submitProfile() {
  profileErrors.value = {}
  profileSaved.value = false
  updateProfileMutation.mutate(
    { name: profileForm.name, email: profileForm.email },
    {
      onSuccess: () => {
        profileSaved.value = true
      },
      onError: (mutationError) => {
        profileErrors.value = (mutationError as ApiError).fieldErrors
      },
    },
  )
}

// ==================== MOT DE PASSE ====================
const passwordForm = reactive({ current_password: '', password: '', password_confirmation: '' })
const changePasswordMutation = useChangePassword()
const passwordErrors = ref<Record<string, string[]>>({})
const passwordChanged = ref(false)

function submitPassword() {
  passwordErrors.value = {}
  passwordChanged.value = false
  changePasswordMutation.mutate(
    { ...passwordForm },
    {
      onSuccess: () => {
        passwordChanged.value = true
        passwordForm.current_password = ''
        passwordForm.password = ''
        passwordForm.password_confirmation = ''
      },
      onError: (mutationError) => {
        passwordErrors.value = (mutationError as ApiError).fieldErrors
      },
    },
  )
}

// ==================== MFA ====================
const queryClient = useQueryClient()
const mfaDisableMutation = useMfaDisable()
function disableMfa() {
  mfaDisableMutation.mutate(undefined, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
</script>
