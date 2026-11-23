<template>
  <PublicLayout>
    <section class="mx-auto max-w-xl space-y-6 px-4 py-12">
      <header class="space-y-2">
        <p class="app-eyebrow">Vérification</p>
        <h1 class="text-2xl font-bold text-ink">Vérifier une attestation</h1>
        <p class="text-sm text-quiet">
          Saisissez le code imprimé sur l'attestation pour confirmer qu'elle a bien été délivrée.
        </p>
      </header>

      <form class="flex flex-col gap-2 sm:flex-row" @submit.prevent="lookup">
        <label for="certificate-code" class="sr-only">Code de l'attestation</label>
        <input
          id="certificate-code"
          v-model.trim="input"
          class="app-input flex-1 font-mono"
          placeholder="Code de l'attestation"
          autocomplete="off"
          required
        />
        <button class="app-action-primary">Vérifier</button>
      </form>

      <div v-if="code && result.isPending.value" class="app-skeleton h-28" />
      <div
        v-else-if="code && result.isError.value"
        class="rounded-xl bg-red-50 p-4 text-sm text-red-800"
        role="alert"
        data-test="verify-not-found"
      >
        Aucune attestation ne correspond à ce code. Vérifiez la saisie.
      </div>
      <div
        v-else-if="result.data.value"
        class="app-panel space-y-2"
        :class="result.data.value.valid ? '' : 'border-red-200'"
        data-test="verify-result"
      >
        <p
          class="text-sm font-bold"
          :class="result.data.value.valid ? 'text-primary' : 'text-red-700'"
        >
          {{ result.data.value.valid ? 'Attestation valide' : 'Attestation non valide' }}
        </p>
        <p v-if="result.data.value.holder_name" class="text-lg font-bold text-ink">
          {{ result.data.value.holder_name }}
        </p>
        <p v-if="result.data.value.course_title" class="text-sm text-ink">
          {{ result.data.value.course_title }}
        </p>
        <p class="text-xs text-quiet">
          <template v-if="result.data.value.issued_at"
            >Délivrée le {{ formatDate(result.data.value.issued_at) }}</template
          >
          <template v-if="result.data.value.revoked_at">
            · révoquée le {{ formatDate(result.data.value.revoked_at) }}</template
          >
        </p>
      </div>
    </section>
  </PublicLayout>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PublicLayout from '@/features/public/layouts/PublicLayout.vue'
import { usePublicCertificate } from '@/features/learning/composables/useCertificates'

// The backend prints `{CERTIFICATE_VERIFY_URL}?code=…` on every certificate.
const route = useRoute()
const router = useRouter()
const initial = typeof route.query.code === 'string' ? route.query.code : ''
const input = ref(initial)
const code = ref(initial)
const result = usePublicCertificate(code)

watch(
  () => route.query.code,
  (value) => {
    if (typeof value === 'string' && value !== code.value) {
      code.value = value
      input.value = value
    }
  },
)

function lookup() {
  code.value = input.value
  void router.replace({ query: { code: input.value } })
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })
function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
</script>
