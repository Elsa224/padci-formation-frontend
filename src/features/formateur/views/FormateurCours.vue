<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Mes cours et supports</h1>
        <p class="app-page-copy">
          Créez vos cours, structurez-les en modules et chapitres, puis soumettez-les à validation.
        </p>
      </div>
      <button class="app-action-primary" @click="openCreate">
        <PlusIcon :size="18" /> Nouveau cours
      </button>
    </header>

    <!-- Formulaire de création -->
    <form
      v-if="isCreateOpen"
      class="app-panel space-y-4"
      aria-labelledby="create-course-title"
      @submit.prevent="createCourse"
    >
      <h2 id="create-course-title" class="text-lg font-bold text-ink">Nouveau cours</h2>
      <div class="grid gap-4 md:grid-cols-2">
        <label class="text-sm font-semibold text-ink">
          Titre du cours
          <input
            v-model.trim="form.title"
            class="app-input mt-1"
            required
            maxlength="180"
            placeholder="Ex : Introduction au support informatique"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Filière
          <select v-model="form.pathway_key" class="app-input mt-1" required>
            <option value="" disabled>Choisir une filière</option>
            <option
              v-for="pathway in pathways.data.value ?? []"
              :key="pathway.key"
              :value="pathway.key"
            >
              {{ pathway.name }}
            </option>
          </select>
        </label>
        <label class="text-sm font-semibold text-ink">
          Niveau
          <select v-model="form.level" class="app-input mt-1">
            <option v-for="(label, value) in courseLevelLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </label>
        <label class="text-sm font-semibold text-ink md:col-span-2">
          Résumé
          <textarea
            v-model.trim="form.summary"
            class="app-input mt-1 min-h-20"
            maxlength="500"
            placeholder="Ce que l'apprenant saura faire à la fin du cours."
          />
        </label>
      </div>
      <p
        v-if="createError"
        class="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink"
        role="alert"
      >
        {{ createError }}
      </p>
      <div class="flex justify-end gap-3">
        <button type="button" class="app-action-secondary" @click="isCreateOpen = false">
          Annuler
        </button>
        <button type="submit" class="app-action-primary" :disabled="create.isPending.value">
          {{ create.isPending.value ? 'Création…' : 'Créer le brouillon' }}
        </button>
      </div>
    </form>

    <div class="app-panel space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <h2 class="text-lg font-bold text-ink">Mes cours</h2>
        <label class="text-sm font-semibold text-ink">
          Statut
          <select v-model="status" class="app-input mt-1">
            <option value="">Tous</option>
            <option v-for="(label, value) in courseStatusLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="courses.isPending.value" class="space-y-3">
        <div v-for="n in 3" :key="n" class="app-skeleton h-24" />
      </div>
      <div
        v-else-if="courses.isError.value"
        class="rounded-xl bg-danger-soft p-4 text-sm text-danger-ink"
        role="alert"
      >
        {{ apiErrorMessage(courses.error.value, 'Impossible de charger vos cours.') }}
        <button class="underline" @click="courses.refetch()">Réessayer</button>
      </div>
      <p
        v-else-if="!courses.data.value?.items.length"
        class="rounded-xl bg-canvas p-8 text-center text-sm text-quiet"
      >
        {{ status ? 'Aucun cours pour ce statut.' : "Vous n'avez pas encore créé de cours." }}
      </p>
      <div v-else class="grid gap-4 md:grid-cols-2">
        <article
          v-for="course in courses.data.value.items"
          :key="course.key"
          class="flex flex-col justify-between gap-4 rounded-xl border border-line p-5"
          data-test="course-card"
        >
          <div>
            <div class="flex items-start justify-between gap-3">
              <p class="text-xs font-semibold text-primary">
                {{ course.pathway?.name ?? 'Filière' }}
              </p>
              <CourseStatusBadge :status="course.status" />
            </div>
            <h3 class="mt-2 font-bold text-ink">{{ course.title }}</h3>
            <p v-if="course.summary" class="mt-1 line-clamp-2 text-sm text-quiet">
              {{ course.summary }}
            </p>
          </div>
          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <span class="text-xs text-quiet">Modifié le {{ formatDate(course.updated_at) }}</span>
            <div class="flex gap-2">
              <button
                v-if="canSubmit(course.status)"
                class="app-action-secondary"
                :disabled="submit.isPending.value"
                @click="submitCourse(course.key)"
              >
                Soumettre
              </button>
              <RouterLink :to="`/formateur/cours/${course.key}`" class="app-action-primary">
                {{ isEditable(course.status) ? 'Éditer' : 'Voir' }}
              </RouterLink>
            </div>
          </div>
          <p
            v-if="submitError?.key === course.key"
            class="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink"
            role="alert"
          >
            {{ submitError.message }}
          </p>
        </article>
      </div>

      <nav
        v-if="lastPage > 1"
        class="flex items-center justify-between gap-3 border-t border-line pt-4 text-sm"
        aria-label="Pagination des cours"
      >
        <button class="app-action-secondary" :disabled="page <= 1" @click="page--">
          Précédent
        </button>
        <span class="text-quiet" data-test="pagination-label">
          Page {{ page }} sur {{ lastPage }}
        </span>
        <button class="app-action-secondary" :disabled="page >= lastPage" @click="page++">
          Suivant
        </button>
      </nav>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus as PlusIcon } from '@lucide/vue'
