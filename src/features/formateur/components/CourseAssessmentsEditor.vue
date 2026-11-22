<template>
  <section class="app-panel space-y-5" aria-labelledby="course-assessments-title">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="course-assessments-title" class="text-lg font-bold text-ink">Évaluations</h2>
        <p class="text-xs text-quiet">
          {{
            editable
              ? 'Créez vos quiz avant de soumettre le cours : un cours publié ne peut plus en recevoir.'
              : 'Le cours n’est plus modifiable : vous pouvez encore programmer les examens.'
          }}
        </p>
      </div>
      <button
        v-if="editable && !builderOpen"
        class="app-action-primary"
        data-test="open-builder"
        @click="openBuilder"
      >
        Nouveau quiz
      </button>
    </div>

    <p v-if="actionError" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
      {{ actionError }}
    </p>

    <!-- Liste -->
    <div v-if="assessments.isPending.value" class="app-skeleton h-16" />
    <p
      v-else-if="!assessments.data.value?.length && !builderOpen"
      class="rounded-xl bg-canvas p-5 text-sm text-quiet"
    >
      Aucune évaluation pour ce cours.
    </p>
    <ul v-else class="space-y-3">
      <li
        v-for="assessment in assessments.data.value ?? []"
        :key="assessment.key"
        class="space-y-3 rounded-xl border border-line p-4"
        data-test="assessment-item"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold text-ink">{{ assessment.title }}</p>
            <p class="text-xs text-quiet">
              {{ assessment.questions_count ?? '—' }} question(s) ·
              {{ assessment.settings?.duration_minutes ?? 30 }} min ·
              {{ assessment.settings?.max_attempts ?? 1 }} tentative(s)
            </p>
            <p v-if="assessment.scheduled_at" class="mt-1 text-xs text-ink">
              Examen le {{ formatDateTime(assessment.scheduled_at) }} ·
              {{ assessment.delivery_mode === 'offline' ? 'en salle' : 'en ligne' }}
              <template v-if="assessment.location"> · {{ assessment.location }}</template>
              <span
                class="ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                :class="
                  assessment.schedule_published_at
                    ? 'bg-primary/10 text-primary'
                    : 'bg-amber-50 text-amber-800'
                "
              >
                {{ assessment.schedule_published_at ? 'annoncé' : 'non annoncé' }}
              </span>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
              :class="
                assessment.status === 'published'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-canvas text-quiet'
              "
            >
              {{ assessment.status === 'published' ? 'Publié' : 'Brouillon' }}
            </span>
            <template v-if="editable && assessment.status === 'draft'">
              <button
                class="app-action-secondary"
                data-test="publish-assessment"
                @click="run(() => publish.mutateAsync(assessment.key), 'Quiz publié.')"
              >
                Publier
              </button>
              <button class="text-xs font-semibold text-red-700" @click="askDelete(assessment.key)">
                Supprimer
              </button>
            </template>
            <button
              class="text-xs font-semibold text-primary"
              data-test="open-schedule"
              @click="openSchedule(assessment)"
            >
              Programmer un examen
            </button>
          </div>
        </div>

        <div
          v-if="deleteTarget === assessment.key"
          class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 p-3 text-sm"
        >
          <span class="text-red-800">Supprimer ce brouillon et ses questions ?</span>
          <span class="flex gap-2">
            <button class="app-action-secondary" @click="deleteTarget = null">Annuler</button>
            <button
              class="app-action-primary"
              @click="
                run(() => remove.mutateAsync(assessment.key), 'Quiz supprimé.').then(() => {
                  deleteTarget = null
                })
              "
            >
              Supprimer
            </button>
          </span>
        </div>

        <!-- Programmation d'examen -->
        <form
          v-if="scheduleTarget === assessment.key"
          class="grid gap-2 rounded-lg bg-canvas p-3 sm:grid-cols-2"
          data-test="schedule-form"
          @submit.prevent="saveSchedule(assessment.key, false)"
        >
          <label class="text-xs font-semibold text-ink">
            Date et heure
            <input
              :id="`schedule-at-${assessment.key}`"
              v-model="schedule.at"
              class="app-input mt-1"
              type="datetime-local"
              required
            />
          </label>
          <label class="text-xs font-semibold text-ink">
            Modalité
            <select
              :id="`schedule-mode-${assessment.key}`"
              v-model="schedule.mode"
              class="app-input mt-1"
            >
              <option value="online">En ligne</option>
              <option value="offline">En salle</option>
            </select>
          </label>
          <label
            v-if="schedule.mode === 'offline'"
            class="text-xs font-semibold text-ink sm:col-span-2"
          >
            Lieu
            <input
              :id="`schedule-location-${assessment.key}`"
              v-model.trim="schedule.location"
              class="app-input mt-1"
              required
              maxlength="255"
              placeholder="Ex : Salle B12, Abidjan"
            />
          </label>
          <div class="flex flex-wrap justify-end gap-2 sm:col-span-2">
            <button type="button" class="app-action-secondary" @click="scheduleTarget = null">
              Annuler
            </button>
            <button class="app-action-secondary" :disabled="scheduleMutation.isPending.value">
              Enregistrer
            </button>
            <button
              type="button"
              class="app-action-primary"
              :disabled="scheduleMutation.isPending.value"
              data-test="announce-schedule"
              @click="saveSchedule(assessment.key, true)"
            >
              Enregistrer et annoncer
            </button>
          </div>
          <p class="text-xs text-quiet sm:col-span-2">
            Annoncer prévient par notification les apprenants inscrits.
          </p>
        </form>
      </li>
    </ul>

    <!-- Constructeur de quiz -->
    <form
      v-if="builderOpen"
      class="space-y-4 rounded-xl border border-primary/30 p-4"
      data-test="assessment-builder"
      @submit.prevent="createQuiz"
    >
      <div class="grid gap-3 sm:grid-cols-[1fr_8rem_8rem]">
        <label class="text-sm font-semibold text-ink">
          Titre
          <input
            id="quiz-title"
            v-model="draft.title"
            class="app-input mt-1"
            required
            maxlength="180"
            placeholder="Ex : Quiz — Journée 1"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Durée (min)
          <input
            id="quiz-duration"
            v-model.number="draft.duration"
            class="app-input mt-1"
            type="number"
            min="1"
            max="480"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Tentatives
          <input
            id="quiz-attempts"
            v-model.number="draft.attempts"
            class="app-input mt-1"
            type="number"
            min="1"
            max="10"
          />
        </label>
      </div>

      <ol class="space-y-3">
        <li
          v-for="(question, qIndex) in draft.questions"
          :key="qIndex"
          class="space-y-2 rounded-lg bg-canvas p-3"
          data-test="draft-question"
        >
          <div class="grid gap-2 sm:grid-cols-[1fr_12rem_6rem_auto] sm:items-end">
            <label class="text-xs font-semibold text-ink">
              Question {{ qIndex + 1 }}
              <input
                :id="`q-${qIndex}-prompt`"
                v-model="question.prompt"
                class="app-input mt-1"
                placeholder="Énoncé"
              />
            </label>
            <label class="text-xs font-semibold text-ink">
              Type
              <select
                :id="`q-${qIndex}-type`"
                :value="question.type"
                class="app-input mt-1"
                @change="
                  changeType(qIndex, ($event.target as HTMLSelectElement).value as QuestionType)
                "
              >
                <option v-for="(label, value) in questionTypeLabels" :key="value" :value="value">
                  {{ label }}
                </option>
              </select>
            </label>
            <label class="text-xs font-semibold text-ink">
              Points
              <input
                :id="`q-${qIndex}-points`"
                v-model.number="question.points"
                class="app-input mt-1"
                type="number"
                min="1"
                max="100"
              />
            </label>
            <button
              type="button"
              class="text-xs font-semibold text-red-700"
              :disabled="draft.questions.length === 1"
              @click="draft.questions.splice(qIndex, 1)"
            >
              Retirer
            </button>
          </div>

          <div v-if="question.type !== 'free_text'" class="space-y-1">
            <p class="text-xs text-quiet">
              {{
                question.type === 'multiple_choice'
                  ? 'Cochez toutes les bonnes réponses.'
                  : 'Cochez la bonne réponse.'
              }}
            </p>
            <div
              v-for="(option, oIndex) in question.options"
              :key="oIndex"
              class="flex items-center gap-2"
            >
              <input
                :id="`q-${qIndex}-o-${oIndex}-correct`"
                :type="question.type === 'multiple_choice' ? 'checkbox' : 'radio'"
                :name="`q-${qIndex}-correct`"
                :checked="option.is_correct"
                :aria-label="`Réponse ${oIndex + 1} correcte`"
                @change="markCorrect(qIndex, oIndex)"
              />
              <input
                :id="`q-${qIndex}-o-${oIndex}`"
                v-model="option.body"
                class="app-input flex-1"
                :readonly="question.type === 'true_false'"
                :placeholder="`Réponse ${oIndex + 1}`"
              />
              <button
                v-if="question.type !== 'true_false' && question.options.length > 2"
                type="button"
                class="text-xs text-quiet"
                :aria-label="`Retirer la réponse ${oIndex + 1}`"
                @click="question.options.splice(oIndex, 1)"
              >
                Retirer
              </button>
            </div>
            <button
              v-if="question.type !== 'true_false' && question.options.length < 20"
              type="button"
              class="text-xs font-semibold text-primary"
              @click="question.options.push({ body: '', is_correct: false })"
            >
              + Ajouter une réponse
            </button>
          </div>
          <label class="block text-xs font-semibold text-ink">
            Explication (montrée après correction, facultatif)
            <input
              :id="`q-${qIndex}-explanation`"
              v-model="question.explanation"
              class="app-input mt-1"
            />
          </label>
        </li>
      </ol>

      <button
        type="button"
        class="text-sm font-semibold text-primary"
        @click="draft.questions.push(emptyQuestion())"
      >
        + Ajouter une question
      </button>

      <ul
        v-if="draftErrors.length"
        class="list-disc space-y-1 rounded-lg bg-red-50 p-3 pl-7 text-sm text-red-800"
        role="alert"
        data-test="draft-errors"
      >
        <li v-for="message in draftErrors" :key="message">{{ message }}</li>
      </ul>

      <div class="flex justify-end gap-2">
        <button type="button" class="app-action-secondary" @click="builderOpen = false">
          Annuler
        </button>
        <button class="app-action-primary" :disabled="create.isPending.value">
          {{ create.isPending.value ? 'Création…' : 'Créer le quiz (brouillon)' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { toast } from 'vue-sonner'
import { apiErrorMessage } from '../composables/useTrainerCourses'
import {
  emptyQuestion,
  questionTypeLabels,
  toPayload,
  useCourseAssessmentsAdmin,
  useCreateAssessment,
  useDeleteAssessment,
  usePublishAssessment,
  usePublishSchedule,
  useScheduleExam,
  validateQuestions,
  type DraftQuestion,
  type QuestionType,
  type TrainerAssessment,
} from '../composables/useTrainerAssessments'

const props = defineProps<{ courseKey: string; editable: boolean }>()
const key = computed(() => props.courseKey)

const assessments = useCourseAssessmentsAdmin(key)
const create = useCreateAssessment(key)
const publish = usePublishAssessment(key)
const remove = useDeleteAssessment(key)
const scheduleMutation = useScheduleExam(key)
const publishSchedule = usePublishSchedule(key)

const actionError = ref('')
const deleteTarget = ref<string | null>(null)

async function run(action: () => Promise<unknown>, success: string): Promise<boolean> {
  actionError.value = ''
  try {
    await action()
    toast.success(success)
    return true
  } catch (error) {
    actionError.value = apiErrorMessage(error)
    return false
  }
}

function askDelete(assessmentKey: string) {
  deleteTarget.value = assessmentKey
}

// ── Builder ────────────────────────────────────────────────────────────
const builderOpen = ref(false)
const draftErrors = ref<string[]>([])
const draft = reactive<{
  title: string
  duration: number
  attempts: number
  questions: DraftQuestion[]
}>({ title: '', duration: 30, attempts: 1, questions: [emptyQuestion()] })

function openBuilder() {
  Object.assign(draft, { title: '', duration: 30, attempts: 1, questions: [emptyQuestion()] })
  draftErrors.value = []
  builderOpen.value = true
}

function changeType(index: number, type: QuestionType) {
  const current = draft.questions[index]
  if (!current) return
  draft.questions[index] = {
    ...emptyQuestion(type),
    prompt: current.prompt,
    points: current.points,
  }
}

function markCorrect(qIndex: number, oIndex: number) {
  const question = draft.questions[qIndex]
  if (!question) return
  question.options.forEach((option, index) => {
    if (question.type === 'multiple_choice') {
      if (index === oIndex) option.is_correct = !option.is_correct
    } else {
      option.is_correct = index === oIndex
    }
  })
}

async function createQuiz() {
  draftErrors.value = validateQuestions(draft.questions)
  if (!draft.title.trim()) draftErrors.value.unshift('Donnez un titre au quiz.')
  if (draftErrors.value.length) return
  const ok = await run(
    () =>
      create.mutateAsync(toPayload(draft.title, draft.duration, draft.attempts, draft.questions)),
    'Quiz créé en brouillon. Publiez-le pour le rendre visible.',
  )
  if (ok) builderOpen.value = false
}

// ── Exam scheduling ───────────────────────────────────────────────────
const scheduleTarget = ref<string | null>(null)
const schedule = reactive<{ at: string; mode: 'online' | 'offline'; location: string }>({
  at: '',
  mode: 'online',
  location: '',
})

/** ISO string → value for <input type="datetime-local"> (local time). */
function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function openSchedule(assessment: TrainerAssessment) {
  Object.assign(schedule, {
    at: toLocalInput(assessment.scheduled_at),
    mode: assessment.delivery_mode ?? 'online',
    location: assessment.location ?? '',
  })
  scheduleTarget.value = assessment.key
}

async function saveSchedule(assessmentKey: string, announce: boolean) {
  if (!schedule.at) {
    actionError.value = "Indiquez la date et l'heure de l'examen."
    return
  }
  const ok = await run(
    async () => {
      await scheduleMutation.mutateAsync({
        assessmentKey,
        // datetime-local is local time: send an explicit ISO instant.
        scheduled_at: new Date(schedule.at).toISOString(),
        delivery_mode: schedule.mode,
        location: schedule.mode === 'offline' ? schedule.location : null,
      })
      if (announce) await publishSchedule.mutateAsync(assessmentKey)
    },
    announce ? 'Examen programmé et annoncé aux apprenants.' : 'Examen programmé.',
  )
  if (ok) scheduleTarget.value = null
}

const dateTime = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeStyle: 'short' })
function formatDateTime(value: string) {
  return dateTime.format(new Date(value))
}
</script>
