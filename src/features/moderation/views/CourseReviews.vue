<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Modération des cours</h1>
        <p class="app-page-copy">Examinez les cours soumis avant leur publication.</p>
      </div>
    </header>
    <div class="app-panel space-y-5">
      <QueueTabs v-model="status" :tabs="tabs" label="Statut des cours" />
      <div v-if="courses.isPending.value" class="space-y-3">
        <div v-for="n in 3" :key="n" class="app-skeleton h-24" />
      </div>
      <div v-else-if="courses.isError.value" class="app-alert app-alert-danger" role="alert">
        {{ errorMessage(courses.error.value) }}
        <button class="underline" @click="courses.refetch()">Réessayer</button>
      </div>
      <EmptyState
        v-else-if="!courses.data.value?.items.length"
        :title="emptyTitle"
        description="Les cours apparaissent ici dès qu'un formateur les soumet à validation."
      />
      <div v-else class="space-y-3">
        <article
          v-for="course in courses.data.value?.items"
          :key="course.key"
          class="rounded-xl border p-5 transition"
          :class="selected?.key === course.key ? 'border-primary/40 bg-mint/30' : 'border-line'"
          :data-test="`course-${course.key}`"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold text-primary">
                {{ course.pathway?.name ?? 'Filière' }}
              </p>
              <h3 class="mt-1 font-bold text-ink">{{ course.title }}</h3>
              <p class="mt-1 text-xs text-quiet">
                Formateur : {{ course.owner?.name ?? 'Non précisé' }}
              </p>
            </div>
            <button class="app-action-secondary" @click="select(course)">
              {{ selected?.key === course.key ? 'Fermer' : 'Examiner' }}
            </button>
          </div>
          <div v-if="selected?.key === course.key" class="mt-5 space-y-4 border-t border-line pt-5">
            <p class="whitespace-pre-wrap text-sm leading-6 text-quiet">
              {{ course.description || course.summary || 'Aucune description disponible.' }}
            </p>
            <div class="rounded-xl bg-canvas p-4">
              <h4 class="font-bold text-ink">Contenu du cours</h4>
              <p v-if="modules.isPending.value" class="mt-2 text-sm text-quiet">Chargement...</p>
              <p v-else-if="modules.isError.value" class="mt-2 text-sm text-danger-ink">
                {{ errorMessage(modules.error.value) }}
              </p>
              <p v-else-if="!modules.data.value?.length" class="mt-2 text-sm text-quiet">
                Aucun module disponible.
              </p>
              <ol v-else class="mt-3 space-y-4">
                <li v-for="module in modules.data.value" :key="module.key" class="text-sm">
                  <p class="font-semibold text-ink">{{ module.title }}</p>
                  <p v-if="module.summary" class="mt-1 whitespace-pre-wrap text-quiet">
                    {{ module.summary }}
                  </p>
                  <div
                    v-for="chapter in module.chapters ?? []"
                    :key="chapter.key"
                    class="mt-3 rounded-lg border border-line bg-white p-3"
                  >
                    <h5 class="font-semibold text-ink">{{ chapter.title }}</h5>
                    <div
                      v-if="chapter.body"
                      class="app-prose mt-2 max-w-none text-sm"
                      v-html="renderMarkdown(chapter.body)"
                    />
                    <ul v-if="chapter.resources?.length" class="mt-2 space-y-2">
                      <li
                        v-for="resource in chapter.resources"
                        :key="resource.key"
                        class="border-t border-line pt-2 text-quiet"
                      >
                        <span class="font-semibold text-ink">{{ resource.title }}</span>
                        <p v-if="resource.body" class="whitespace-pre-wrap break-words">
                          {{ resource.body }}
                        </p>
                        <p v-if="resource.external_url" class="break-all">
                          {{ resource.external_url }}
                        </p>
                      </li>
                    </ul>
                  </div>
                </li>
              </ol>
            </div>
            <form
              v-if="['submitted', 'in_review'].includes(course.status)"
              class="sticky bottom-4 z-10 space-y-3 rounded-xl border border-line bg-white p-4 shadow-raised"
              @submit.prevent="decide(course, 'approve')"
            >
              <label class="block text-sm font-semibold text-ink" :for="`note-${course.key}`">
                Commentaire au formateur
                <span class="font-normal text-quiet">(obligatoire pour un rejet)</span>
              </label>
              <textarea
                :id="`note-${course.key}`"
                v-model.trim="note"
                class="app-input"
                rows="3"
                maxlength="2000"
                placeholder="Ce qui doit être corrigé, ou un mot d'encouragement."
              />
              <p v-if="actionError" role="alert" class="text-sm text-danger-ink">
                {{ actionError }}
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  type="submit"
                  class="app-action-primary"
                  :disabled="busy"
                  :aria-busy="busy"
                  data-test="approve-course"
                >
                  {{ pendingAction === 'approve' ? 'Publication…' : 'Approuver et publier' }}
                </button>
                <button
                  type="button"
                  class="app-action-secondary text-danger-ink hover:border-danger-line hover:bg-danger-soft"
                  :disabled="busy"
                  :aria-busy="busy"
                  data-test="reject-course"
                  @click="decide(course, 'reject')"
                >
                  {{ pendingAction === 'reject' ? 'Rejet…' : 'Rejeter' }}
                </button>
              </div>
            </form>
            <p v-else-if="course.status === 'rejected'" class="text-sm text-quiet">
              Ce cours a été rejeté. Le formateur peut le corriger et le soumettre à nouveau.
            </p>
          </div>
        </article>
      </div>
      <nav
        v-if="courses.data.value?.pagination && (courses.data.value.pagination.last_page ?? 1) > 1"
        class="flex items-center justify-end gap-3"
        aria-label="Pagination"
      >
        <button class="app-action-secondary" :disabled="page <= 1" @click="page--">Précédent</button
        ><span class="text-sm text-quiet"
          >{{ page }} / {{ courses.data.value.pagination.last_page }}</span
        ><button
          class="app-action-secondary"
          :disabled="page >= (courses.data.value.pagination.last_page ?? 1)"
          @click="page++"
        >
          Suivant
        </button>
      </nav>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { apiMeta, ApiError, http } from '@/api/http'
