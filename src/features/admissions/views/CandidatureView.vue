<template>
  <section class="app-page" aria-label="Déposer une candidature">
    <!-- RETOUR -->
    <div>
      <router-link
        :to="pathwayKey ? `/catalogue/${pathwayKey}` : '/catalogue'"
        class="inline-flex items-center gap-2 text-sm font-semibold text-quiet transition hover:text-primary"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Retour au détail de la formation
      </router-link>
    </div>

    <!-- SUCCÈS -->
    <div v-if="isSuccess" class="app-panel space-y-4 border-primary/30 p-8 text-center sm:p-10">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <svg class="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 class="text-2xl font-bold text-ink">Candidature enregistrée</h2>
      <p class="mx-auto max-w-md text-sm leading-6 text-quiet">
        Votre dossier pour
        <strong v-if="selectedCohort" class="text-ink">la session {{ selectedCohort.name }}</strong>
        <strong v-else class="text-ink">la filière {{ pathway?.name }}</strong>
        a été transmis à l'équipe pédagogique. Vous pouvez suivre son statut en temps réel.
      </p>
      <div class="pt-4 flex flex-col sm:flex-row justify-center gap-3">
        <router-link to="/mes-candidatures" class="app-action-primary justify-center">
          Voir mes candidatures
        </router-link>
        <router-link to="/catalogue" class="app-action-secondary justify-center">
          Retour au catalogue
        </router-link>
      </div>
    </div>

    <!-- FORMULAIRE DE CANDIDATURE (3 ÉTAPES) -->
    <div v-else class="app-panel overflow-hidden p-0">
      <!-- INDICATEUR D'ÉTAPES -->
      <div
        class="flex items-center justify-between border-b border-line bg-canvas px-4 py-4 sm:px-6"
      >
        <div class="flex items-center gap-2">
          <span
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            :class="currentStep === 1 ? 'bg-primary text-white' : 'bg-line text-quiet'"
          >
            1
          </span>
          <span
            class="text-xs sm:text-sm font-medium"
            :class="currentStep === 1 ? 'text-primary font-bold' : 'text-quiet'"
          >
            Session &amp; Motivation
          </span>
        </div>
        <div class="hidden h-px w-8 bg-line sm:block"></div>
        <div class="flex items-center gap-2">
          <span
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            :class="currentStep === 2 ? 'bg-primary text-white' : 'bg-line text-quiet'"
          >
            2
          </span>
          <span
            class="text-xs sm:text-sm font-medium"
            :class="currentStep === 2 ? 'text-primary font-bold' : 'text-quiet'"
          >
            Équipement
          </span>
        </div>
        <div class="hidden h-px w-8 bg-line sm:block"></div>
        <div class="flex items-center gap-2">
          <span
            class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            :class="currentStep === 3 ? 'bg-primary text-white' : 'bg-line text-quiet'"
          >
            3
          </span>
          <span
            class="text-xs sm:text-sm font-medium"
            :class="currentStep === 3 ? 'text-primary font-bold' : 'text-quiet'"
          >
            Confirmation
          </span>
        </div>
      </div>

      <div class="space-y-6 p-6 sm:p-8">
        <!-- ÉTAPE 1 : SESSION ET MOTIVATION -->
        <div v-if="currentStep === 1" class="space-y-6">
          <div>
            <h2 class="text-xl font-bold text-ink">Votre filière &amp; session de formation</h2>
            <p class="mt-1 text-xs text-quiet sm:text-sm">
              Choisissez votre session ou postulez directement à la filière.
            </p>
          </div>

          <div class="space-y-3 rounded-xl border border-primary/20 bg-primary/[0.035] p-4">
            <span class="text-xs font-bold uppercase text-primary tracking-wide">{{
              pathway?.code
            }}</span>
            <h3 class="text-base font-bold text-ink">{{ pathway?.name }}</h3>
            <p v-if="pathway?.description" class="text-xs text-quiet">
              {{ pathway.description }}
            </p>

            <!-- ATTRIBUTION AUTOMATIQUE DE SESSION -->
            <div
              class="mt-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5 text-xs text-primary"
            >
              <p class="font-bold flex items-center gap-1.5">
                <span class="inline-block h-2 w-2 rounded-full bg-primary"></span>
                Attribution automatique de votre session
              </p>
              <p class="mt-1 text-quiet leading-relaxed text-[11px]">
                Votre candidature est enregistrée pour ce parcours. Le système se charge de vous
                attribuer automatiquement une place dans la première session ouverte dès validation
                de votre dossier.
              </p>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block text-sm font-semibold text-ink">
              Lettre ou texte de motivation
              <span class="font-normal text-quiet">(optionnel)</span>
            </label>
            <textarea
              v-model="motivation"
              rows="5"
              placeholder="Expliquez votre parcours, vos objectifs professionnels et pourquoi vous souhaitez suivre cette formation..."
              class="app-input min-h-32 resize-y p-3.5"
            ></textarea>
          </div>

          <div class="flex justify-end pt-4">
            <button
              @click="nextToStep2"
              :disabled="!pathwayKey"
              class="app-action-primary disabled:opacity-50"
            >
              Continuer vers l'équipement &rarr;
            </button>
          </div>
        </div>

        <!-- ÉTAPE 2 : ÉQUIPEMENT INFORMATIQUE & JUSTIFICATIF -->
        <div v-if="currentStep === 2" class="space-y-6">
          <div>
            <h2 class="text-xl font-bold text-ink">Équipement informatique requis</h2>
            <p class="mt-1 text-xs text-quiet sm:text-sm">
              Les travaux pratiques exigent un matériel compatible avec les outils du programme.
            </p>
          </div>

          <!-- RAPPEL PRÉREQUIS FILIÈRE -->
          <div
            v-if="pathway?.equipment_requirements"
            class="space-y-1 rounded-xl border border-line bg-canvas p-4 text-xs text-quiet"
          >
            <p class="font-bold text-ink">Spécifications recommandées pour {{ pathway.name }} :</p>
            <p>
              Processeur : {{ pathway.equipment_requirements.min_cpu || 'Non spécifié' }} · RAM :
              {{
                pathway.equipment_requirements.min_ram_gb
                  ? pathway.equipment_requirements.min_ram_gb + ' Go'
                  : '4 Go'
              }}
              · Stockage :
              {{
                pathway.equipment_requirements.min_storage_gb
                  ? pathway.equipment_requirements.min_storage_gb + ' Go'
                  : '128 Go'
              }}
            </p>
          </div>

          <div class="space-y-4">
            <p
              v-if="submitError"
              class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger-ink"
              role="alert"
            >
              {{ submitError }}
            </p>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-ink">
                Disposez-vous d'un ordinateur pour suivre la formation ? *
              </label>
              <div class="flex gap-4">
                <label class="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    :value="true"
                    v-model="hasComputer"
                    class="text-primary focus:ring-primary"
                  />
                  Oui
                </label>
                <label class="flex cursor-pointer items-center gap-2 text-sm text-ink">
                  <input
                    type="radio"
                    :value="false"
                    v-model="hasComputer"
                    class="text-primary focus:ring-primary"
                  />
                  Non
                </label>
              </div>
            </div>

            <template v-if="hasComputer">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div class="space-y-1">
                  <label class="block text-xs font-semibold text-ink">Processeur (CPU) *</label>
                  <input
                    v-model="cpu"
                    type="text"
                    placeholder="Ex: Core i5, Ryzen 5, Apple M1"
                    class="app-input"
                  />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs font-semibold text-ink">RAM (en Go) *</label>
                  <input
                    v-model.number="ramGb"
                    type="number"
                    min="1"
                    placeholder="Ex: 8 ou 16"
                    class="app-input"
                  />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs font-semibold text-ink"
                    >Stockage total (en Go) *</label
                  >
                  <input
                    v-model.number="storageGb"
                    type="number"
                    min="1"
                    placeholder="Ex: 256 ou 512"
                    class="app-input"
                  />
                </div>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="space-y-1">
                  <label class="block text-xs font-semibold text-ink" for="device-type"
                    >Type d’appareil</label
                  >
                  <select id="device-type" v-model="deviceType" class="app-input">
                    <option value="laptop">Ordinateur portable</option>
                    <option value="desktop">Ordinateur de bureau</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="block text-xs font-semibold text-ink" for="os-name"
                    >Système d’exploitation *</label
                  >
                  <input
                    id="os-name"
                    v-model="osName"
                    type="text"
                    placeholder="Windows 11, Ubuntu 24.04, macOS..."
                    class="app-input"
                  />
                </div>
                <div class="space-y-1">
                  <label class="block text-xs font-semibold text-ink" for="storage-free"
                    >Espace libre (Go)</label
                  >
                  <input
                    id="storage-free"
                    v-model.number="storageFreeGb"
                    type="number"
                    min="0"
                    placeholder="Ex. 180"
                    class="app-input"
                  />
                </div>
              </div>
              <label
                class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5 text-xs text-ink"
              >
                <input
                  v-model="virtualizationSupported"
                  type="checkbox"
                  class="rounded border-line text-primary focus:ring-primary"
                />
                La virtualisation est disponible sur cet appareil
              </label>

              <!-- ZONE DE TÉLÉVERSEMENT DU JUSTIFICATIF MATÉRIEL -->
              <div class="space-y-2 pt-2">
                <div class="flex items-center justify-between">
                  <label class="block text-sm font-semibold text-ink">
                    Justificatif matériel
                    <span
                      v-if="pathway?.requires_equipment_validation"
                      class="text-xs text-danger-ink font-bold"
                    >
                      * (obligatoire pour cette filière)
                    </span>
                    <span v-else class="text-xs font-normal text-quiet">(optionnel)</span>
                  </label>
                  <span class="text-[11px] text-quiet">
                    Formats acceptés : JPG, PNG, WEBP, PDF (max 15 Mo)
                  </span>
                </div>

                <input
                  ref="fileInputRef"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  class="hidden"
                  @change="handleFileInputChange"
                />

                <!-- DROPZONE (QUAND AUCUN FICHIER TÉLÉVERSÉ) -->
                <div
                  v-if="!proofMediaKey && !isUploadingProof"
                  data-testid="proof-upload-dropzone"
                  class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 sm:p-8 text-center transition cursor-pointer"
                  :class="
                    isDragging
                      ? 'border-primary bg-primary/[0.06] scale-[1.01]'
                      : 'border-line bg-canvas hover:border-primary/50 hover:bg-canvas/80'
                  "
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                  @click="triggerFileInput"
                >
                  <div
                    class="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3"
                  >
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p class="text-sm font-semibold text-ink">
                    Glissez-déposez votre capture d'écran ou justificatif ici, ou
                    <span class="text-primary underline">parcourez vos fichiers</span>
                  </p>
                  <p class="text-xs text-quiet mt-1.5 max-w-md">
                    Capture d'écran des spécifications système (Paramètres &gt; Système sous
                    Windows, À propos de ce Mac sous macOS, ou lshw / néofetch sous Linux).
                  </p>
                </div>

                <!-- EN COURS DE TÉLÉVERSEMENT -->
                <div
                  v-else-if="isUploadingProof"
                  class="flex flex-col items-center justify-center rounded-xl border border-primary/20 bg-primary/[0.02] p-8 text-center"
                >
                  <div
                    class="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3"
                  ></div>
                  <p class="text-sm font-semibold text-ink">
                    Téléversement du justificatif en cours…
                  </p>
                  <p class="text-xs text-quiet mt-1">
                    Vérification de sécurité et stockage sécurisé
                  </p>
                </div>

                <!-- PRÉVISUALISATION DU FICHIER ENREGISTRÉ -->
                <div
                  v-else-if="proofMediaKey"
                  data-testid="proof-preview"
                  class="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-primary/30 bg-primary/[0.03] p-4 transition"
                >
                  <div class="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    <!-- Thumbnail preview if image -->
                    <div
                      v-if="proofPreviewUrl"
                      class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-line bg-canvas"
                    >
                      <img
                        :src="proofPreviewUrl"
                        :alt="proofFileName"
                        class="h-full w-full object-cover"
                      />
                    </div>
                    <!-- PDF / Doc icon -->
                    <div
                      v-else
                      class="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg border border-line bg-red-50 text-red-600"
                    >
                      <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    <div class="min-w-0">
                      <p class="truncate text-sm font-bold text-ink">{{ proofFileName }}</p>
                      <p class="text-xs text-quiet">
                        {{ formatFileSize(proofFileSize) }} · Justificatif enregistré
                      </p>
                      <span
                        class="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-0.5"
                      >
                        <svg
                          class="h-3.5 w-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Prêt pour l'envoi
                      </span>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      data-testid="replace-proof-btn"
                      @click="replaceProof"
                      class="app-action-secondary text-xs px-3 py-1.5"
                    >
                      Remplacer
                    </button>
                    <button
                      type="button"
                      data-testid="remove-proof-btn"
                      @click="removeProof"
                      class="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-danger-ink hover:bg-red-100 transition"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>

                <p v-if="uploadError" class="text-xs text-danger-ink font-medium mt-1">
                  {{ uploadError }}
                </p>
              </div>
            </template>

            <div v-else class="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">
              Votre candidature peut être déposée sans équipement personnel. L'équipe admissions
              vous indiquera les modalités de la session si elle est retenue.
            </div>
          </div>

          <div class="flex justify-between pt-4">
            <button @click="currentStep = 1" class="app-action-secondary">&larr; Retour</button>
            <button @click="nextToStep3" class="app-action-primary">
              Vérifier et soumettre &rarr;
            </button>
          </div>
        </div>

        <!-- ÉTAPE 3 : CONFIRMATION & SOUMISSION -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div>
            <h2 class="text-xl font-bold text-ink">Récapitulatif de votre candidature</h2>
            <p class="mt-1 text-xs text-quiet sm:text-sm">
              Relisez attentivement ces informations avant de confirmer l'envoi.
            </p>
          </div>

          <div class="divide-y divide-line overflow-hidden rounded-xl border border-line text-sm">
            <div class="flex justify-between bg-canvas p-4">
              <span class="text-quiet">Filière</span>
              <span class="font-bold text-ink">{{ pathway?.name }}</span>
            </div>
            <div class="flex justify-between p-4">
              <span class="text-quiet">Session</span>
              <span class="font-semibold text-primary">
                Attribution automatique par le système
              </span>
            </div>
            <div class="flex justify-between p-4">
              <span class="text-quiet">Possède un ordinateur</span>
              <span class="font-medium text-ink">{{ hasComputer ? 'Oui' : 'Non' }}</span>
            </div>
            <div v-if="hasComputer" class="flex justify-between bg-canvas p-4">
              <span class="text-quiet">Spécifications déclarées</span>
              <span class="text-ink font-medium"
                >{{ cpu || 'CPU non précisé' }} · {{ ramGb }} Go RAM · {{ storageGb }} Go</span
              >
            </div>
            <div v-if="hasComputer" class="flex justify-between gap-4 p-4">
              <span class="text-quiet">Environnement</span>
              <span class="text-right text-ink font-medium"
                >{{ deviceType === 'laptop' ? 'Portable' : 'Bureau' }} ·
                {{ osName || 'Non précisé' }}</span
              >
            </div>
            <div v-if="hasComputer" class="flex justify-between bg-canvas p-4">
              <span class="text-quiet">Justificatif matériel</span>
              <span
                v-if="proofMediaKey"
                class="text-ink font-medium inline-flex items-center gap-1.5"
              >
                <svg
                  class="h-4 w-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {{ proofFileName || 'Justificatif joint' }}
              </span>
              <span v-else class="text-quiet italic">Aucun justificatif fourni</span>
            </div>
            <div v-if="motivation" class="p-4 space-y-1">
              <span class="text-quiet block text-xs">Motivation</span>
              <p class="text-ink text-xs italic whitespace-pre-wrap">{{ motivation }}</p>
            </div>
          </div>

          <p
            v-if="submitError"
            class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger-ink"
          >
            {{ submitError }}
          </p>

          <div class="flex justify-between pt-4">
            <button @click="currentStep = 2" class="app-action-secondary">&larr; Retour</button>
            <button
              @click="submit"
              :disabled="submitMutation.isPending.value"
              class="app-action-primary disabled:opacity-50"
            >
              {{
                submitMutation.isPending.value
                  ? 'Envoi en cours…'
                  : 'Confirmer et envoyer la candidature'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, onScopeDispose } from 'vue'
import { useRoute } from 'vue-router'
import type { ApiError } from '@/api/http'
import { usePathway, usePathwayCohorts } from '@/features/catalog/composables/useCatalog'
import { useSubmitApplication, useUploadMedia } from '../composables/useCandidature'

const route = useRoute()
const pathwayKey = computed(() => String(route.query.pathway ?? ''))
const initialCohortKey = String(route.query.cohort ?? '')

const { data: pathway } = usePathway(pathwayKey)
const { data: cohortsData } = usePathwayCohorts(pathwayKey)
const cohorts = computed(() => cohortsData.value ?? [])

const chosenCohortKey = ref(initialCohortKey)
const selectedCohort = computed(() => cohorts.value.find((c) => c.key === chosenCohortKey.value))

const currentStep = ref(1)
const motivation = ref('')
const hasComputer = ref(true)
const cpu = ref('Core i5')
const ramGb = ref(8)
const storageGb = ref(256)
const storageFreeGb = ref<number | undefined>()
const deviceType = ref<'laptop' | 'desktop'>('laptop')
const osName = ref('Windows 11')
const virtualizationSupported = ref(false)

// Justificatif matériel
const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isUploadingProof = ref(false)
const uploadError = ref<string | null>(null)
const proofMediaKey = ref('')
const proofFileName = ref('')
const proofFileSize = ref(0)
const proofFileType = ref('')
const proofPreviewUrl = ref('')

const submitError = ref<string | null>(null)
const isSuccess = ref(false)
const submitMutation = useSubmitApplication()
const uploadMutation = useUploadMedia()

function nextToStep2() {
  if (pathwayKey.value) {
    currentStep.value = 2
  }
}

function nextToStep3() {
  if (pathway.value?.requires_equipment_validation && !hasComputer.value) {
    submitError.value =
      'Cette filière exige un ordinateur à faire valider. Indiquez votre équipement pour continuer.'
    return
  }
  if (
    hasComputer.value &&
    (!cpu.value.trim() || !ramGb.value || !storageGb.value || !osName.value.trim())
  ) {
    submitError.value = 'Complétez le processeur, la RAM, le stockage et le système d’exploitation.'
    return
  }
  if (pathway.value?.requires_equipment_validation && !proofMediaKey.value) {
    submitError.value =
      'Un justificatif matériel (capture d’écran ou photo des spécifications système) est obligatoire pour cette filière.'
    return
  }
  submitError.value = null
  currentStep.value = 3
}

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFileInputChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (file) {
    processFile(file)
  }
}

