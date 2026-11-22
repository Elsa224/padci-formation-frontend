<template>
  <section class="app-page max-w-5xl">
    <RouterLink to="/formateur/cours" class="text-sm font-semibold text-primary">
      &larr; Mes cours
    </RouterLink>

    <div v-if="course.isPending.value" class="app-skeleton h-32" />
    <div
      v-else-if="course.isError.value"
      class="rounded-xl bg-red-50 p-4 text-sm text-red-800"
      role="alert"
    >
      {{ apiErrorMessage(course.error.value, 'Impossible de charger ce cours.') }}
    </div>

    <template v-else-if="course.data.value">
      <header class="app-page-header">
        <div>
          <p class="text-xs font-bold uppercase tracking-wider text-primary">
            {{ course.data.value.pathway?.name ?? 'Filière' }}
          </p>
          <h1 class="app-page-title mt-2">{{ course.data.value.title }}</h1>
          <p v-if="course.data.value.summary" class="app-page-copy">
            {{ course.data.value.summary }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <CourseStatusBadge :status="course.data.value.status" />
          <button
            v-if="course.data.value.status === 'rejected'"
            class="app-action-secondary"
            :disabled="revert.isPending.value"
            @click="run(() => revert.mutateAsync(courseKey), 'Cours repassé en brouillon.')"
          >
            Repasser en brouillon
          </button>
          <button
            v-if="canSubmit(course.data.value.status)"
            class="app-action-primary"
            :disabled="submit.isPending.value"
            @click="submitCourse"
          >
            Soumettre à validation
          </button>
        </div>
      </header>

      <p v-if="actionError" class="rounded-xl bg-red-50 p-3 text-sm text-red-800" role="alert">
        {{ actionError }}
      </p>
      <p v-if="!editable" class="app-panel-muted text-sm text-quiet">
        Ce cours n'est plus modifiable dans son état actuel ({{
          courseStatusLabels[course.data.value.status]
        }}).
      </p>

      <!-- Contenu -->
      <div class="app-panel space-y-5">
        <h2 class="text-lg font-bold text-ink">Contenu du cours</h2>

        <div v-if="modules.isPending.value" class="space-y-3">
          <div v-for="n in 2" :key="n" class="app-skeleton h-20" />
        </div>
        <p v-else-if="modules.isError.value" class="text-sm text-red-700" role="alert">
          {{ apiErrorMessage(modules.error.value, 'Impossible de charger le contenu.') }}
        </p>
        <p
          v-else-if="!modules.data.value?.length"
          class="rounded-xl bg-canvas p-6 text-sm text-quiet"
        >
          Aucun module pour l'instant. Commencez par en ajouter un.
        </p>

        <ol v-else class="space-y-4">
          <li
            v-for="module in modules.data.value"
            :key="module.key"
            class="rounded-xl border border-line p-4"
            data-test="course-module"
          >
            <p class="font-bold text-ink">{{ module.position }}. {{ module.title }}</p>
            <p v-if="module.summary" class="mt-1 text-sm text-quiet">{{ module.summary }}</p>

            <ul v-if="module.chapters?.length" class="mt-3 space-y-2">
              <li
                v-for="chapter in module.chapters"
                :key="chapter.key"
                class="rounded-lg bg-canvas p-3 text-sm"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="font-semibold text-ink">{{ chapter.title }}</span>
                  <span class="text-xs text-quiet">{{ chapterTypeLabels[chapter.type] }}</span>
                </div>
                <ul v-if="chapter.resources?.length" class="mt-2 space-y-1">
                  <li
                    v-for="resource in chapter.resources"
                    :key="resource.key"
                    class="flex items-center gap-2 text-xs"
                  >
                    <LinkIcon v-if="resource.type === 'link'" :size="14" class="text-quiet" />
                    <FileTextIcon v-else :size="14" class="text-quiet" />
                    <a
                      v-if="resource.external_url"
                      :href="resource.external_url"
                      target="_blank"
                      rel="noopener"
                      class="font-medium text-primary hover:underline"
                      >{{ resource.title }}</a
                    >
                    <span v-else class="font-medium text-ink">{{ resource.title }}</span>
                  </li>
                </ul>

                <!-- Ajout de support -->
                <form
                  v-if="editable && resourceTarget === chapter.key"
                  class="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                  @submit.prevent="addResource(module.key, chapter.key)"
                >
                  <input
                    v-model.trim="resourceForm.title"
                    class="app-input"
                    required
                    maxlength="180"
                    placeholder="Titre du support"
                    aria-label="Titre du support"
                  />
                  <input
                    v-model.trim="resourceForm.url"
                    class="app-input"
                    type="url"
                    required
                    placeholder="https://…"
                    aria-label="Lien du support"
                  />
                  <button class="app-action-primary" :disabled="createResource.isPending.value">
                    Ajouter
                  </button>
                </form>
                <button
                  v-else-if="editable"
                  class="mt-2 text-xs font-semibold text-primary"
                  @click="openResourceForm(chapter.key)"
                >
                  + Ajouter un lien vers un support
                </button>
              </li>
            </ul>

            <!-- Ajout de chapitre -->
            <form
              v-if="editable && chapterTarget === module.key"
              class="mt-3 space-y-2 rounded-lg border border-line p-3"
              @submit.prevent="addChapter(module.key)"
            >
              <div class="grid gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  v-model.trim="chapterForm.title"
                  class="app-input"
                  required
                  maxlength="180"
                  placeholder="Titre du chapitre"
                  aria-label="Titre du chapitre"
                />
                <select v-model="chapterForm.type" class="app-input" aria-label="Type de chapitre">
                  <option v-for="(label, value) in chapterTypeLabels" :key="value" :value="value">
                    {{ label }}
                  </option>
                </select>
              </div>
              <textarea
                v-model="chapterForm.body"
                class="app-input min-h-24"
                placeholder="Contenu du chapitre (optionnel)"
                aria-label="Contenu du chapitre"
              />
              <div class="flex justify-end gap-2">
                <button type="button" class="app-action-secondary" @click="chapterTarget = null">
                  Annuler
                </button>
                <button class="app-action-primary" :disabled="createChapter.isPending.value">
                  Ajouter le chapitre
                </button>
              </div>
            </form>
            <button
              v-else-if="editable"
              class="mt-3 text-sm font-semibold text-primary"
              @click="openChapterForm(module.key)"
            >
              + Ajouter un chapitre
            </button>
          </li>
        </ol>

        <form
          v-if="editable"
          class="grid gap-2 border-t border-line pt-5 sm:grid-cols-[1fr_auto]"
          @submit.prevent="addModule"
        >
          <input
            v-model.trim="moduleTitle"
            class="app-input"
            required
            maxlength="180"
            placeholder="Titre du nouveau module"
            aria-label="Titre du nouveau module"
          />
          <button class="app-action-primary" :disabled="createModule.isPending.value">
            Ajouter un module
          </button>
        </form>
        <p v-if="editable" class="text-xs text-quiet">
          Le dépôt direct de fichiers (PDF, vidéos) sera disponible lorsque l'API rattachera les
          médias aux chapitres. En attendant, ajoutez un lien vers le support.
        </p>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { FileText as FileTextIcon, Link as LinkIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import CourseStatusBadge from '../components/CourseStatusBadge.vue'
import {
  apiErrorMessage,
  canSubmit,
  courseStatusLabels,
  isEditable,
  useCourseModules,
  useCreateChapter,
  useCreateModule,
  useCreateResource,
  useRevertCourseToDraft,
  useSubmitCourse,
  useTrainerCourse,
  type ChapterType,
} from '../composables/useTrainerCourses'

const chapterTypeLabels: Record<ChapterType, string> = {
  lesson: 'Leçon',
  video: 'Vidéo',
  document: 'Document',
  external_link: 'Lien externe',
}

const route = useRoute()
const courseKey = computed(() => String(route.params.courseKey))

const course = useTrainerCourse(courseKey)
const modules = useCourseModules(courseKey)
const submit = useSubmitCourse()
const revert = useRevertCourseToDraft()
const createModule = useCreateModule(courseKey)
const createChapter = useCreateChapter(courseKey)
const createResource = useCreateResource(courseKey)

const editable = computed(() => (course.data.value ? isEditable(course.data.value.status) : false))
const actionError = ref('')

const moduleTitle = ref('')
const chapterTarget = ref<string | null>(null)
const chapterForm = reactive({ title: '', type: 'lesson' as ChapterType, body: '' })
const resourceTarget = ref<string | null>(null)
const resourceForm = reactive({ title: '', url: '' })

async function run(action: () => Promise<unknown>, success: string) {
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

async function submitCourse() {
  actionError.value = ''
  try {
    const result = await submit.mutateAsync(courseKey.value)
    toast.success(result.status === 'published' ? 'Cours publié.' : 'Cours soumis à la validation.')
  } catch (error) {
    actionError.value = apiErrorMessage(error, 'Impossible de soumettre le cours.')
  }
}

async function addModule() {
  if (await run(() => createModule.mutateAsync({ title: moduleTitle.value }), 'Module ajouté.')) {
    moduleTitle.value = ''
  }
}

function openChapterForm(moduleKey: string) {
  Object.assign(chapterForm, { title: '', type: 'lesson', body: '' })
  chapterTarget.value = moduleKey
}

async function addChapter(moduleKey: string) {
  const ok = await run(
    () =>
      createChapter.mutateAsync({
        moduleKey,
        title: chapterForm.title,
        type: chapterForm.type,
        body: chapterForm.body.trim() || null,
      }),
    'Chapitre ajouté.',
  )
  if (ok) chapterTarget.value = null
}

function openResourceForm(chapterKey: string) {
  Object.assign(resourceForm, { title: '', url: '' })
  resourceTarget.value = chapterKey
}

async function addResource(moduleKey: string, chapterKey: string) {
  const ok = await run(
    () =>
      createResource.mutateAsync({
        moduleKey,
        chapterKey,
        title: resourceForm.title,
        type: 'link',
        external_url: resourceForm.url,
      }),
    'Support ajouté.',
  )
  if (ok) resourceTarget.value = null
}
</script>
