<template>
  <section class="space-y-4" aria-labelledby="assessments-title">
    <h2 id="assessments-title" class="text-xl font-bold text-ink">Évaluations et attestation</h2>

    <div class="app-panel space-y-4">
      <div v-if="assessments.isPending.value" class="space-y-3">
        <div v-for="n in 2" :key="n" class="app-skeleton h-16" />
      </div>
      <p v-else-if="assessments.isError.value" class="text-sm text-danger-ink" role="alert">
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
              {{ assessment.questions_count ?? '-' }} question(s) ·
              {{ assessment.settings.duration_minutes }} min ·
              {{ attemptsLabel(assessment.settings.max_attempts) }}
            </p>
            <p class="mt-0.5 text-xs text-quiet" data-test="assessment-attempts-stats">
              {{ attemptsStats(assessment) }}
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
          <div class="flex items-center gap-2">
            <RouterLink
              v-if="assessment.last_attempt"
              :to="`/formations/${props.courseKey}/evaluations/${assessment.last_attempt.key}`"
              class="app-action-secondary"
              data-test="review-attempt"
            >
              Revoir ma copie
            </RouterLink>
            <span
              v-if="isAttemptsExhausted(assessment)"
              class="rounded-full bg-canvas px-3 py-1.5 text-xs font-semibold text-quiet"
              data-test="attempts-exhausted"
            >
              Tentatives épuisées
            </span>
            <button
              v-else
              class="app-action-primary"
              :disabled="start.isPending.value"
              :aria-busy="start.isPending.value"
              data-test="start-assessment"
              @click="startAssessment(assessment.key)"
            >
              {{ assessment.last_attempt?.status === 'in_progress' ? 'Reprendre' : 'Commencer' }}
            </button>
          </div>
          <p
            v-if="startError?.key === assessment.key"
            class="w-full rounded-xl bg-danger-soft p-3 text-sm text-danger-ink"
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
          :aria-busy="requestCertificate.isPending.value"
          @click="askCertificate"
        >
          Demander mon attestation
        </button>
        <p
          v-if="certificateError"
          class="w-full rounded-xl bg-warning-soft p-3 text-sm text-warning-ink"
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
import {
  useCourseAssessments,
  useStartAttempt,
  type LearnerAssessment,
} from '../composables/useAssessments'
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

function isAttemptsExhausted(assessment: LearnerAssessment): boolean {
  const remaining = assessment.attempts_remaining ?? 1
  return remaining <= 0 && assessment.last_attempt?.status !== 'in_progress'
}

function attemptsStats(assessment: LearnerAssessment): string {
  const remaining = assessment.attempts_remaining ?? assessment.settings.max_attempts
  const remainingText =
    remaining <= 0
      ? '0 tentative restante'
      : remaining === 1
        ? '1 tentative restante'
        : `${remaining} tentatives restantes`

  if (assessment.best_score !== null && assessment.best_score !== undefined) {
    const maxScore = assessment.max_score ?? assessment.questions_count
    const scoreText = maxScore ? `${assessment.best_score}/${maxScore}` : `${assessment.best_score}`
    return `Meilleur score ${scoreText} · ${remainingText}`
  }

  return remainingText
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
