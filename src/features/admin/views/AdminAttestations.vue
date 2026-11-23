<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Attestations et certifications</h1>
        <p class="app-page-copy">
          Les attestations sont délivrées automatiquement selon les critères du cours. Vous pouvez
          en révoquer une et enregistrer les certifications obtenues hors plateforme.
        </p>
      </div>
    </header>

    <p v-if="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
      {{ error }}
    </p>

    <!-- Attestations -->
    <section class="app-panel space-y-4" aria-labelledby="certificates-title">
      <div class="flex flex-wrap items-end justify-between gap-3">
        <h2 id="certificates-title" class="text-lg font-bold text-ink">Attestations délivrées</h2>
        <label class="text-sm font-semibold text-ink">
          Statut
          <select id="certificate-status" v-model="certificateStatus" class="app-input mt-1">
            <option value="">Tous</option>
            <option value="issued">Délivrées</option>
            <option value="revoked">Révoquées</option>
          </select>
        </label>
      </div>
      <div v-if="certificates.isPending.value" class="app-skeleton h-24" />
      <p
        v-else-if="!certificates.data.value?.items.length"
        class="rounded-xl bg-canvas p-5 text-sm text-quiet"
      >
        Aucune attestation.
      </p>
      <ul v-else class="divide-y divide-line">
        <li
          v-for="certificate in certificates.data.value.items"
          :key="certificate.key"
          class="space-y-2 py-3"
          data-test="certificate-row"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-ink">{{ certificate.holder?.name }}</p>
              <p class="text-xs text-quiet">
                {{ certificate.course?.title }} · délivrée le
                {{ formatDateTime(certificate.issued_at) }}
              </p>
              <p v-if="certificate.status === 'revoked'" class="mt-1 text-xs text-red-700">
                Révoquée le {{ formatDateTime(certificate.revoked_at) }}
                <template v-if="certificate.revoked_by">
                  par {{ certificate.revoked_by.name }}</template
                >
                <template v-if="certificate.revocation_reason">
                  · {{ certificate.revocation_reason }}</template
                >
              </p>
            </div>
            <button
              v-if="certificate.status === 'issued' && revokeTarget !== certificate.key"
              class="text-xs font-semibold text-red-700"
              data-test="revoke"
              @click="askRevoke(certificate.key)"
            >
              Révoquer
            </button>
          </div>
          <form
            v-if="revokeTarget === certificate.key"
            class="flex flex-wrap gap-2 rounded-lg bg-red-50 p-3"
            data-test="revoke-form"
            @submit.prevent="revoke(certificate.key)"
          >
            <input
              :id="`revoke-reason-${certificate.key}`"
              v-model.trim="revokeReason"
              class="app-input min-w-0 flex-1"
              required
              placeholder="Motif de la révocation (visible par l'apprenant)"
            />
            <button type="button" class="app-action-secondary" @click="revokeTarget = null">
              Annuler
            </button>
            <button class="app-action-primary" :disabled="revokeMutation.isPending.value">
              Révoquer
            </button>
          </form>
        </li>
      </ul>
    </section>

    <!-- Certifications externes -->
    <section class="app-panel space-y-4" aria-labelledby="external-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="external-title" class="text-lg font-bold text-ink">
            Certifications professionnelles
          </h2>
          <p class="text-xs text-quiet">Cisco, Oracle ou autres, obtenues par les apprenants.</p>
        </div>
        <button
          v-if="!externalForm"
          class="app-action-primary"
          data-test="new-external"
          @click="openExternal"
        >
          Enregistrer une certification
        </button>
      </div>

      <form
        v-if="externalForm"
        class="grid gap-3 rounded-xl border border-primary/30 p-4 md:grid-cols-2"
        data-test="external-form"
        @submit.prevent="saveExternal"
      >
        <div class="md:col-span-2">
          <label class="text-sm font-semibold text-ink" for="external-learner">Apprenant</label>
          <input
            id="external-learner"
            v-model.trim="learnerSearch"
            class="app-input mt-1"
            placeholder="Nom ou e-mail (2 caractères minimum)"
            autocomplete="off"
            @input="externalForm.user_key = ''"
          />
          <ul
            v-if="!externalForm.user_key && users.data.value?.length"
            class="mt-1 divide-y divide-line rounded-lg border border-line bg-white"
            role="listbox"
          >
            <li v-for="user in users.data.value" :key="user.key">
              <button
                type="button"
                class="w-full px-3 py-2 text-left text-sm hover:bg-canvas"
                role="option"
                :aria-selected="false"
                @click="pickUser(user)"
              >
                {{ user.name }} <span class="text-quiet">· {{ user.email }}</span>
              </button>
            </li>
          </ul>
          <p v-if="externalForm.user_key" class="mt-1 text-xs text-primary">
            Apprenant sélectionné.
          </p>
        </div>
        <label class="text-sm font-semibold text-ink">
          Organisme
          <select id="external-provider" v-model="externalForm.provider" class="app-input mt-1">
            <option value="cisco">Cisco</option>
            <option value="oracle">Oracle</option>
            <option value="other">Autre</option>
          </select>
        </label>
        <label v-if="externalForm.provider === 'other'" class="text-sm font-semibold text-ink">
          Nom de l'organisme
          <input
            id="external-provider-label"
            v-model.trim="externalForm.provider_label"
            class="app-input mt-1"
            required
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Certification
          <input
            id="external-name"
            v-model.trim="externalForm.name"
            class="app-input mt-1"
            required
            placeholder="Ex : CCNA"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Identifiant du certificat
          <input
            id="external-credential"
            v-model.trim="externalForm.credential_id"
            class="app-input mt-1"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Obtenue le
          <input
            id="external-issued"
            v-model="externalForm.issued_at"
            class="app-input mt-1"
            type="date"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Expire le
          <input
            id="external-expires"
            v-model="externalForm.expires_at"
            class="app-input mt-1"
            type="date"
          />
        </label>
        <div class="flex justify-end gap-2 md:col-span-2">
          <button type="button" class="app-action-secondary" @click="externalForm = null">
            Annuler
          </button>
          <button
            class="app-action-primary"
            :disabled="createExternal.isPending.value || !externalForm.user_key"
          >
            Enregistrer
          </button>
        </div>
      </form>

      <div v-if="external.isPending.value" class="app-skeleton h-16" />
      <p
        v-else-if="!external.data.value?.items.length"
        class="rounded-xl bg-canvas p-5 text-sm text-quiet"
      >
        Aucune certification enregistrée.
      </p>
      <ul v-else class="divide-y divide-line">
        <li
          v-for="item in external.data.value.items"
          :key="item.key"
          class="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
          data-test="external-row"
        >
          <span class="min-w-0">
            <span class="font-semibold text-ink">{{ item.holder?.name }}</span>
            <span class="text-quiet">
              · {{ item.name }} ({{ item.provider_label ?? providerLabels[item.provider] }})
              <template v-if="item.expires_at">
                · {{ item.is_expired ? 'expirée' : 'valable jusqu’au' }}
                {{ item.expires_at }}</template
              >
            </span>
          </span>
          <ConfirmButton
            label="Supprimer"
            confirm="Supprimer cette certification ?"
            button-class="text-xs font-semibold text-red-700"
            @confirm="removeExternal(item.key)"
          />
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import ConfirmButton from '../components/ConfirmButton.vue'
import {
  apiMessage,
  formatDateTime,
  useAdminCertificates,
  useAdminExternalCertifications,
  useCreateExternalCertification,
  useDeleteExternalCertification,
  useRevokeCertificate,
  useUserSearch,
  type ExternalCertificationPayload,
} from '../composables/useAdminOperations'

