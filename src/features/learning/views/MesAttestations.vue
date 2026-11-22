<template>
  <section class="app-page max-w-4xl">
    <header class="app-page-header">
      <div>
        <p class="text-xs font-bold uppercase tracking-wider text-primary">Apprentissage</p>
        <h1 class="app-page-title mt-2">Mes attestations</h1>
        <p class="app-page-copy">
          Vos attestations de réussite et vos certifications professionnelles.
        </p>
      </div>
    </header>

    <div class="app-panel space-y-4">
      <h2 class="text-lg font-bold text-ink">Attestations de réussite</h2>
      <div v-if="certificates.isPending.value" class="app-skeleton h-20" />
      <p v-else-if="certificates.isError.value" class="text-sm text-red-700" role="alert">
        Impossible de charger vos attestations.
      </p>
      <p
        v-else-if="!certificates.data.value?.length"
        class="rounded-xl bg-canvas p-6 text-sm text-quiet"
      >
        Aucune attestation pour l'instant. Terminez un cours et réussissez ses évaluations, puis
        demandez votre attestation depuis la page du cours.
      </p>
      <ul v-else class="space-y-3">
        <li
          v-for="certificate in certificates.data.value"
          :key="certificate.key"
          class="space-y-3 rounded-xl border border-line p-4"
          data-test="certificate"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-bold text-ink">{{ certificate.course?.title ?? 'Formation' }}</p>
              <p class="text-xs text-quiet">
                <template v-if="certificate.issued_at"
                  >Délivrée le {{ formatDate(certificate.issued_at) }} ·
                </template>
                Code <span class="font-mono">{{ certificate.code }}</span>
              </p>
            </div>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                certificate.status === 'issued'
                  ? 'bg-primary/10 text-primary'
                  : certificate.status === 'revoked'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-canvas text-quiet'
              "
            >
              {{ certificateStatusLabels[certificate.status] }}
            </span>
          </div>
          <p
            v-if="certificate.status === 'revoked' && certificate.revocation_reason"
            class="text-sm text-red-700"
          >
            Motif : {{ certificate.revocation_reason }}
          </p>
          <div class="flex flex-wrap gap-2">
            <button
              v-if="safeHttpUrl(certificate.download_url)"
              class="app-action-primary"
              :disabled="downloading === certificate.key"
              data-test="download-certificate"
              @click="download(certificate)"
            >
              {{ downloading === certificate.key ? 'Téléchargement…' : 'Télécharger le PDF' }}
            </button>
            <button class="app-action-secondary" @click="copyLink(certificate.verification_url)">
              {{ copied === certificate.key ? 'Lien copié' : 'Copier le lien de vérification' }}
            </button>
          </div>
          <p
            v-if="manualCopy === certificate.key"
            class="select-all break-all rounded-lg bg-canvas p-2 font-mono text-xs text-ink"
          >
            {{ certificate.verification_url }}
          </p>
        </li>
      </ul>
      <p v-if="downloadError" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
        {{ downloadError }}
      </p>
    </div>

    <div class="app-panel space-y-4">
      <h2 class="text-lg font-bold text-ink">Certifications professionnelles</h2>
      <p class="text-sm text-quiet">
        Certifications Cisco, Oracle ou autres enregistrées par l'équipe.
      </p>
      <div v-if="external.isPending.value" class="app-skeleton h-16" />
      <p
        v-else-if="!external.data.value?.length"
        class="rounded-xl bg-canvas p-6 text-sm text-quiet"
      >
        Aucune certification professionnelle enregistrée.
      </p>
      <ul v-else class="divide-y divide-line">
        <li
          v-for="item in external.data.value"
          :key="item.key"
          class="flex flex-wrap justify-between gap-2 py-3 text-sm"
        >
          <span class="font-semibold text-ink">
            {{ item.name }}
            <span class="font-normal text-quiet">· {{ item.provider_label ?? item.provider }}</span>
          </span>
          <span :class="item.is_expired ? 'text-red-700' : 'text-quiet'">
            <template v-if="item.issued_at">Obtenue le {{ formatDate(item.issued_at) }}</template>
            <template v-if="item.expires_at">
              · {{ item.is_expired ? 'expirée le' : 'valable jusqu’au' }}
              {{ formatDate(item.expires_at) }}</template
            >
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { safeHttpUrl } from '@/lib/safeUrl'
import {
  certificateStatusLabels,
  downloadCertificatePdf,
  type Certificate,
  useMyCertificates,
  useMyExternalCertifications,
} from '../composables/useCertificates'

const certificates = useMyCertificates()
const external = useMyExternalCertifications()
const downloading = ref<string | null>(null)
const downloadError = ref('')

async function download(certificate: Certificate) {
  downloading.value = certificate.key
  downloadError.value = ''
  try {
    await downloadCertificatePdf(certificate)
  } catch {
    downloadError.value = "Le PDF n'a pas pu être téléchargé. Rechargez la page et réessayez."
  } finally {
    downloading.value = null
  }
}
const copied = ref<string | null>(null)
// Clipboard refused (permissions, old browser): show the link to select by hand.
const manualCopy = ref<string | null>(null)

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' })
function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}

async function copyLink(url: string) {
  const certificate = certificates.data.value?.find((item) => item.verification_url === url)
  try {
    await navigator.clipboard.writeText(url)
    copied.value = certificate?.key ?? null
  } catch {
    manualCopy.value = certificate?.key ?? null
  }
}
</script>
