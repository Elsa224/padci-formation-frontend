<template>
  <section class="app-page max-w-3xl">
    <RouterLink :to="`/formations/${courseKey}`" class="text-sm font-semibold text-primary">
      &larr; Retour au cours
    </RouterLink>

    <div v-if="attempt.isPending.value" class="space-y-3">
      <div v-for="n in 3" :key="n" class="app-skeleton h-24" />
    </div>
    <div
      v-else-if="attempt.isError.value"
      class="rounded-xl bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      {{ message(attempt.error.value, "Impossible de charger l'évaluation.") }}
    </div>

    <template v-else-if="data">
      <header
        class="app-panel sticky top-[env(safe-area-inset-top,0px)] z-10 flex flex-wrap items-center justify-between gap-3"
      >
        <div class="min-w-0">
          <p class="text-xs font-bold uppercase tracking-wider text-primary">Évaluation</p>
          <h1 class="truncate text-lg font-bold text-ink">{{ data.assessment?.title }}</h1>
          <p class="text-xs text-quiet">
            {{ answeredCount }} / {{ data.questions.length }} réponse(s)
            <span v-if="saving" data-test="saving"> · enregistrement…</span>
          </p>
        </div>
        <div v-if="inProgress" class="flex items-center gap-3">
          <span
            v-if="remaining !== null"
            class="rounded-lg px-3 py-1.5 font-mono text-sm font-bold tabular-nums"
            :class="remaining <= 60 ? 'bg-red-50 text-red-700' : 'bg-canvas text-ink'"
            role="timer"
            :aria-label="`Temps restant ${formatCountdown(remaining)}`"
            data-test="countdown"
          >
            {{ formatCountdown(remaining) }}
          </span>
          <button
            class="app-action-primary"
            :disabled="submit.isPending.value"
            data-test="finish"
            @click="confirming = true"
          >
            Terminer
          </button>
        </div>
        <span
          v-else
          class="rounded-full bg-canvas px-3 py-1 text-xs font-semibold text-quiet"
          data-test="attempt-status"
        >
          {{ attemptStatusLabels[data.status] }}
        </span>
      </header>

      <!-- Confirmation intégrée (pas de confirm() navigateur) -->
      <div
        v-if="confirming && inProgress"
        class="app-panel space-y-3 border-amber-300"
        role="alertdialog"
        aria-labelledby="confirm-title"
      >
        <p id="confirm-title" class="font-bold text-ink">Terminer l'évaluation ?</p>
        <p class="text-sm text-quiet">
          {{
            unanswered > 0
              ? `${unanswered} question(s) sans réponse. Une fois terminée, vous ne pourrez plus modifier vos réponses.`
              : 'Une fois terminée, vous ne pourrez plus modifier vos réponses.'
          }}
        </p>
        <div class="flex justify-end gap-2">
          <button class="app-action-secondary" @click="confirming = false">Continuer</button>
          <button
            class="app-action-primary"
            :disabled="submit.isPending.value"
            data-test="confirm-finish"
            @click="finish"
          >
            {{ submit.isPending.value ? 'Envoi…' : 'Terminer maintenant' }}
          </button>
        </div>
      </div>

      <p v-if="actionError" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
        {{ actionError }}
      </p>

      <!-- Résultat -->
      <div v-if="!inProgress" class="app-panel space-y-2" data-test="result-summary">
        <template v-if="data.status === 'submitted'">
          <p class="text-sm text-quiet">Votre score</p>
          <p class="text-3xl font-bold tabular-nums text-ink" data-test="score">
            {{ data.score ?? 0 }} / {{ data.max_score }}
          </p>
        </template>
        <p v-else-if="data.status === 'pending_grading'" class="text-sm text-ink">
          Vos réponses sont enregistrées. Certaines questions sont corrigées par votre formateur :
          le score s'affichera ici après correction.
        </p>
        <p v-else-if="data.status === 'expired'" class="text-sm text-ink">
          Le temps imparti est écoulé avant l'envoi : cette tentative n'a pas été notée.
        </p>
      </div>

      <!-- Questions -->
      <ol class="space-y-4">
        <li
          v-for="(question, index) in data.questions"
          :key="question.key"
          class="app-panel space-y-3"
          data-test="question"
        >
          <div class="flex items-start justify-between gap-3">
            <p class="font-semibold text-ink">
              <span class="text-quiet">{{ index + 1 }}.</span> {{ question.prompt }}
            </p>
            <span class="shrink-0 text-xs text-quiet">{{ question.points }} pt(s)</span>
          </div>

          <textarea
            v-if="question.type === 'free_text'"
            :id="`answer-${question.key}`"
            v-model="drafts[question.key]"
            class="app-input min-h-28"
            :disabled="!inProgress"
            :aria-label="`Réponse à la question ${index + 1}`"
            @input="queueText(question.key)"
            @blur="flushText(question.key)"
          />
          <fieldset v-else class="space-y-2" :disabled="!inProgress">
            <legend class="sr-only">Réponses possibles</legend>
            <label
              v-for="option in question.options"
              :key="option.key"
              class="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm"
              :class="optionClass(question, option.key)"
            >
              <input
                :id="`option-${option.key}`"
                :type="question.type === 'multiple_choice' ? 'checkbox' : 'radio'"
                :name="`question-${question.key}`"
                :value="option.key"
                :checked="isSelected(question.key, option.key)"
                class="mt-0.5"
                @change="toggleOption(question, option.key)"
              />
              <span>{{ option.body }}</span>
            </label>
          </fieldset>

          <div
            v-if="question.result"
            class="rounded-xl bg-canvas p-3 text-sm"
            data-test="question-result"
          >
            <p class="font-semibold text-ink">
              {{ question.result.awarded_points }} / {{ question.points }} pt(s)
              <template v-if="question.result.is_correct === true"> · Bonne réponse</template>
              <template v-else-if="question.result.is_correct === false">
                · Réponse incorrecte</template
              >
            </p>
            <p v-if="question.result.explanation" class="mt-1 text-quiet">
              {{ question.result.explanation }}
            </p>
            <p v-if="question.result.grading_note" class="mt-1 text-quiet">
              Commentaire du formateur : {{ question.result.grading_note }}
            </p>
          </div>
        </li>
      </ol>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError } from '@/api/http'