const providerLabels = { cisco: 'Cisco', oracle: 'Oracle', other: 'Autre' } as const

const error = ref('')
const certificateStatus = ref('')
const certificates = useAdminCertificates(computed(() => ({ status: certificateStatus.value })))
const revokeMutation = useRevokeCertificate()
const revokeTarget = ref<string | null>(null)
const revokeReason = ref('')

function askRevoke(key: string) {
  revokeTarget.value = key
  revokeReason.value = ''
}

async function revoke(key: string) {
  error.value = ''
  try {
    await revokeMutation.mutateAsync({ key, reason: revokeReason.value })
    toast.success('Attestation révoquée.')
    revokeTarget.value = null
  } catch (err) {
    error.value = apiMessage(err, "L'attestation n'a pas pu être révoquée.")
  }
}

const external = useAdminExternalCertifications()
const createExternal = useCreateExternalCertification()
const deleteExternal = useDeleteExternalCertification()
const externalForm = ref<ExternalCertificationPayload | null>(null)
const learnerSearch = ref('')
const users = useUserSearch(learnerSearch)

function openExternal() {
  learnerSearch.value = ''
  externalForm.value = {
    user_key: '',
    provider: 'cisco',
    provider_label: '',
    name: '',
    credential_id: '',
    issued_at: '',
    expires_at: '',
  }
}

function pickUser(user: { key: string; name: string; email: string }) {
  if (!externalForm.value) return
  externalForm.value.user_key = user.key
  learnerSearch.value = `${user.name} (${user.email})`
}

async function saveExternal() {
  const form = externalForm.value
  if (!form?.user_key) return
  error.value = ''
  try {
    await createExternal.mutateAsync({
      ...form,
      provider_label: form.provider === 'other' ? form.provider_label || null : null,
      credential_id: form.credential_id || null,
      issued_at: form.issued_at || null,
      expires_at: form.expires_at || null,
    })
    toast.success('Certification enregistrée.')
    externalForm.value = null
  } catch (err) {
    error.value = apiMessage(err, "La certification n'a pas pu être enregistrée.")
  }
}

async function removeExternal(key: string) {
  error.value = ''
  try {
    await deleteExternal.mutateAsync(key)
    toast.success('Certification supprimée.')
  } catch (err) {
    error.value = apiMessage(err, 'Suppression impossible.')
  }
}
</script>