import EmptyState from '@/components/app/EmptyState.vue'
import QueueTabs from '@/components/app/QueueTabs.vue'
import { renderMarkdown } from '@/lib/markdown'
import { useCourseStatusCounts } from '../composables/useModerationQueues'
interface Course {
  key: string
  title: string
  status: string
  description: string | null
  summary: string | null
  owner?: { name: string }
  pathway?: { name: string }
}
interface Module {
  key: string
  title: string
  summary: string | null
  chapters?: Array<{
    key: string
    title: string
    body: string | null
    resources?: Array<{
      key: string
      title: string
      body: string | null
      external_url: string | null
    }>
  }>
}
const STATUSES = [
  { value: 'submitted', label: 'Soumis', empty: 'Aucun cours soumis', urgent: true },
  {
    value: 'in_review',
    label: "En cours d'examen",
    empty: "Aucun cours en cours d'examen",
    urgent: true,
  },
  { value: 'published', label: 'Publiés', empty: 'Aucun cours publié' },
  { value: 'suspended', label: 'Suspendus', empty: 'Aucun cours suspendu' },
  { value: 'rejected', label: 'Rejetés', empty: 'Aucun cours rejeté' },
] as const
type Action = 'approve' | 'reject'

const route = useRoute()
const router = useRouter()
const initialStatus = String(route.query.statut ?? '')
const status = ref<string>(
  STATUSES.some((s) => s.value === initialStatus) ? initialStatus : 'submitted',
)
const page = ref(1)
const selected = ref<Course | null>(null)
const note = ref('')
const actionError = ref('')
const pendingAction = ref<Action | null>(null)
const client = useQueryClient()

const counts = useCourseStatusCounts(STATUSES.map((s) => s.value))
const tabs = computed(() =>
  STATUSES.map((s) => ({
    value: s.value,
    label: s.label,
    count: counts.data.value?.[s.value] ?? null,
    urgent: 'urgent' in s && s.urgent,
  })),
)
const emptyTitle = computed(
  () => STATUSES.find((s) => s.value === status.value)?.empty ?? 'Aucun cours',
)

watch(status, (value) => {
  page.value = 1
  selected.value = null
  void router.replace({ query: { ...route.query, statut: value, cle: undefined } })
})
const courses = useQuery({
  queryKey: computed(() => ['moderation-courses', status.value, page.value]),
  queryFn: async () => {
    const response = await http.get<Course[]>('/admin/courses', {
      params: { status: status.value, page: page.value },
    })
    return { items: response.data, pagination: apiMeta(response)?.pagination ?? null }
  },
})
// Arrivée depuis le tableau de bord (?cle=…) : ouvrir directement ce cours.
watch(
  () => courses.data.value?.items,
  (items) => {
    const key = route.query.cle
    if (!key || selected.value) return
    const match = items?.find((course) => course.key === key)
    if (match) select(match)
  },
  { immediate: true },
)
const modules = useQuery({
  queryKey: computed(() => ['moderation-course-modules', selected.value?.key]),
  enabled: computed(() => !!selected.value),
  queryFn: async () =>
    (await http.get<Module[]>(`/admin/courses/${selected.value?.key}/modules`)).data,
})
const mutation = useMutation({
  mutationFn: ({ course, action }: { course: Course; action: Action }) =>
    http.post(`/admin/courses/${course.key}/${action}`, { note: note.value || null }),
  onSuccess: (_data, { course, action }) => {
    toast.success(
      action === 'approve' ? `« ${course.title} » est publié.` : `« ${course.title} » est rejeté.`,
    )
    selected.value = null
    note.value = ''
    void client.invalidateQueries({ queryKey: ['moderation-courses'] })
  },
  onSettled: () => {
    pendingAction.value = null
  },
})
const busy = computed(
  () => mutation.isPending.value || modules.isError.value || modules.isPending.value,
)
function select(course: Course) {
  selected.value = selected.value?.key === course.key ? null : course
  actionError.value = ''
  note.value = ''
}
function decide(course: Course, action: Action) {
  actionError.value = ''
  if (action === 'reject' && !note.value) {
    actionError.value = 'Indiquez au formateur ce qui doit être corrigé avant de rejeter.'
    return
  }
  pendingAction.value = action
  mutation.mutate(
    { course, action },
    {
      onError: (error) => {
        actionError.value = errorMessage(error)
      },
    },
  )
}
function errorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.displayMessage
    : 'Impossible de charger les informations.'
}
</script>
