<template>
  <section class="space-y-4" aria-labelledby="assessments-title">
    <h2 id="assessments-title" class="text-xl font-bold text-ink">Évaluations et attestation</h2>

    <div class="app-panel space-y-4">
      <div v-if="assessments.isPending.value" class="space-y-3">
        <div v-for="n in 2" :key="n" class="app-skeleton h-16" />
      </div>
      <p v-else-if="assessments.isError.value" class="text-sm text-red-700" role="alert">
        {{ apiMessage(assessments.error.value, 'Impossible de charger les évaluations.') }}
      </p>
      <p
        v-else-if="!assessments.data.value?.length"
        class="rounded-xl bg-canvas p-5 text-sm text-quiet"
      >
        Aucune évaluation publiée pour ce cours pour le moment.
      </p>
      <ul v-else class="divide-y divide-line">
        <li
          v-for="assessment in assessments.data.value"
          :key="assessment.key"
          class="flex flex-wrap items-center justify-between gap-3 py-3"
          data-test="assessment-row"
        >
          <div class="min-w-0">
            <p class="font-semibold text-ink">{{ assessment.title }}</p>
            <p class="text-xs text-quiet">
              {{ assessment.questions_count ?? '—' }} question(s) ·
              {{ assessment.settings.duration_minutes }} min ·
              {{ attemptsLabel(assessment.settings.max_attempts) }}
            </p>
            <p
              v-if="assessment.scheduled_at"
              class="mt-1 text-xs font-semibold text-primary"
              data-test="exam-schedule"
            >
              Examen le {{ formatDateTime(assessment.scheduled_at) }}
              <template v-if="assessment.delivery_mode">
                · {{ assessment.delivery_mode === 'offline' ? 'en salle' : 'en ligne' }}</template
              >
              <template v-if="assessment.location"> · {{ assessment.location }}</template>
            </p>
          </div>
          <button
            class="app-action-primary"
            :disabled="start.isPending.value"
            data-test="start-assessment"
            @click="startAssessment(assessment.key)"
          >
            Commencer ou reprendre
          </button>
          <p
            v-if="startError?.key === assessment.key"
            class="w-full rounded-xl bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            {{ startError.message }}
          </p>
        </li>
      </ul>

      <!-- Attestation -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4"
        data-test="certificate-block"
      >
        <div class="min-w-0">
          <p class="font-semibold text-ink">Attestation de réussite</p>
          <p class="text-xs text-quiet">
            Délivrée lorsque la progression et le score minimum du cours sont atteints.
          </p>
        </div>
        <RouterLink
          v-if="existingCertificate"
          to="/formations/attestations"
          class="app-action-secondary"
        >
          Voir mon attestation
        </RouterLink>
        <button
          v-else
          class="app-action-secondary"
          :disabled="requestCertificate.isPending.value"
          @click="askCertificate"
        >
          Demander mon attestation
        </button>
        <p
          v-if="certificateError"
          class="w-full rounded-xl bg-amber-50 p-3 text-sm text-amber-900"
          role="alert"
        >
          {{ certificateError }}
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { ApiError } from '@/api/http'
import { useCourseAssessments, useStartAttempt } from '../composables/useAssessments'
import { useMyCertificates, useRequestCertificate } from '../composables/useCertificates'

const props = defineProps<{ courseKey: string }>()

const router = useRouter()
const assessments = useCourseAssessments(computed(() => props.courseKey))
const start = useStartAttempt()
const certificates = useMyCertificates()
const requestCertificate = useRequestCertificate()

const startError = ref<{ key: string; message: string } | null>(null)
const certificateError = ref('')

const existingCertificate = computed(() =>
  (certificates.data.value ?? []).find(
    (certificate) =>
      certificate.course?.key === props.courseKey && certificate.status !== 'revoked',
  ),
)

function apiMessage(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.displayMessage : fallback
}

function attemptsLabel(max: number) {
  return max === 1 ? '1 tentative' : `${max} tentatives`
}

const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
function formatDateTime(value: string) {
  return dateTime.format(new Date(value))
}

async function startAssessment(assessmentKey: string) {
  startError.value = null
  try {
    const attempt = await start.mutateAsync(assessmentKey)
    await router.push(`/formations/${props.courseKey}/evaluations/${attempt.key}`)
  } catch (error) {
    startError.value = {
      key: assessmentKey,
      message: apiMessage(error, "Impossible de démarrer l'évaluation."),
    }
  }
}

async function askCertificate() {
  certificateError.value = ''
  try {
    await requestCertificate.mutateAsync(props.courseKey)
    toast.success('Attestation délivrée.')
    await router.push('/formations/attestations')
  } catch (error) {
    certificateError.value = apiMessage(
      error,
      "L'attestation n'a pas pu être délivrée pour le moment.",
    )
  }
}
</script>