function handleDrop(event: DragEvent) {
  isDragging.value = false
  const file = event.dataTransfer?.files?.[0]
  if (file) {
    processFile(file)
  }
}

async function processFile(file: File) {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf']
  const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
  const isAllowedExt = allowedExtensions.includes(fileExt)

  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/x-pdf',
  ]
  const isAllowedMime = file.type ? allowedMimes.includes(file.type) : isAllowedExt

  if (!isAllowedExt || !isAllowedMime) {
    uploadError.value = 'Format non supporté. Veuillez choisir un fichier JPG, PNG, WEBP ou PDF.'
    return
  }

  const maxBytes = 15 * 1024 * 1024 // 15 Mo
  if (file.size > maxBytes) {
    uploadError.value = 'Le fichier est trop volumineux. La taille maximale autorisée est de 15 Mo.'
    return
  }

  try {
    isUploadingProof.value = true
    uploadError.value = null
    const response = await uploadMutation.mutateAsync(file)

    // Revoke previous preview URL if present before assigning new one
    if (proofPreviewUrl.value && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      URL.revokeObjectURL(proofPreviewUrl.value)
      proofPreviewUrl.value = ''
    }

    proofMediaKey.value = response.key
    proofFileName.value = file.name
    proofFileSize.value = file.size
    proofFileType.value = file.type || response.mime_detected || ''

    if (file.type.startsWith('image/') && typeof URL !== 'undefined' && URL.createObjectURL) {
      proofPreviewUrl.value = URL.createObjectURL(file)
    } else {
      proofPreviewUrl.value = ''
    }
  } catch (err) {
    uploadError.value =
      (err as ApiError)?.displayMessage ||
      'Échec du téléversement du justificatif. Veuillez vérifier votre connexion et réessayer.'
  } finally {
    isUploadingProof.value = false
  }
}

