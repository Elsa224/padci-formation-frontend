<template>
  <section class="app-page">
    <RouterLink to="/formateur/cours" class="text-sm font-semibold text-primary">
      <ArrowLeftIcon class="inline size-4 align-[-0.2em]" aria-hidden="true" /> Mes cours
    </RouterLink>

    <div v-if="course.isPending.value" class="app-skeleton h-32" />
    <div
      v-else-if="course.isError.value"
      class="rounded-xl bg-danger-soft p-4 text-sm text-danger-ink"
      role="alert"
    >
      {{ apiErrorMessage(course.error.value, 'Impossible de charger ce cours.') }}
    </div>

    <template v-else-if="course.data.value">
      <header class="app-page-header">
        <div>
          <h1 class="app-page-title">{{ course.data.value.title }}</h1>
          <p v-if="course.data.value.summary" class="app-page-copy">
            {{ course.data.value.summary }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <CourseStatusBadge :status="course.data.value.status" />
          <button
            v-if="editable && !ficheOpen"
            class="app-action-secondary"
            data-test="edit-fiche"
            @click="openFiche"
          >
            Modifier la fiche
          </button>
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

      <p
        v-if="actionError"
        class="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink"
        role="alert"
      >
        {{ actionError }}
      </p>
      <p v-if="!editable" class="app-panel-muted text-sm text-quiet">
        Ce cours n'est plus modifiable dans son état actuel ({{
          courseStatusLabels[course.data.value.status]
        }}).
      </p>

      <!-- Fiche du cours -->
      <form
        v-if="ficheOpen"
        class="app-panel space-y-3"
        data-test="fiche-form"
        @submit.prevent="saveFiche"
      >
        <h2 class="text-lg font-bold text-ink">Fiche du cours</h2>
        <div class="grid gap-3 md:grid-cols-[1fr_12rem]">
          <label class="text-sm font-semibold text-ink">
            Titre
            <input
              id="fiche-title"
              v-model.trim="fiche.title"
              class="app-input mt-1"
              required
              maxlength="180"
            />
          </label>
          <label class="text-sm font-semibold text-ink">
            Niveau
            <select id="fiche-level" v-model="fiche.level" class="app-input mt-1">
              <option v-for="(label, value) in courseLevelLabels" :key="value" :value="value">
                {{ label }}
              </option>
            </select>
          </label>
        </div>
        <label class="block text-sm font-semibold text-ink">
          Résumé
          <textarea
            id="fiche-summary"
            v-model.trim="fiche.summary"
            class="app-input mt-1 min-h-16"
            maxlength="500"
          />
        </label>
        <label class="block text-sm font-semibold text-ink">
          Description
          <textarea
            id="fiche-description"
            v-model.trim="fiche.description"
            class="app-input mt-1 min-h-28"
          />
        </label>
        <div class="flex justify-end gap-2">
          <button type="button" class="app-action-secondary" @click="ficheOpen = false">
            Annuler
          </button>
          <button class="app-action-primary" :disabled="updateCourse.isPending.value">
            Enregistrer
          </button>
        </div>
      </form>

      <!-- Contenu -->
      <div class="app-panel space-y-5">
        <h2 class="text-lg font-bold text-ink">Contenu du cours</h2>

        <div v-if="modules.isPending.value" class="space-y-3">
          <div v-for="n in 2" :key="n" class="app-skeleton h-20" />
        </div>
        <p v-else-if="modules.isError.value" class="text-sm text-danger-ink" role="alert">
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
            v-for="(module, mIndex) in modules.data.value"
            :key="module.key"
            class="rounded-xl border border-line p-4"
            data-test="course-module"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <StructureNodeTitle
                :node-key="module.key"
                :title="module.title"
                :editable="editable"
                :busy="nodeBusy"
                title-class="font-bold text-ink"
                confirm-text="Supprimer ce module et tous ses chapitres ?"
                @rename="(title) => renameNode(`modules/${module.key}`, title)"
                @delete="deleteNode(`modules/${module.key}`, 'Module supprimé.')"
              >
                {{ module.position }}. {{ module.title }}
              </StructureNodeTitle>
              <div v-if="editable" class="flex items-center gap-1">
                <button
                  type="button"
                  class="rounded p-1 text-xs font-semibold text-quiet hover:bg-canvas hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                  :disabled="mIndex === 0 || reorderBusy"
                  :aria-label="`Monter le module ${module.title}`"
                  data-test="move-module-up"
                  @click="moveModuleUp(mIndex)"
                >
                  <ArrowUpIcon :size="14" />
                </button>
                <button
                  type="button"
                  class="rounded p-1 text-xs font-semibold text-quiet hover:bg-canvas hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                  :disabled="mIndex === (modules.data.value?.length ?? 0) - 1 || reorderBusy"
                  :aria-label="`Descendre le module ${module.title}`"
                  data-test="move-module-down"
                  @click="moveModuleDown(mIndex)"
                >
                  <ArrowDownIcon :size="14" />
                </button>
              </div>
            </div>
            <p v-if="module.summary" class="mt-1 text-sm text-quiet">{{ module.summary }}</p>

            <ul v-if="module.chapters?.length" class="mt-3 space-y-2">
              <li
                v-for="(chapter, cIndex) in module.chapters"
                :key="chapter.key"
                class="rounded-lg bg-canvas p-3 text-sm"
              >
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <StructureNodeTitle
                    :node-key="chapter.key"
                    :title="chapter.title"
                    :editable="editable"
                    :busy="nodeBusy"
                    confirm-text="Supprimer ce chapitre et ses supports ?"
                    @rename="
                      (title) => renameNode(`modules/${module.key}/chapters/${chapter.key}`, title)
                    "
                    @delete="
                      deleteNode(
                        `modules/${module.key}/chapters/${chapter.key}`,
                        'Chapitre supprimé.',
                      )
                    "
                  />
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-quiet">{{ chapterTypeLabels[chapter.type] }}</span>
                    <div v-if="editable" class="flex items-center gap-0.5">
                      <button
                        type="button"
                        class="rounded p-1 text-xs font-semibold text-quiet hover:bg-line hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                        :disabled="cIndex === 0 || reorderBusy"
                        :aria-label="`Monter le chapitre ${chapter.title}`"
                        data-test="move-chapter-up"
                        @click="moveChapterUp(module, cIndex)"
                      >
                        <ArrowUpIcon :size="13" />
                      </button>
                      <button
                        type="button"
                        class="rounded p-1 text-xs font-semibold text-quiet hover:bg-line hover:text-ink disabled:opacity-30 disabled:pointer-events-none"
                        :disabled="cIndex === (module.chapters?.length ?? 0) - 1 || reorderBusy"
                        :aria-label="`Descendre le chapitre ${chapter.title}`"
                        data-test="move-chapter-down"
                        @click="moveChapterDown(module, cIndex)"
                      >
                        <ArrowDownIcon :size="13" />
                      </button>
                    </div>
                  </div>
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
                      v-if="resourceHref(resource)"
                      :href="resourceHref(resource) ?? undefined"
                      target="_blank"
                      rel="noopener"
                      class="font-medium text-primary hover:underline"
                      >{{ resource.title }}</a
                    >
                    <span v-else class="font-medium text-ink">{{ resource.title }}</span>
                    <span v-if="resource.media" class="text-quiet">
                      · {{ resource.media.original_name }} ({{
                        formatSize(resource.media.size_bytes)
                      }})
                      <template v-if="resource.media.scan_status !== 'clean'">
                        · analyse antivirus en cours</template
                      >
                    </span>
                    <StructureNodeTitle
                      class="!flex-none"
                      :node-key="resource.key"
                      title=""
                      :editable="editable"
                      :busy="nodeBusy"
                      :renamable="false"
                      delete-label="Retirer"
                      confirm-text="Retirer ce support ?"
                      @delete="
                        deleteNode(
                          `modules/${module.key}/chapters/${chapter.key}/resources/${resource.key}`,
                          'Support retiré.',
                        )
                      "
                    />
                  </li>
                </ul>

                <!-- Dépôt de document -->
                <form
                  v-if="editable && documentTarget === chapter.key"
                  class="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]"
                  data-test="document-form"
                  @submit.prevent="addDocument(module.key, chapter.key)"
                >
                  <input
                    v-model.trim="documentForm.title"
                    class="app-input"
                    required
                    maxlength="180"
                    placeholder="Titre du document"
                    aria-label="Titre du document"
                  />
                  <input
                    class="app-input"
                    type="file"
                    required
                    :accept="DOCUMENT_ACCEPT"
                    aria-label="Fichier (PDF, Word, Excel, PowerPoint)"
                    @change="pickDocument"
                  />
                  <button
                    class="app-action-primary"
                    :disabled="addDocumentMutation.isPending.value"
                  >
                    {{ addDocumentMutation.isPending.value ? 'Envoi…' : 'Déposer' }}
                  </button>
                </form>

                <!-- Ajout de lien -->
                <form
                  v-else-if="editable && resourceTarget === chapter.key"
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
                <div v-else-if="editable" class="mt-2 flex flex-wrap gap-4">
                  <button
                    class="text-xs font-semibold text-primary"
                    data-test="open-document-form"
                    @click="openDocumentForm(chapter.key)"
                  >
                    + Déposer un document
                  </button>
                  <button
                    class="text-xs font-semibold text-primary"
                    @click="openResourceForm(chapter.key)"
                  >
                    + Ajouter un lien
                  </button>
                </div>
              </li>
            </ul>

            <!-- Ajout de chapitre -->
            <form
              v-if="editable && chapterTarget === module.key"
              class="mt-3 space-y-2 rounded-lg border border-line p-3"
              @submit.prevent="addChapter(module.key)"
            >
              <!-- Lesson only: video/document/link chapters need a media or URL
                   field the API does not accept on chapters yet. Supports go
                   in as link resources below each chapter. -->
              <input
                v-model.trim="chapterForm.title"
                class="app-input"
                required
                maxlength="180"
                placeholder="Titre de la leçon"
                aria-label="Titre de la leçon"
              />
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
          Documents acceptés : PDF, Word, Excel, PowerPoint ou texte, 20 Mo maximum. Les fichiers
          restent privés : seuls les apprenants inscrits y accèdent. Le dépôt de vidéos n'est pas
          encore disponible.
        </p>
      </div>

      <CourseAssessmentsEditor :course-key="courseKey" :editable="editable" />
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  FileText as FileTextIcon,
  Link as LinkIcon,
  ArrowLeft as ArrowLeftIcon,
} from '@lucide/vue'
import { toast } from 'vue-sonner'
import CourseStatusBadge from '../components/CourseStatusBadge.vue'
import StructureNodeTitle from '../components/StructureNodeTitle.vue'
import CourseAssessmentsEditor from '../components/CourseAssessmentsEditor.vue'
import {
  apiErrorMessage,
  canSubmit,
  courseLevelLabels,
  courseStatusLabels,
  isEditable,
  safeHttpUrl,
  DOCUMENT_ACCEPT,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MIMES,
  useAddDocumentResource,
  type CourseResourceItem,
  useCourseModules,
  useCreateChapter,
  useCreateModule,
  useCreateResource,
  useDeleteStructureNode,
  useReorderChapters,
  useReorderModules,
  useUpdateCourse,
  useUpdateStructureNode,
  useRevertCourseToDraft,
  useSubmitCourse,
  useTrainerCourse,
  type ChapterType,
  type CourseLevel,
  type CourseModule,
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
const updateNode = useUpdateStructureNode(courseKey)
const deleteNodeMutation = useDeleteStructureNode(courseKey)
const updateCourse = useUpdateCourse(courseKey)
const reorderModulesMutation = useReorderModules(courseKey)
const reorderChaptersMutation = useReorderChapters(courseKey)
const reorderBusy = computed(
  () => reorderModulesMutation.isPending.value || reorderChaptersMutation.isPending.value,
)
const nodeBusy = computed(
  () => updateNode.isPending.value || deleteNodeMutation.isPending.value || reorderBusy.value,
)

async function moveModuleUp(index: number) {
  const list = modules.data.value
  if (!list || index <= 0) return
  const newOrder = [...list]
  const temp = newOrder[index]!
  newOrder[index] = newOrder[index - 1]!
  newOrder[index - 1] = temp
  await run(
    () => reorderModulesMutation.mutateAsync(newOrder.map((m) => m.key)),
    'Modules réordonnés.',
  )
}

async function moveModuleDown(index: number) {
  const list = modules.data.value
  if (!list || index >= list.length - 1) return
  const newOrder = [...list]
  const temp = newOrder[index]!
  newOrder[index] = newOrder[index + 1]!
  newOrder[index + 1] = temp
  await run(
    () => reorderModulesMutation.mutateAsync(newOrder.map((m) => m.key)),
    'Modules réordonnés.',
  )
}

async function moveChapterUp(module: CourseModule, index: number) {
  const list = module.chapters
  if (!list || index <= 0) return
  const newOrder = [...list]
  const temp = newOrder[index]!
  newOrder[index] = newOrder[index - 1]!
  newOrder[index - 1] = temp
  await run(
    () =>
      reorderChaptersMutation.mutateAsync({
        moduleKey: module.key,
        chapterKeys: newOrder.map((c) => c.key),
      }),
    'Chapitres réordonnés.',
  )
}

async function moveChapterDown(module: CourseModule, index: number) {
  const list = module.chapters
  if (!list || index >= list.length - 1) return
  const newOrder = [...list]
  const temp = newOrder[index]!
  newOrder[index] = newOrder[index + 1]!
  newOrder[index + 1] = temp
  await run(
    () =>
      reorderChaptersMutation.mutateAsync({
        moduleKey: module.key,
        chapterKeys: newOrder.map((c) => c.key),
      }),
    'Chapitres réordonnés.',
  )
}

const ficheOpen = ref(false)
const fiche = reactive({
  title: '',
  level: 'beginner' as CourseLevel,
  summary: '',
  description: '',
})
function openFiche() {
  const current = course.data.value
  if (!current) return
  Object.assign(fiche, {
    title: current.title,
    level: current.level,
    summary: current.summary ?? '',
    description: current.description ?? '',
  })
  ficheOpen.value = true
}
async function saveFiche() {
  const ok = await run(
    () =>
      updateCourse.mutateAsync({
        title: fiche.title,
        level: fiche.level,
        summary: fiche.summary || null,
        description: fiche.description || null,
      }),
    'Fiche mise à jour.',
  )
  if (ok) ficheOpen.value = false
}

function renameNode(path: string, title: string) {
  void run(() => updateNode.mutateAsync({ path, title }), 'Titre mis à jour.')
}
function deleteNode(path: string, success: string) {
  void run(() => deleteNodeMutation.mutateAsync(path), success)
}
const addDocumentMutation = useAddDocumentResource(courseKey)

const documentTarget = ref<string | null>(null)
const documentForm = reactive<{ title: string; file: File | null }>({ title: '', file: null })

/** Signed media URL for documents, http(s)-only external URL for links. */
function resourceHref(resource: CourseResourceItem): string | null {
  return safeHttpUrl(resource.media?.url ?? resource.external_url)
}

const sizeFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })
function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${sizeFormatter.format(bytes / (1024 * 1024))} Mo`
    : `${sizeFormatter.format(Math.max(1, bytes / 1024))} Ko`
}

function openDocumentForm(chapterKey: string) {
  Object.assign(documentForm, { title: '', file: null })
  resourceTarget.value = null
  documentTarget.value = chapterKey
}

function pickDocument(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  documentForm.file = file
  if (file && !documentForm.title) {
    documentForm.title = file.name.replace(/\.[^.]+$/, '')
  }
}

async function addDocument(moduleKey: string, chapterKey: string) {
  const file = documentForm.file
  if (!file) return
  // Client-side checks mirror the backend rules for a faster answer; the
  // server still validates type and size on upload.
  if (file.type && !DOCUMENT_MIMES.includes(file.type)) {
    actionError.value = 'Format non accepté : PDF, Word, Excel, PowerPoint ou texte uniquement.'
    return
  }
  if (file.size > DOCUMENT_MAX_BYTES) {
    actionError.value = 'Le fichier dépasse 20 Mo.'
    return
  }
  const ok = await run(
    () =>
      addDocumentMutation.mutateAsync({ moduleKey, chapterKey, title: documentForm.title, file }),
    'Document déposé.',
  )
  if (ok) documentTarget.value = null
}

const editable = computed(() => (course.data.value ? isEditable(course.data.value.status) : false))
const actionError = ref('')

const moduleTitle = ref('')
const chapterTarget = ref<string | null>(null)
const chapterForm = reactive({ title: '', body: '' })
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
  Object.assign(chapterForm, { title: '', body: '' })
  chapterTarget.value = moduleKey
}

async function addChapter(moduleKey: string) {
  const ok = await run(
    () =>
      createChapter.mutateAsync({
        moduleKey,
        title: chapterForm.title,
        type: 'lesson',
        body: chapterForm.body.trim() || null,
      }),
    'Chapitre ajouté.',
  )
  if (ok) chapterTarget.value = null
}

function openResourceForm(chapterKey: string) {
  Object.assign(resourceForm, { title: '', url: '' })
  documentTarget.value = null
  resourceTarget.value = chapterKey
}

async function addResource(moduleKey: string, chapterKey: string) {
  const url = safeHttpUrl(resourceForm.url)
  if (url === null) {
    actionError.value = 'Le lien doit commencer par http:// ou https://.'
    return
  }
  const ok = await run(
    () =>
      createResource.mutateAsync({
        moduleKey,
        chapterKey,
        title: resourceForm.title,
        type: 'link',
        external_url: url,
      }),
    'Support ajouté.',
  )
  if (ok) resourceTarget.value = null
}
</script>
