<template>
  <section class="app-page max-w-4xl">
    <header class="app-page-header">
      <div>
        <p class="app-eyebrow">Évaluations</p>
        <h1 class="app-page-title mt-2">Copies à corriger</h1>
        <p class="app-page-copy">
          Réponses libres de vos apprenants. Le score final s'affiche chez l'apprenant dès que
          toutes ses réponses sont corrigées.
        </p>
      </div>
    </header>

    <div v-if="pending.isPending.value" class="space-y-3">
      <div v-for="n in 2" :key="n" class="app-skeleton h-40" />
    </div>
    <div
      v-else-if="pending.isError.value"
      class="rounded-xl bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      {{ apiErrorMessage(pending.error.value, 'Impossible de charger les copies.') }}
    </div>
    <p
      v-else-if="!pending.data.value?.items.length"
      class="app-panel text-center text-sm text-quiet"
      data-test="no-pending"
    >
      Aucune copie en attente. Les nouvelles réponses libres apparaîtront ici.
    </p>

    <article
      v-for="attempt in pending.data.value?.items ?? []"
      :key="attempt.key"
      class="app-panel space-y-4"
      data-test="pending-attempt"
    >
      <div class="flex flex-wrap items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-bold text-ink">{{ attempt.learner?.name ?? 'Apprenant' }}</p>
          <p class="text-xs text-quiet">
            {{ attempt.assessment?.title }} · {{ attempt.course?.title }}
            <template v-if="attempt.submitted_at">
              · envoyée le {{ formatDate(attempt.submitted_at) }}</template
            >
          </p>
        </div>
        <span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
          {{ attempt.pending_answers.length }} à corriger
        </span>
      </div>

      <form
        v-for="answer in attempt.pending_answers"
        :key="answer.answer_key"
        class="space-y-3 rounded-xl border border-line p-4"
        data-test="pending-answer"
        @submit.prevent="grade(attempt.key, answer.answer_key, answer.question_points)"
      >
        <p class="text-sm font-semibold text-ink">{{ answer.question_prompt }}</p>
        <blockquote
          class="whitespace-pre-wrap rounded-lg bg-canvas p-3 text-sm text-ink"
          data-test="learner-response"
        >
          {{ answer.response || 'Aucune réponse saisie.' }}
        </blockquote>
        <div class="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
          <label class="text-xs font-semibold text-ink">
            Points (sur {{ answer.question_points }})
            <input
              :id="`points-${answer.answer_key}`"
              v-model.number="forms[answer.answer_key]!.points"
              class="app-input mt-1"
              type="number"
              min="0"
              :max="answer.question_points"
              required
            />
          </label>
          <label class="text-xs font-semibold text-ink">
            Commentaire (visible par l'apprenant)
            <input
              :id="`note-${answer.answer_key}`"
              v-model.trim="forms[answer.answer_key]!.note"
              class="app-input mt-1"
              maxlength="2000"
            />
          </label>
          <button class="app-action-primary" :disabled="gradeMutation.isPending.value">
            Valider
          </button>
        </div>
        <p
          v-if="errors[answer.answer_key]"
          class="rounded-lg bg-red-50 p-2 text-sm text-red-800"
          role="alert"
        >
          {{ errors[answer.answer_key] }}
        </p>
      </form>
    </article>
  </section>
</template>

<script setup lang="ts">
import { reactive, watchEffect } from 'vue'
import { toast } from 'vue-sonner'
import { apiErrorMessage } from '../composables/useTrainerCourses'
import { useGradeAnswer, usePendingAttempts } from '../composables/useTrainerAssessments'

const pending = usePendingAttempts()
const gradeMutation = useGradeAnswer()

const forms = reactive<Record<string, { points: number; note: string }>>({})
const errors = reactive<Record<string, string>>({})

// One form per pending answer, created as answers appear.
watchEffect(() => {
  for (const attempt of pending.data.value?.items ?? []) {
    for (const answer of attempt.pending_answers) {
      forms[answer.answer_key] ??= { points: 0, note: '' }
    }
  }
})

async function grade(attemptKey: string, answerKey: string, max: number) {
  const form = forms[answerKey]
  if (!form) return
  errors[answerKey] = ''
  if (!Number.isInteger(form.points) || form.points < 0 || form.points > max) {
    errors[answerKey] = `Indiquez un nombre entier de points entre 0 et ${max}.`
    return
  }
  try {
    await gradeMutation.mutateAsync({
      attemptKey,
      answerKey,
      awarded_points: form.points,
      note: form.note || null,
    })
    toast.success('Correction enregistrée.')
  } catch (error) {
    errors[answerKey] = apiErrorMessage(error, "La correction n'a pas pu être enregistrée.")
  }
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })
function formatDate(value: string) {
  return dateFormatter.format(new Date(value))
}
</script>