function replaceProof() {
  triggerFileInput()
}

function removeProof() {
  proofMediaKey.value = ''
  proofFileName.value = ''
  proofFileSize.value = 0
  proofFileType.value = ''
  if (proofPreviewUrl.value) {
    if (typeof URL !== 'undefined' && URL.revokeObjectURL) {
      URL.revokeObjectURL(proofPreviewUrl.value)
    }
    proofPreviewUrl.value = ''
  }
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

onScopeDispose(() => {
  if (proofPreviewUrl.value && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    URL.revokeObjectURL(proofPreviewUrl.value)
  }
})

function submit() {
  if (!pathwayKey.value) return
  if (pathway.value?.requires_equipment_validation && !proofMediaKey.value) {
    submitError.value =
      'Un justificatif matériel (capture d’écran ou photo des spécifications système) est obligatoire pour cette filière.'
    return
  }
  submitError.value = null

  submitMutation.mutate(
    {
      pathway_key: pathwayKey.value,
      cohort_key: undefined,
      motivation: motivation.value.trim() || undefined,
      proof_media_key: proofMediaKey.value || undefined,
      equipment: hasComputer.value
        ? {
            device_type: deviceType.value,
            cpu_model: cpu.value.trim(),
            cpu: cpu.value.trim(),
            ram_gb: Number(ramGb.value),
            storage_total_gb: Number(storageGb.value),
            storage_gb: Number(storageGb.value),
            storage_free_gb: storageFreeGb.value ? Number(storageFreeGb.value) : undefined,
            os_name: osName.value.trim(),
            os: osName.value.trim(),
            virtualization_supported: virtualizationSupported.value,
          }
        : undefined,
    },
    {
      onSuccess: () => {
        isSuccess.value = true
      },
      onError: (err) => {
        submitError.value = (err as ApiError).displayMessage
      },
    },
  )
}
</script>
