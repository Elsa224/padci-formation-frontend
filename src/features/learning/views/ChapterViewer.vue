<template>
  <div class="app-page">
    <!-- NAVIGATION RETOUR -->
    <div class="flex items-center justify-between border-b border-line pb-4">
      <router-link
        :to="`/formations/${courseKey}`"
        class="inline-flex items-center gap-2 text-xs font-semibold text-quiet hover:text-primary transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Retour au plan du cours
      </router-link>

      <div v-if="courseOutline" class="text-xs text-quiet font-medium">
        {{ courseOutline.title }}
      </div>
    </div>

    <!-- ÉTAT DE CHARGEMENT / ERREUR -->
    <div v-if="isPending" class="text-center py-16 text-quiet">Chargement du chapitre…</div>
    <div v-else-if="isError" class="text-center py-16 text-danger-ink">
      {{ (error as ApiError)?.message ?? 'Impossible de charger ce chapitre.' }}
    </div>

    <template v-else-if="chapter">
      <!-- CORPS DU CHAPITRE -->
      <article class="app-panel space-y-6 sm:p-10">
        <div class="space-y-2 border-b border-line pb-5">
          <div class="flex items-center gap-2">
            <span class="app-chip app-chip-leaf">{{ chapterTypeLabel(chapter.type) }}</span>
            <span v-if="chapter.duration_seconds" class="text-sm text-quiet">
              {{ Math.round(chapter.duration_seconds / 60) }} min de lecture
            </span>
          </div>
          <h1 class="app-page-title max-w-[30ch]">{{ chapter.title }}</h1>
        </div>

        <!-- CONTENU DU CHAPITRE -->
        <div>
          <!-- renderMarkdown escapes all HTML first: only its own tags are emitted -->
          <div v-if="chapter.body" class="app-prose" v-html="renderMarkdown(chapter.body)" />
          <div v-else class="text-quiet italic py-8 text-center bg-canvas rounded-xl">
            Aucun texte supplémentaire pour cette ressource.
          </div>
        </div>

        <!-- RESSOURCES COMPLÉMENTAIRES -->
        <div v-if="chapter.resources.length > 0" class="pt-6 border-t border-line space-y-3">
          <h3 class="text-sm font-bold text-ink">Supports et ressources associées</h3>
          <div class="grid gap-2">
            <div
              v-for="res in chapter.resources"
              :key="res.key"
              class="border rounded-xl p-3 text-xs transition"
              :class="res.locked ? 'bg-canvas text-quiet' : 'bg-white text-ink'"
              data-test="chapter-resource"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex min-w-0 items-center gap-2">
                  <LinkIcon v-if="res.type === 'link'" :size="16" class="shrink-0 text-quiet" />
                  <FileTextIcon v-else :size="16" class="shrink-0 text-quiet" />
                  <span class="font-medium">{{ res.title }}</span>
                  <span v-if="res.media" class="truncate text-quiet">
                    · {{ res.media.original_name }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span v-if="res.locked" class="italic">Verrouillé</span>
                  <template v-else-if="res.media">
                    <span v-if="!res.media.url" class="italic text-quiet">
                      Document en cours de vérification
                    </span>
                    <template v-else>
                      <button
                        v-if="isPdf(res)"
                        class="font-semibold text-primary hover:underline"
                        data-test="toggle-pdf"
                        @click="togglePdf(res.key)"
                      >
                        {{ openPdfKey === res.key ? 'Masquer' : 'Afficher' }}
                      </button>
                      <button
                        class="font-semibold text-primary hover:underline"
                        @click="openDocument(res.key)"
                      >
                        Ouvrir dans un onglet
                      </button>
                    </template>
                  </template>
                  <a
                    v-else-if="safeHttpUrl(res.external_url)"
                    :href="safeHttpUrl(res.external_url) ?? undefined"
                    target="_blank"
                    rel="noopener"
                    class="font-semibold text-primary hover:underline"
                  >
                    Ouvrir &rarr;
                  </a>
                </div>
              </div>
              <!-- Lecteur PDF intégré : URL signée, valable quelques minutes -->
              <iframe
                v-if="openPdfKey === res.key && pdfUrl"
                :src="pdfUrl"
                :title="res.title"
                class="mt-3 h-[70vh] w-full rounded-lg border border-line"
                data-test="pdf-viewer"
              />
            </div>
          </div>
        </div>
      </article>

      <!-- PIED DE NAVIGATION & PROGRESSION -->
      <div class="app-panel flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <router-link
            v-if="prevChapter"
            :to="`/formations/${courseKey}/chapitres/${prevChapter.key}`"
            class="px-4 py-2 bg-canvas text-ink rounded-xl text-xs font-semibold hover:bg-line transition"
          >
            &larr; Chapitre précédent
          </router-link>
        </div>

        <div class="flex items-center gap-3">
          <button
            @click="markCompleteAndNext"
            :disabled="progressMutation.isPending.value"
            class="app-action-primary"
          >
            {{
              progressMutation.isPending.value
                ? 'Enregistrement…'
                : 'Marquer comme terminé & suivant ✓'
            }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { FileText as FileTextIcon, Link as LinkIcon } from '@lucide/vue'
import type { ApiError } from '@/api/http'
import { safeHttpUrl } from '@/lib/safeUrl'
import { renderMarkdown } from '@/lib/markdown'
import {
  useChapterContent,
  useCourseOutline,
  useRecordProgress,
  type ChapterResource,
  type OutlineChapter,
} from '../composables/useLearningCourse'

function chapterTypeLabel(type: string): string {
  return (
    { lesson: 'Leçon', video: 'Vidéo', document: 'Document', external_link: 'Lien externe' }[
      type
    ] ?? type
  )
}

const route = useRoute()
const router = useRouter()

const courseKey = computed(() => String(route.params.courseKey ?? ''))
const chapterKey = computed(() => String(route.params.chapterKey ?? ''))

const { data: courseOutline } = useCourseOutline(courseKey)
const {
  data: chapter,
  isPending,
  isError,
  error,
  refetch: refetchChapter,
} = useChapterContent(courseKey, chapterKey)

// ── Documents ───────────────────────────────────────────────────────────
// Media URLs are signed and expire after a few minutes, so each open asks
// the API for a fresh one instead of reusing the URL from page load.
const openPdfKey = ref<string | null>(null)
const pdfUrl = ref<string | null>(null)
watch(chapterKey, () => {
  openPdfKey.value = null
  pdfUrl.value = null
})

function isPdf(resource: ChapterResource): boolean {
  return resource.media?.mime === 'application/pdf'
}

async function freshMediaUrl(resourceKey: string): Promise<string | null> {
  const { data } = await refetchChapter()
  const media = data?.resources.find((r) => r.key === resourceKey)?.media
  return safeHttpUrl(media?.url)
}

async function togglePdf(resourceKey: string) {
  if (openPdfKey.value === resourceKey) {
    openPdfKey.value = null
    pdfUrl.value = null
    return
  }
  pdfUrl.value = await freshMediaUrl(resourceKey)
  openPdfKey.value = pdfUrl.value ? resourceKey : null
}

async function openDocument(resourceKey: string) {
  // Open synchronously within the click so popup blockers allow it, then
  // point it at the fresh signed URL.
  const tab = window.open('', '_blank')
  const url = await freshMediaUrl(resourceKey)
  if (!tab) return
  if (url === null) {
    tab.close()
    return
  }
  tab.opener = null
  tab.location.href = url
}

// Flatten chapters from outline to find next and previous
const allChapters = computed<OutlineChapter[]>(() => {
  if (!courseOutline.value) return []
  return courseOutline.value.modules.flatMap((m) => m.chapters)
})

const currentIndex = computed(() => allChapters.value.findIndex((c) => c.key === chapterKey.value))

const prevChapter = computed(() => {
  if (currentIndex.value > 0) {
    return allChapters.value[currentIndex.value - 1]
  }
  return null
})

const nextChapter = computed(() => {
  if (currentIndex.value >= 0 && currentIndex.value < allChapters.value.length - 1) {
    return allChapters.value[currentIndex.value + 1]
  }
  return null
})

const progressMutation = useRecordProgress()

function markCompleteAndNext() {
  progressMutation.mutate(
    {
      courseKey: courseKey.value,
      chapterKey: chapterKey.value,
      position_seconds: 0,
      completed: true,
    },
    {
      onSuccess: () => {
        if (nextChapter.value && !nextChapter.value.locked) {
          router.push(`/formations/${courseKey.value}/chapitres/${nextChapter.value.key}`)
        } else {
          router.push(`/formations/${courseKey.value}`)
        }
      },
    },
  )
}
</script>
