<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="attendance-modal-title"
    data-test="attendance-modal"
  >
    <div
      class="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl transition-all"
    >
      <!-- En-tête -->
      <header class="flex items-center justify-between border-b border-line px-6 py-4">
        <div>
          <h2 id="attendance-modal-title" class="text-lg font-bold text-ink">
            Feuille de présence — {{ cohortName }}
          </h2>
          <p class="text-xs text-quiet">
            Gestion de l'émargement et assiduité aux cours en présentiel (offline)
          </p>
        </div>
        <button
          class="rounded-lg p-1.5 text-quiet transition hover:bg-canvas hover:text-ink"
          aria-label="Fermer"
          data-test="close-modal"
          @click="emit('close')"
        >
          <XIcon :size="20" />
        </button>
      </header>

      <!-- Navigation onglets -->
      <div class="flex border-b border-line px-6 pt-2">
        <button
          type="button"
          class="border-b-2 px-4 py-2.5 text-sm font-semibold transition"
          :class="
            activeTab === 'sessions'
              ? 'border-primary text-primary'
              : 'border-transparent text-quiet hover:text-ink'
          "
          data-test="tab-sessions"
          @click="activeTab = 'sessions'"
        >
          Séances d'émargement
        </button>
        <button
          type="button"
          class="border-b-2 px-4 py-2.5 text-sm font-semibold transition"
          :class="
            activeTab === 'summary'
              ? 'border-primary text-primary'
              : 'border-transparent text-quiet hover:text-ink'
          "
          data-test="tab-summary"
          @click="activeTab = 'summary'"
        >
          Bilan d'assiduité global
        </button>
      </div>

      <!-- Corps du dialogue -->
      <div class="flex-1 overflow-y-auto p-6">
        <p
          v-if="actionError"
          class="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800"
          role="alert"
        >
          {{ actionError }}
        </p>

        <!-- ONGLET 1 : SÉANCES -->
        <section v-if="activeTab === 'sessions'" class="space-y-4">
          <!-- Formulaire création séance -->
          <div
            v-if="showNewSessionForm"
            class="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3"
            data-test="new-session-form"
          >
            <h3 class="text-sm font-bold text-ink">Créer une nouvelle séance d'émargement</h3>
            <form class="space-y-3" @submit.prevent="handleCreateSession">
              <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <label class="text-xs font-semibold text-ink">
                  Date de la séance *
                  <input
                    v-model="newSession.date"
                    type="date"
                    required
                    class="app-input mt-1"
                    data-test="new-session-date"
                  />
                </label>
                <label class="text-xs font-semibold text-ink sm:col-span-2 md:col-span-1">
                  Horaires *
                  <div class="mt-1 flex items-center gap-1">
                    <input
                      v-model="newSession.starts_at_time"
                      type="text"
                      required
                      placeholder="09:00"
                      maxlength="10"
                      class="app-input w-20 text-center"
                      data-test="new-session-starts-at"
                    />
                    <span class="text-quiet">-</span>
                    <input
                      v-model="newSession.ends_at_time"
                      type="text"
                      placeholder="17:00"
                      maxlength="10"
                      class="app-input w-20 text-center"
                      data-test="new-session-ends-at"
                    />
                  </div>
                </label>
                <label class="text-xs font-semibold text-ink sm:col-span-2 md:col-span-2">
                  Intitulé / Atelier
                  <input
                    v-model.trim="newSession.title"
                    type="text"
                    maxlength="180"
                    placeholder="Ex : TP Câblage & Configuration Switchs"
                    class="app-input mt-1"
                    data-test="new-session-title"
                  />
                </label>
              </div>

              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="app-action-secondary"
                  @click="showNewSessionForm = false"
                >
                  Annuler
                </button>
                <button
                  class="app-action-primary"
                  :disabled="createSessionMutation.isPending.value"
                  data-test="submit-new-session"
                >
                  {{ createSessionMutation.isPending.value ? 'Création…' : 'Créer la séance' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Bouton ouvrir formulaire si replié -->
          <div v-else-if="!activeSessionKey" class="flex items-center justify-between">
            <p class="text-xs text-quiet">
              {{ sessions.data.value?.length ?? 0 }} séance(s) enregistrée(s)
            </p>
            <button
              type="button"
              class="app-action-primary"
              data-test="open-new-session-btn"
              @click="showNewSessionForm = true"
            >
              <PlusIcon :size="16" class="mr-1 inline" /> Nouvelle séance
            </button>
          </div>

          <!-- FEUILLE DE POINTAGE ACTIVE -->
          <div
            v-if="activeSessionKey && sessionDetail.data.value"
            class="space-y-4 rounded-xl border border-line bg-canvas/30 p-4"
            data-test="attendance-sheet"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3"
            >
              <div>
                <span class="text-xs font-bold uppercase text-primary">
                  {{ sessionDetail.data.value.date }}
                </span>
                <h3 class="text-base font-bold text-ink">
                  {{ sessionDetail.data.value.title || 'Séance en présentiel' }}
                </h3>
                <p
                  v-if="
                    sessionDetail.data.value.starts_at_time || sessionDetail.data.value.ends_at_time
                  "
                  class="text-xs text-quiet"
                >
                  Horaires : {{ sessionDetail.data.value.starts_at_time }} -
                  {{ sessionDetail.data.value.ends_at_time }}
                </p>
              </div>
              <button
                type="button"
                class="app-action-secondary text-xs"
                data-test="back-to-sessions-list"
                @click="activeSessionKey = null"
              >
                &larr; Retour à la liste des séances
              </button>
            </div>

            <!-- Grille de pointage par apprenant -->
            <form @submit.prevent="saveAttendanceBatch">
              <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                  <thead class="border-b border-line text-xs font-bold text-quiet">
                    <tr>
                      <th class="py-2.5">Apprenant</th>
                      <th class="py-2.5">Statut de présence</th>
                      <th class="py-2.5">Note / Motif</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-line">
                    <tr
                      v-for="record in editingBatch"
                      :key="record.key"
                      class="hover:bg-white/60"
                      data-test="attendance-row"
                    >
                      <td class="py-3 pr-4">
                        <p class="font-semibold text-ink">
                          {{ record.learnerName }}
                        </p>
                        <p class="text-xs text-quiet">
                          {{ record.learnerEmail }}
                        </p>
                      </td>
                      <td class="py-3 pr-4">
                        <div class="flex flex-wrap gap-1">
                          <button
                            v-for="st in [
                              'present',
                              'late',
                              'excused',
                              'absent',
                            ] as AttendanceStatus[]"
                            :key="st"
                            type="button"
                            class="rounded-md px-2.5 py-1 text-xs font-semibold transition"
                            :class="
                              record.status === st
                                ? statusActiveClasses[st]
                                : 'bg-canvas text-quiet hover:bg-line'
                            "
                            :data-test="`status-btn-${st}-${record.key}`"
                            @click="record.status = st"
                          >
                            {{ attendanceStatusLabels[st] }}
                          </button>
                        </div>
                      </td>
                      <td class="py-3">
                        <input
                          v-model.trim="record.note"
                          type="text"
                          maxlength="255"
                          placeholder="Ex : Retard 20m, justifié..."
                          class="app-input text-xs"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div
                class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3"
              >
                <span class="text-xs text-quiet">
                  {{ editingBatch.length }} apprenant(s) à émarger
                </span>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="app-action-secondary"
                    @click="activeSessionKey = null"
                  >
                    Annuler
                  </button>
                  <button
                    class="app-action-primary"
                    :disabled="updateBatchMutation.isPending.value"
                    data-test="submit-attendance-batch"
                  >
                    {{
                      updateBatchMutation.isPending.value
                        ? 'Enregistrement…'
                        : "Enregistrer l'émargement"
                    }}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <!-- LISTE DES SÉANCES -->
          <div v-else-if="sessions.isPending.value" class="space-y-3">
            <div v-for="n in 3" :key="n" class="app-skeleton h-16" />
          </div>

          <div
            v-else-if="!sessions.data.value?.length"
            class="rounded-xl bg-canvas p-8 text-center text-sm text-quiet"
          >
            Aucune séance de présence enregistrée pour cette cohorte. Cliquez sur « Nouvelle séance
            » pour commencer le pointage.
          </div>

          <ul v-else class="space-y-3">
            <li
              v-for="session in sessions.data.value"
              :key="session.key"
              class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-4 transition hover:border-primary/30"
              data-test="session-item"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-ink">{{ session.date }}</span>
                  <span
                    v-if="session.starts_at_time || session.ends_at_time"
                    class="rounded bg-canvas px-1.5 py-0.5 text-xs text-quiet"
                    data-test="session-time"
                  >
                    {{ session.starts_at_time
                    }}<template v-if="session.ends_at_time"> - {{ session.ends_at_time }}</template>
                  </span>
                </div>
                <p class="text-sm text-quiet mt-0.5">
                  {{ session.title || 'Séance en présentiel' }}
                </p>
                <div v-if="session.stats" class="mt-2 flex flex-wrap items-center gap-3 text-xs">
                  <span
                    class="font-semibold"
                    :class="
                      session.stats.rate >= 80
                        ? 'text-emerald-700'
                        : session.stats.rate >= 50
                          ? 'text-amber-700'
                          : 'text-red-700'
                    "
                  >
                    Assiduité : {{ session.stats.rate }}%
                  </span>
                  <span class="text-emerald-700">{{ session.stats.present }} Présent(s)</span>
                  <span class="text-amber-700">{{ session.stats.late }} Retard(s)</span>
                  <span class="text-blue-700">{{ session.stats.excused }} Excusé(s)</span>
                  <span class="text-red-700">{{ session.stats.absent }} Absent(s)</span>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="app-action-primary text-xs"
                  data-test="open-session-sheet-btn"
                  @click="openSessionSheet(session.key)"
                >
                  Pointer / Émarger
                </button>
                <ConfirmButton
                  label="Supprimer"
                  confirm="Supprimer cette séance ?"
                  button-class="rounded-lg p-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  data-test="delete-session-btn"
                  @confirm="handleDeleteSession(session.key)"
                />
              </div>
            </li>
          </ul>
        </section>

        <!-- ONGLET 2 : BILAN D'ASSIDUITÉ GLOBAL -->
        <section v-else-if="activeTab === 'summary'" class="space-y-4">
          <div v-if="summary.isPending.value" class="space-y-3">
            <div v-for="n in 3" :key="n" class="app-skeleton h-12" />
          </div>

          <div
            v-else-if="!summary.data.value?.learners.length"
            class="rounded-xl bg-canvas p-8 text-center text-sm text-quiet"
          >
            Aucun apprenant ou aucune séance enregistrée pour calculer le bilan.
          </div>

          <div v-else class="space-y-4" data-test="attendance-summary-view">
            <div class="flex items-center justify-between rounded-xl bg-canvas p-4 text-sm">
              <span class="font-semibold text-ink">
                Nombre total de séances :
                {{ summary.data.value.total_sessions }}
              </span>
              <span class="text-xs text-quiet">
                (Calcul : Présents + Retards / Séances totales)
              </span>
            </div>

            <div class="overflow-x-auto rounded-xl border border-line">
              <table class="w-full text-left text-sm">
                <thead class="bg-canvas/50 text-xs font-bold text-quiet">
                  <tr>
                    <th class="p-3">Apprenant</th>
                    <th class="p-3 text-center">Présents</th>
                    <th class="p-3 text-center">Retards</th>
                    <th class="p-3 text-center">Excusés</th>
                    <th class="p-3 text-center">Absents</th>
                    <th class="p-3 text-right">Taux d'assiduité</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <tr
                    v-for="l in summary.data.value.learners"
                    :key="l.enrollment_key"
                    class="hover:bg-canvas/20"
                  >
                    <td class="p-3">
                      <p class="font-semibold text-ink">{{ l.learner.name }}</p>
                      <p class="text-xs text-quiet">{{ l.learner.email }}</p>
                    </td>
                    <td class="p-3 text-center font-medium text-emerald-700">
                      {{ l.present }}
                    </td>
                    <td class="p-3 text-center font-medium text-amber-700">
                      {{ l.late }}
                    </td>
                    <td class="p-3 text-center font-medium text-blue-700">
                      {{ l.excused }}
                    </td>
                    <td class="p-3 text-center font-medium text-red-700">
                      {{ l.absent }}
                    </td>
                    <td class="p-3 text-right font-bold">
                      <span
                        class="rounded-full px-2.5 py-0.5 text-xs font-bold"
                        :class="
                          l.rate >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : l.rate >= 50
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-700'
                        "
                      >
                        {{ l.rate }}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      <!-- Pied de page -->
      <footer class="flex justify-end border-t border-line px-6 py-3">
        <button type="button" class="app-action-secondary" @click="emit('close')">Fermer</button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Plus as PlusIcon, X as XIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import ConfirmButton from '@/features/admin/components/ConfirmButton.vue'
import { apiErrorMessage } from '@/features/formateur/composables/useTrainerCourses'
import {
  attendanceStatusLabels,
  useCohortAttendanceSessionDetail,
  useCohortAttendanceSessions,
  useCohortAttendanceSummary,
  useCreateAttendanceSession,
  useDeleteAttendanceSession,
  useUpdateAttendanceBatch,
  type AttendanceRecord,
  type AttendanceStatus,
} from '@/features/admin/composables/useCohortAttendance'

const props = defineProps<{
  open: boolean
  cohortKey: string
  cohortName: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cKey = computed(() => props.cohortKey)

const activeTab = ref<'sessions' | 'summary'>('sessions')
const actionError = ref('')

const sessions = useCohortAttendanceSessions(cKey)
const summary = useCohortAttendanceSummary(cKey)

const createSessionMutation = useCreateAttendanceSession(cKey)
const deleteSessionMutation = useDeleteAttendanceSession(cKey)

// Formulaire nouvelle séance
const showNewSessionForm = ref(false)
const newSession = reactive({
  date: '',
  title: '',
  starts_at_time: '09:00',
  ends_at_time: '17:00',
})

async function handleCreateSession() {
  actionError.value = ''
  if (!newSession.starts_at_time?.trim()) {
    actionError.value = "L'horaire de début est obligatoire."
    return
  }
  try {
    const created = await createSessionMutation.mutateAsync({
      date: newSession.date,
      title: newSession.title || null,
      starts_at_time: newSession.starts_at_time.trim(),
      ends_at_time: newSession.ends_at_time?.trim() || null,
    })
    toast.success('Séance d’émargement créée.')
    showNewSessionForm.value = false
    Object.assign(newSession, {
      date: '',
      title: '',
      starts_at_time: '09:00',
      ends_at_time: '17:00',
    })
    openSessionSheet(created.key)
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Impossible de créer la séance d’émargement.')
  }
}

// Feuille d'émargement active
const activeSessionKey = ref<string | null>(null)
const sessionDetail = useCohortAttendanceSessionDetail(cKey, activeSessionKey)
const updateBatchMutation = useUpdateAttendanceBatch(
  cKey,
  computed(() => activeSessionKey.value ?? ''),
)

interface EditingRow {
  key: string
  learnerName: string
  learnerEmail: string
  status: AttendanceStatus
  note: string
}

const editingBatch = ref<EditingRow[]>([])

function openSessionSheet(sessionKey: string) {
  activeSessionKey.value = sessionKey
}

watch(
  () => sessionDetail.data.value,
  (val) => {
    if (!val?.attendances) {
      editingBatch.value = []
      return
    }
    editingBatch.value = val.attendances.map((att: AttendanceRecord) => ({
      key: att.key,
      learnerName: att.learner?.name ?? 'Apprenant',
      learnerEmail: att.learner?.email ?? '',
      status: att.status,
      note: att.note ?? '',
    }))
  },
  { immediate: true },
)

async function saveAttendanceBatch() {
  if (!activeSessionKey.value) return
  actionError.value = ''
  try {
    await updateBatchMutation.mutateAsync({
      attendances: editingBatch.value.map((r) => ({
        key: r.key,
        status: r.status,
        note: r.note.trim() || null,
      })),
    })
    toast.success('Émargement enregistré avec succès.')
    activeSessionKey.value = null
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Impossible d’enregistrer l’émargement.')
  }
}

async function handleDeleteSession(sessionKey: string) {
  actionError.value = ''
  try {
    await deleteSessionMutation.mutateAsync(sessionKey)
    toast.success('Séance supprimée.')
    if (activeSessionKey.value === sessionKey) {
      activeSessionKey.value = null
    }
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Impossible de supprimer la séance.')
  }
}

const statusActiveClasses: Record<AttendanceStatus, string> = {
  present: 'bg-emerald-600 text-white shadow-sm',
  late: 'bg-amber-500 text-white shadow-sm',
  excused: 'bg-blue-600 text-white shadow-sm',
  absent: 'bg-red-600 text-white shadow-sm',
}
</script>
