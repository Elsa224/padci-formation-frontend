<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, KeyRound } from '@lucide/vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/api/http'
import { useMfaSetup, useMfaConfirm } from '../composables/useMfaSetup'

// FR-006/ADR-006: super_admin/admin cannot use anything beyond their own
// profile until TOTP is confirmed (enforced server-side by
// EnsureMfaIsEnabled). This is where the 428 AUTH_MFA_SETUP_REQUIRED
// redirect (see api/http.ts) lands.

const router = useRouter()
const auth = useAuthStore()
const setup = useMfaSetup()
const confirm = useMfaConfirm()

const secret = ref<string | null>(null)
const provisioningUri = ref<string | null>(null)
const code = ref('')
const recoveryCodes = ref<string[] | null>(null)
const errorMessage = ref<string | null>(null)

onMounted(async () => {
  try {
    const data = await setup.mutateAsync()
    secret.value = data.secret
    provisioningUri.value = data.provisioning_uri
  } catch (error) {
    errorMessage.value =
      error instanceof ApiError ? error.message : 'Impossible de démarrer la configuration.'
  }
})

async function submitConfirm(): Promise<void> {
  if (secret.value === null) return
  errorMessage.value = null

  try {
    const data = await confirm.mutateAsync({ secret: secret.value, code: code.value })
    recoveryCodes.value = data.recovery_codes
  } catch (error) {
    errorMessage.value = error instanceof ApiError ? error.message : 'Code invalide.'
  }
}

async function finishAndContinue(): Promise<void> {
  await router.push(
    auth.hasRole('super_admin')
      ? '/superadmin/dashboard'
      : auth.hasRole('admin')
        ? '/admin/dashboard'
        : '/parametres',
  )
}
</script>

<template>
  <main class="flex min-h-[100dvh] items-center justify-center bg-canvas px-4 py-10">
    <section class="app-panel w-full max-w-lg" aria-labelledby="mfa-title">
      <div
        class="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
      >
        <ShieldCheck :size="24" aria-hidden="true" />
      </div>
      <h1 id="mfa-title" class="app-page-title">Sécuriser mon compte</h1>
      <p class="mt-2 text-sm leading-6 text-quiet">
        Configurez la double authentification avec votre application d'authentification.
      </p>
      <div class="mt-6 space-y-5">
        <p v-if="errorMessage" role="alert" class="text-sm text-red-600">{{ errorMessage }}</p>

        <!-- Codes de récupération : affichés une seule fois, après confirmation -->
        <div v-if="recoveryCodes" class="space-y-4">
          <span
            class="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
            >Activée</span
          >
          <p class="text-sm text-neutral-700">
            Conservez ces codes de récupération en lieu sûr - ils ne seront plus jamais affichés.
          </p>
          <div class="grid grid-cols-2 gap-2 rounded-lg bg-neutral-100 p-4 font-mono text-sm">
            <span v-for="rc in recoveryCodes" :key="rc">{{ rc }}</span>
          </div>
          <button class="app-action-primary w-full" @click="finishAndContinue">
            J'ai noté mes codes, continuer
          </button>
        </div>

        <!-- Étape 1 : scanner / saisir le secret -->
        <div v-else-if="secret" class="space-y-4">
          <p class="text-sm text-neutral-600">
            Ajoutez ce secret dans votre application d'authentification (Google Authenticator,
            Authy…), puis saisissez le code généré.
          </p>
          <div class="rounded-xl border border-line bg-canvas p-4">
            <p class="mb-2 flex items-center gap-2 text-xs font-bold text-quiet">
              <KeyRound :size="15" /> Clé de configuration
            </p>
            <p class="break-all font-mono text-sm text-ink">{{ secret }}</p>
          </div>
          <form class="space-y-3" @submit.prevent="submitConfirm">
            <div>
              <label for="mfa-setup-code" class="mb-1 block text-sm font-semibold text-ink"
                >Code à 6 chiffres</label
              >
              <input
                id="mfa-setup-code"
                v-model="code"
                class="app-input"
                inputmode="numeric"
                autocomplete="one-time-code"
                required
              />
            </div>
            <button
              type="submit"
              class="app-action-primary w-full"
              :disabled="confirm.isPending.value"
            >
              {{ confirm.isPending.value ? 'Vérification…' : 'Activer' }}
            </button>
          </form>
        </div>

        <p v-else class="text-sm text-neutral-500">Préparation…</p>
      </div>
    </section>
  </main>
</template>