import {
  attemptStatusLabels,
  formatCountdown,
  secondsLeft,
  useAttempt,
  useSaveAnswer,
  useSubmitAttempt,
  type Attempt,
  type AttemptQuestion,
} from '../composables/useAssessments'

/** Submit this many seconds before the deadline: the server refuses (and
 * does not grade) an attempt submitted after `expires_at`. */
const AUTO_SUBMIT_MARGIN_SECONDS = 5
const TEXT_SAVE_DELAY_MS = 800

const route = useRoute()
const courseKey = computed(() => String(route.params.courseKey ?? ''))
const attemptKey = computed(() => String(route.params.attemptKey ?? ''))

const attempt = useAttempt(attemptKey)
const save = useSaveAnswer(attemptKey)
const submit = useSubmitAttempt(attemptKey)

const data = computed<Attempt | undefined>(() => attempt.data.value)
const inProgress = computed(() => data.value?.status === 'in_progress')

// Local answer state, seeded from the server once per attempt.
const selections = reactive<Record<string, string[]>>({})
const drafts = reactive<Record<string, string>>({})
watch(
  () => data.value?.key,
  () => {
    for (const question of data.value?.questions ?? []) {
      selections[question.key] = [...question.selected_option_keys]
      drafts[question.key] = question.free_text_response ?? ''
    }
  },
  { immediate: true },
)

const answeredCount = computed(
  () =>
    (data.value?.questions ?? []).filter((question) =>
      question.type === 'free_text'
        ? (drafts[question.key] ?? '').trim() !== ''
        : (selections[question.key] ?? []).length > 0,
    ).length,
)
const unanswered = computed(() => (data.value?.questions.length ?? 0) - answeredCount.value)

const pendingSaves = ref(0)
const saving = computed(() => pendingSaves.value > 0)
const actionError = ref('')
const confirming = ref(false)

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.displayMessage : fallback
}

async function persist(
  questionKey: string,
  payload: { option_keys?: string[]; free_text_response?: string | null },
) {
  if (!inProgress.value) return
  pendingSaves.value++
  actionError.value = ''
  try {
    await save.mutateAsync({ questionKey, ...payload })
  } catch (error) {
    actionError.value = message(error, "Votre réponse n'a pas pu être enregistrée. Réessayez.")
    // The server may have expired the attempt: reload its real state.
    void attempt.refetch()
  } finally {
    pendingSaves.value--
  }
}

function isSelected(questionKey: string, optionKey: string) {
  return (selections[questionKey] ?? []).includes(optionKey)
}

function toggleOption(question: AttemptQuestion, optionKey: string) {
  const current = selections[question.key] ?? []
  const next =
    question.type === 'multiple_choice'
      ? current.includes(optionKey)
        ? current.filter((key) => key !== optionKey)
        : [...current, optionKey]
      : [optionKey]
  selections[question.key] = next
  void persist(question.key, { option_keys: next })
}

const textTimers = new Map<string, ReturnType<typeof setTimeout>>()
function queueText(questionKey: string) {
  clearTimeout(textTimers.get(questionKey))
  textTimers.set(
    questionKey,
    setTimeout(() => flushText(questionKey), TEXT_SAVE_DELAY_MS),
  )
}
function flushText(questionKey: string) {
  const timer = textTimers.get(questionKey)
  if (timer === undefined) return
  clearTimeout(timer)
  textTimers.delete(questionKey)
  void persist(questionKey, { free_text_response: drafts[questionKey] || null })
}
async function flushAllText() {
  const keys = [...textTimers.keys()]
  keys.forEach(flushText)
  // Let in-flight saves land before submitting.
  while (pendingSaves.value > 0) await new Promise((resolve) => setTimeout(resolve, 50))
}

async function finish() {
  actionError.value = ''
  await flushAllText()
  try {
    await submit.mutateAsync()
    confirming.value = false
  } catch (error) {
    actionError.value = message(error, "L'évaluation n'a pas pu être envoyée.")
    void attempt.refetch()
  }
}

// Countdown driven by the server's expires_at.
const now = ref(Date.now())
const tick = setInterval(() => {
  now.value = Date.now()
}, 1000)
onBeforeUnmount(() => {
  clearInterval(tick)
  textTimers.forEach(clearTimeout)
})
const remaining = computed(() => secondsLeft(data.value?.expires_at ?? null, now.value))

let autoSubmitted = false
watch(remaining, (seconds) => {
  if (seconds === null || !inProgress.value || autoSubmitted) return
  if (seconds <= AUTO_SUBMIT_MARGIN_SECONDS) {
    autoSubmitted = true
    void finish()
  }
})

function optionClass(question: AttemptQuestion, optionKey: string) {
  const result = question.result
  if (!result) return isSelected(question.key, optionKey) ? 'border-primary bg-primary/5' : ''
  if (result.correct_option_keys.includes(optionKey)) return 'border-primary bg-primary/10'
  if (isSelected(question.key, optionKey)) return 'border-red-300 bg-red-50'
  return 'opacity-70'
}
</script>