import { toast } from 'vue-sonner'
import { useCatalogPathways } from '@/features/public/composables/useCatalogPathways'
import CourseStatusBadge from '../components/CourseStatusBadge.vue'
import {
  apiErrorMessage,
  canSubmit,
  courseLevelLabels,
  courseStatusLabels,
  isEditable,
  useCreateCourse,
  useSubmitCourse,
  useTrainerCourses,
  type CourseLevel,
  type CourseStatus,
} from '../composables/useTrainerCourses'

const router = useRouter()
const route = useRoute()
// ?statut=… depuis le tableau de bord (ex. cours rejetés à reprendre).
const status = ref<CourseStatus | ''>((route.query.statut as CourseStatus | undefined) ?? '')
const page = ref(1)
watch(status, () => {
  page.value = 1
})
const courses = useTrainerCourses(computed(() => ({ status: status.value, page: page.value })))
const lastPage = computed(() => courses.data.value?.pagination?.last_page ?? 1)
const pathways = useCatalogPathways()
const create = useCreateCourse()
const submit = useSubmitCourse()

const isCreateOpen = ref(false)
const createError = ref('')
const submitError = ref<{ key: string; message: string } | null>(null)
const form = reactive({
  title: '',
  pathway_key: '',
  level: 'beginner' as CourseLevel,
  summary: '',
})

function openCreate() {
  isCreateOpen.value = true
  createError.value = ''
}

async function createCourse() {
  createError.value = ''
  try {
    const course = await create.mutateAsync({
      title: form.title,
      pathway_key: form.pathway_key,
      level: form.level,
      summary: form.summary || null,
      language: 'fr',
    })
    Object.assign(form, { title: '', pathway_key: '', level: 'beginner', summary: '' })
    isCreateOpen.value = false
    toast.success('Brouillon créé. Ajoutez maintenant vos modules et chapitres.')
    await router.push(`/formateur/cours/${course.key}`)
  } catch (error) {
    createError.value = apiErrorMessage(error, 'Impossible de créer le cours.')
  }
}

async function submitCourse(courseKey: string) {
  submitError.value = null
  try {
    const course = await submit.mutateAsync(courseKey)
    toast.success(course.status === 'published' ? 'Cours publié.' : 'Cours soumis à la validation.')
  } catch (error) {
    submitError.value = {
      key: courseKey,
      message: apiErrorMessage(error, 'Impossible de soumettre le cours.'),
    }
  }
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' })
function formatDate(date: string) {
  return dateFormatter.format(new Date(date))
}
</script>
