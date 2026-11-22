<template>
  <section class="app-page max-w-3xl">
    <header class="app-page-header">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">Administration</p>
        <h1 class="app-page-title mt-2">Paramètres</h1>
        <p class="app-page-copy">Règles de la plateforme et sécurité de votre compte.</p>
      </div>
    </header>

    <!-- Modération des cours (ADR-009) -->
    <section class="app-panel space-y-4" aria-labelledby="moderation-title">
      <div>
        <h2 id="moderation-title" class="text-lg font-bold text-ink">Publication des cours</h2>
        <p class="text-sm text-quiet">
          Quand la revue est activée, un cours soumis par un formateur attend la validation d'un
          modérateur ou d'un administrateur avant d'être publié. Désactivée, la soumission publie
          directement.
        </p>
      </div>

      <div v-if="settings.isPending.value" class="app-skeleton h-12" />
      <p v-else-if="settings.isError.value" class="text-sm text-red-700" role="alert">
        {{ apiMessage(settings.error.value, 'Réglage indisponible pour votre compte.') }}
      </p>
      <label
        v-else-if="settings.data.value"
        class="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-line p-4"
      >
        <span>
          <span class="block font-semibold text-ink">Revue des cours avant publication</span>
          <span class="text-sm text-quiet" data-test="moderation-state">
            {{
              settings.data.value.course_moderation_enabled
                ? 'Activée : les cours soumis passent par la modération.'
                : 'Désactivée : les cours soumis sont publiés immédiatement.'
            }}
          </span>
        </span>
        <input
          id="course-moderation"
          type="checkbox"
          role="switch"
          class="h-5 w-5 accent-[var(--color-primary,#198341)]"
          :checked="settings.data.value.course_moderation_enabled"
          :disabled="update.isPending.value"
          data-test="moderation-toggle"
          @change="toggle($event.target as HTMLInputElement)"
        />
      </label>
      <p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
        {{ error }}
      </p>
    </section>

    <!-- Sécurité du compte -->
    <section class="app-panel space-y-3" aria-labelledby="security-title">
      <h2 id="security-title" class="text-lg font-bold text-ink">Sécurité de votre compte</h2>
      <p class="text-sm text-quiet">
        La double authentification protège les comptes d'administration. Configurez-la avec une
        application comme Google Authenticator ou Microsoft Authenticator.
      </p>
      <RouterLink to="/mfa/configuration" class="app-action-secondary w-fit">
        Configurer la double authentification
      </RouterLink>
    </section>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import {
  apiMessage,
  useCourseSettings,
  useUpdateCourseSettings,
} from '../composables/useAdminOperations'

const settings = useCourseSettings()
const update = useUpdateCourseSettings()
const error = ref('')

async function toggle(input: HTMLInputElement) {
  const enabled = input.checked
  error.value = ''
  try {
    await update.mutateAsync({ course_moderation_enabled: enabled })
    toast.success(enabled ? 'Revue des cours activée.' : 'Revue des cours désactivée.')
  } catch (err) {
    // Put the switch back: the setting did not change server-side.
    input.checked = !enabled
    error.value = apiMessage(err, "Le réglage n'a pas pu être enregistré.")
  }
}
</script>
