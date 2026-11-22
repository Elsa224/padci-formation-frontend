<template>
  <div class="app-page max-w-6xl">
    <!-- ================= 1. EN-TÊTE DU PROFIL ================= -->
    <div class="app-panel overflow-hidden p-0">
      <div class="h-20 bg-primary/[0.08] border-b border-line"></div>

      <div class="px-6 sm:px-10 pb-8 relative">
        <div v-if="isPending" class="pt-6 text-sm text-quiet">Chargement du profil…</div>
        <div v-else-if="isError" class="pt-6 text-sm text-red-600">
          {{ (error as ApiError)?.message ?? 'Impossible de charger le profil.' }}
        </div>

        <div
          v-else-if="profile"
          class="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-12 sm:-mt-16"
        >
          <div
            class="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white p-1 shadow-lg shrink-0 relative z-10"
          >
            <div
              class="w-full h-full rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
            >
              <img
                v-if="photo.data.value"
                :src="photo.data.value"
                alt="Votre photo de profil"
                class="h-full w-full object-cover"
              />
              <span v-else class="text-3xl sm:text-4xl font-bold text-quiet">{{
                initialsOf(profile.name)
              }}</span>
            </div>
          </div>

          <div class="flex-1 text-center sm:text-left mb-2">
            <h1 class="text-2xl sm:text-3xl font-bold text-ink">{{ profile.name }}</h1>
            <p class="text-sm text-quiet font-medium mt-1">{{ roleLabel(profile.roles) }}</p>
            <div class="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                :class="
                  profile.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-quiet'
                "
              >
                <span
                  class="w-1.5 h-1.5 rounded-full"
                  :class="profile.is_active ? 'bg-green-500' : 'bg-gray-400'"
                ></span>
                {{ profile.is_active ? 'Compte actif' : 'Compte désactivé' }}
              </span>
              <span
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold"
                :class="
                  profile.email_verified
                    ? 'bg-primary/10 text-primary'
                    : 'bg-amber-100 text-amber-700'
                "
              >
                {{ profile.email_verified ? 'Email vérifié' : 'Email non vérifié' }}
              </span>
            </div>
          </div>

          <div class="flex gap-3 w-full sm:w-auto mt-4 sm:mt-0">
            <label class="app-action-secondary gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="sr-only"
                :disabled="upload.isPending.value"
                @change="selectPhoto"
              />
              {{ upload.isPending.value ? 'Envoi...' : 'Changer la photo' }}
            </label>
            <button
              v-if="profile.has_profile_photo"
              class="app-action-secondary"
              :disabled="remove.isPending.value"
              @click="remove.mutate()"
            >
              Supprimer
            </button>
            <router-link :to="settingsPath" class="app-action-primary flex-1 gap-2 sm:flex-none">
              <SquarePenIcon :size="18" />
              Paramètres du compte
            </router-link>
          </div>
        </div>
        <p v-if="photoError" role="alert" class="mt-4 text-sm text-red-700">{{ photoError }}</p>
      </div>
    </div>

    <template v-if="profile">
      <!-- ================= 2. CONTENU (2 COLONNES) ================= -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- COLONNE GAUCHE : Informations du compte -->
        <div class="lg:col-span-1 space-y-6">
          <div class="bg-white rounded-xl shadow-sm border border-line p-6">
            <h2 class="text-lg font-bold text-ink mb-4 flex items-center gap-2">
              <CircleUserIcon class="text-primary" :size="20" /> Informations
            </h2>

            <div class="space-y-4 text-sm">
              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center shrink-0 text-quiet"
                >
                  <MailIcon :size="18" />
                </div>
                <div>
                  <p class="text-quiet text-xs font-medium">Email</p>
                  <p class="text-ink font-medium break-all">{{ profile.email }}</p>
                </div>
              </div>

              <div class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center shrink-0 text-quiet"
                >
                  <ShieldCheckIcon :size="18" />
                </div>
                <div>
                  <p class="text-quiet text-xs font-medium">Authentification à deux facteurs</p>
                  <p class="text-ink font-medium">
                    {{ profile.mfa_enabled ? 'Activée' : 'Désactivée' }}
                  </p>
                </div>
              </div>

              <div v-if="profile.last_login_at" class="flex items-start gap-3">
                <div
                  class="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center shrink-0 text-quiet"
                >
                  <ClockIcon :size="18" />
                </div>
                <div>
                  <p class="text-quiet text-xs font-medium">Dernière connexion</p>
                  <p class="text-ink font-medium">{{ formatDate(profile.last_login_at) }}</p>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-line">
              <button class="app-action-secondary w-full gap-2 text-red-700" @click="logout">
                <LogOutIcon :size="18" /> Se déconnecter
              </button>
            </div>
          </div>
        </div>

        <!-- COLONNE DROITE : Statistiques réelles -->
        <div class="lg:col-span-2 space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-white rounded-xl shadow-sm border border-line p-4 text-center">
              <div
                class="w-10 h-10 mx-auto rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2"
              >
                <BookOpenTextIcon :size="20" />
              </div>
              <p class="text-2xl font-bold text-ink">{{ counts?.enrollments ?? '-' }}</p>
              <p class="text-xs text-quiet font-medium">Formations suivies</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm border border-line p-4 text-center">
              <div
                class="w-10 h-10 mx-auto rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2"
              >
                <TrophyIcon :size="20" />
              </div>
              <p class="text-2xl font-bold text-ink">{{ counts?.certificates ?? '-' }}</p>
              <p class="text-xs text-quiet font-medium">Certificats</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  BookOpenTextIcon,
  CircleUserIcon,
  ClockIcon,
  LogOutIcon,
  MailIcon,
  ShieldCheckIcon,
  SquarePenIcon,
  TrophyIcon,
} from '@lucide/vue'
import type { ApiError } from '@/api/http'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useLogout } from '@/features/auth/composables/useLogout'
import { useLearnerCounts, useProfile, useProfilePhoto } from '../composables/useProfile'

const { data: profile, isPending, isError, error } = useProfile()
const { data: counts } = useLearnerCounts()
// The view is mounted both in the learner shell (/profil) and the trainer
// shell (/formateur/profil): stay in the current workspace.
const route = useRoute()
const settingsPath = computed(() =>
  route.path.startsWith('/formateur') ? '/formateur/parametres' : '/parametres',
)
const logout = useLogout()
const { photo, upload, remove } = useProfilePhoto()
const photoError = ref('')
function selectPhoto(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  photoError.value = ''
  if (
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
    file.size > 2 * 1024 * 1024
  ) {
    photoError.value = 'Choisissez une image JPEG, PNG ou WebP de 2 Mo maximum.'
  } else {
    upload.mutate(file, {
      onError: (error) => {
        photoError.value = (error as ApiError).displayMessage || 'Impossible d’envoyer la photo.'
      },
    })
  }
  input.value = ''
}

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function roleLabel(roles: string[]): string {
  const labels: Record<string, string> = {
    apprenant: 'Apprenant',
    formateur: 'Formateur',
    moderateur: 'Modérateur',
    admin: 'Administrateur',
    super_admin: 'Super administrateur',
  }
  return roles.map((role) => labels[role] ?? role).join(', ') || 'Apprenant'
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString('fr-FR')
}
</script>

<style scoped>
/* Aucun style CSS supplémentaire n'est requis, tout est géré par Tailwind */
</style>
