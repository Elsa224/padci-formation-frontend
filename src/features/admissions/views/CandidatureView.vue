<template>
  <section class="app-page max-w-4xl" aria-label="Déposer une candidature">
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
      <div
        v-if="isSuccess"
        class="app-panel space-y-4 border-primary/30 p-8 text-center sm:p-10"
      >
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
          Votre dossier pour la session
          <strong class="text-ink">{{ selectedCohort?.name }}</strong> a été transmis à
          l'équipe pédagogique. Vous pouvez suivre son statut en temps réel.
        </p>
        <div class="pt-4 flex flex-col sm:flex-row justify-center gap-3">
          <router-link
            to="/mes-candidatures"
            class="app-action-primary justify-center"
          >
            Voir mes candidatures
          </router-link>
          <router-link
            to="/catalogue"
            class="app-action-secondary justify-center"
          >
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
              <h2 class="text-xl font-bold text-ink">Votre session de formation</h2>
              <p class="mt-1 text-xs text-quiet sm:text-sm">
                Vérifiez la session choisie et exprimez brièvement vos motivations.
              </p>
            </div>

            <div class="space-y-2 rounded-xl border border-primary/20 bg-primary/[0.035] p-4">
              <span class="text-xs font-bold uppercase text-primary tracking-wide">{{
                pathway?.code
              }}</span>
              <h3 class="text-base font-bold text-ink">{{ pathway?.name }}</h3>
              <p v-if="selectedCohort" class="text-xs text-quiet">
                Session : <strong class="text-ink">{{ selectedCohort.name }}</strong> (du
                {{ selectedCohort.starts_at }} au {{ selectedCohort.ends_at }})
              </p>
              <p v-else class="text-xs text-amber-700">Aucune session valide n'a été spécifiée.</p>
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
                :disabled="!selectedCohort"
                class="app-action-primary disabled:opacity-50"
              >
                Continuer vers l'équipement &rarr;
              </button>
            </div>
          </div>

          <!-- ÉTAPE 2 : ÉQUIPEMENT INFORMATIQUE -->
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
              <p class="font-bold text-ink">
                Spécifications recommandées pour {{ pathway.name }} :
              </p>
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
                    <label class="block text-xs font-semibold text-ink"
                      >Processeur (CPU)</label
                    >
                    <input
                      v-model="cpu"
                      type="text"
                      placeholder="Ex: Core i5, Ryzen 5, M1"
                      class="app-input"
                    />
                  </div>
                  <div class="space-y-1">
                    <label class="block text-xs font-semibold text-ink">RAM (en Go)</label>
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
                      >Stockage (en Go)</label
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
                    <label class="block text-xs font-semibold text-ink" for="device-type">Type d’appareil</label>
                    <select id="device-type" v-model="deviceType" class="app-input">
                      <option value="laptop">Ordinateur portable</option>
                      <option value="desktop">Ordinateur de bureau</option>
                    </select>
                  </div>
                  <div class="space-y-1">
                    <label class="block text-xs font-semibold text-ink" for="os-name">Système d’exploitation</label>
                    <input id="os-name" v-model="osName" type="text" placeholder="Windows, Ubuntu…" class="app-input" />
                  </div>
                  <div class="space-y-1">
                    <label class="block text-xs font-semibold text-ink" for="storage-free">Espace libre (Go)</label>
                    <input id="storage-free" v-model.number="storageFreeGb" type="number" min="0" placeholder="Ex. 180" class="app-input" />
                  </div>
                </div>
                <label class="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2.5 text-xs text-ink">
                  <input v-model="virtualizationSupported" type="checkbox" class="rounded border-line text-primary focus:ring-primary" />
                  La virtualisation est disponible sur cet appareil
                </label>
              </template>
              <div v-else class="p-3 bg-amber-50 text-amber-800 rounded-xl text-xs">
                Votre candidature peut être déposée sans équipement personnel. L'équipe admissions
                vous indiquera les modalités de la session si elle est retenue.
              </div>
            </div>

            <div class="flex justify-between pt-4">
              <button
                @click="currentStep = 1"
                class="app-action-secondary"
              >
                &larr; Retour
              </button>
              <button
                @click="nextToStep3"
                class="app-action-primary"
              >
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

            <div
              class="divide-y divide-line overflow-hidden rounded-xl border border-line text-sm"
            >
              <div class="flex justify-between bg-canvas p-4">
                <span class="text-quiet">Filière</span>
                <span class="font-bold text-ink">{{ pathway?.name }}</span>
              </div>
              <div class="flex justify-between p-4">
                <span class="text-quiet">Session choisie</span>
                <span class="font-semibold text-ink">{{ selectedCohort?.name }}</span>
              </div>
              <div class="flex justify-between bg-canvas p-4">
                <span class="text-quiet">Dates</span>
                <span class="text-ink"
                  >Du {{ selectedCohort?.starts_at }} au {{ selectedCohort?.ends_at }}</span
                >
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
                <span class="text-right text-ink font-medium">{{ deviceType === 'laptop' ? 'Portable' : 'Bureau' }} · {{ osName || 'Non précisé' }}</span>
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
              <button
                @click="currentStep = 2"
                class="app-action-secondary"
              >
                &larr; Retour
              </button>
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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { ApiError } from '@/api/http'
import { usePathway, usePathwayCohorts } from '@/features/catalog/composables/useCatalog'
import { useSubmitApplication } from '../composables/useLearnerApplications'

const route = useRoute()
const pathwayKey = computed(() => String(route.query.pathway ?? ''))
const cohortKey = computed(() => String(route.query.cohort ?? ''))

const { data: pathway } = usePathway(pathwayKey)
const { data: cohortsData } = usePathwayCohorts(pathwayKey)
const cohorts = computed(() => cohortsData.value ?? [])
const selectedCohort = computed(() => cohorts.value.find((c) => c.key === cohortKey.value))

const currentStep = ref(1)
const motivation = ref('')
const hasComputer = ref(true)
const cpu = ref('Core i5')
const ramGb = ref(8)
const storageGb = ref(256)
const storageFreeGb = ref<number | undefined>()
const deviceType = ref<'laptop' | 'desktop'>('laptop')
const osName = ref('')
const virtualizationSupported = ref(false)

const submitError = ref<string | null>(null)
const isSuccess = ref(false)
const submitMutation = useSubmitApplication()

function nextToStep2() {
  if (selectedCohort.value) {
    currentStep.value = 2
  }
}

function nextToStep3() {
  if (pathway.value?.requires_equipment_validation && !hasComputer.value) {
    submitError.value = 'Cette filière exige un ordinateur à faire valider. Indiquez votre équipement pour continuer.'
    return
  }
  if (hasComputer.value && (!cpu.value.trim() || !ramGb.value || !storageGb.value || !osName.value.trim())) {
    submitError.value = 'Complétez le processeur, la RAM, le stockage et le système d’exploitation.'
    return
  }
  submitError.value = null
  currentStep.value = 3
}

function submit() {
  if (!selectedCohort.value) return
  submitError.value = null

  submitMutation.mutate(
    {
      pathway_key: pathwayKey.value,
      cohort_key: selectedCohort.value.key,
      motivation: motivation.value.trim() || undefined,
      equipment: hasComputer.value
        ? {
            device_type: deviceType.value,
            cpu_model: cpu.value.trim(),
            ram_gb: Number(ramGb.value),
            storage_total_gb: Number(storageGb.value),
            storage_free_gb: storageFreeGb.value ? Number(storageFreeGb.value) : undefined,
            os_name: osName.value.trim(),
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
