<template>
  <section class="app-page">
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Programmes et filières</h1>
        <p class="app-page-copy">
          La structure de l'offre : un programme regroupe des filières, chaque filière porte ses
          cours, ses cohortes et ses exigences matérielles.
        </p>
      </div>
    </header>

    <p v-if="error" class="rounded-xl bg-danger-soft p-3 text-sm text-danger-ink" role="alert">
      {{ error }}
    </p>

    <!-- Programmes -->
    <section class="app-panel space-y-4" aria-labelledby="programmes-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="programmes-title" class="text-lg font-bold text-ink">Programmes</h2>
        <button class="app-action-primary" data-test="new-programme" @click="editProgramme(null)">
          Nouveau programme
        </button>
      </div>

      <form
        v-if="programmeForm"
        class="grid gap-3 rounded-xl border border-primary/30 p-4 md:grid-cols-2"
        data-test="programme-form"
        @submit.prevent="saveProgrammeForm"
      >
        <label class="text-sm font-semibold text-ink">
          Code
          <input
            id="programme-code"
            v-model.trim="programmeForm.code"
            class="app-input mt-1"
            required
            maxlength="40"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Nom
          <input
            id="programme-name"
            v-model.trim="programmeForm.name"
            class="app-input mt-1"
            required
            maxlength="160"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Début
          <input
            id="programme-start"
            v-model="programmeForm.starts_at"
            class="app-input mt-1"
            type="date"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Fin
          <input
            id="programme-end"
            v-model="programmeForm.ends_at"
            class="app-input mt-1"
            type="date"
          />
        </label>
        <label class="text-sm font-semibold text-ink">
          Statut
          <select id="programme-status" v-model="programmeForm.status" class="app-input mt-1">
            <option v-for="(label, value) in programmeStatusLabels" :key="value" :value="value">
              {{ label }}
            </option>
          </select>
        </label>
        <label class="text-sm font-semibold text-ink md:col-span-2">
          Description
          <textarea
            id="programme-description"
            v-model.trim="programmeForm.description"
            class="app-input mt-1 min-h-16"
          />
        </label>
        <div class="flex justify-end gap-2 md:col-span-2">
          <button type="button" class="app-action-secondary" @click="programmeForm = null">
            Annuler
          </button>
          <button
            class="app-action-primary"
            :disabled="saveProgramme.isPending.value"
            :aria-busy="saveProgramme.isPending.value"
          >
            Enregistrer
          </button>
        </div>
      </form>

      <div v-if="programmes.isPending.value" class="app-skeleton h-16" />
      <EmptyState
        v-else-if="!programmes.data.value?.items.length"
        title="Aucun programme"
        description="Créez un programme pour y regrouper des filières."
      />
      <ul v-else class="divide-y divide-line">
        <li
          v-for="programme in programmes.data.value.items"
          :key="programme.key"
          class="flex flex-wrap items-center justify-between gap-3 py-3"
          data-test="programme-row"
        >
          <div class="min-w-0">
            <p class="font-semibold text-ink">
              {{ programme.name }}
              <span class="font-mono text-xs text-quiet">{{ programme.code }}</span>
            </p>
            <p class="text-xs text-quiet">
              {{ programmeStatusLabels[programme.status] }} ·
              {{ programme.pathways_count ?? 0 }} filière(s)
            </p>
          </div>
          <div class="flex items-center gap-3 text-xs font-semibold">
            <button class="text-primary" @click="editProgramme(programme)">Modifier</button>
            <ConfirmButton
              label="Supprimer"
              confirm="Supprimer ce programme ?"
              @confirm="
                remove(() => deleteProgramme.mutateAsync(programme.key), 'Programme supprimé.')
              "
            />
          </div>
        </li>
      </ul>
    </section>

    <!-- Filières -->
    <section class="app-panel space-y-4" aria-labelledby="pathways-title">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 id="pathways-title" class="text-lg font-bold text-ink">Filières</h2>
        <button
          class="app-action-primary"
          :disabled="!programmes.data.value?.items.length"
          data-test="new-pathway"
          @click="editPathway(null)"
        >
          Nouvelle filière
        </button>
      </div>

      <form
        v-if="pathwayForm"
        class="grid gap-3 rounded-xl border border-primary/30 p-4 md:grid-cols-2"
        data-test="pathway-form"
        @submit.prevent="savePathwayForm"
      >
        <label class="text-sm font-semibold text-ink">
          Programme
          <select
            id="pathway-programme"
            v-model="pathwayForm.programme_key"
            class="app-input mt-1"
            required
          >
            <option
              v-for="programme in programmes.data.value?.items ?? []"
              :key="programme.key"
              :value="programme.key"
            >
              {{ programme.name }}
            </option>
          </select>
        </label>
        <label class="text-sm font-semibold text-ink">
          Code
          <input
            id="pathway-code"
            v-model.trim="pathwayForm.code"
            class="app-input mt-1"
            required
            maxlength="40"
          />
        </label>
        <label class="text-sm font-semibold text-ink md:col-span-2">
          Nom
          <input
            id="pathway-name"
            v-model.trim="pathwayForm.name"
            class="app-input mt-1"
            required
            maxlength="160"
          />
        </label>
        <label class="text-sm font-semibold text-ink md:col-span-2">
          Description
          <textarea
            id="pathway-description"
            v-model.trim="pathwayForm.description"
            class="app-input mt-1 min-h-16"
          />
        </label>
        <fieldset class="grid gap-3 rounded-lg bg-canvas p-3 md:col-span-2 md:grid-cols-3">
          <legend class="px-1 text-sm font-semibold text-ink">
            Matériel minimum de l'apprenant
          </legend>
          <label class="text-xs font-semibold text-ink">
            Processeur
            <input
              id="pathway-cpu"
              :required="pathwayForm.requires_equipment_validation"
              v-model.trim="pathwayForm.min_cpu"
              class="app-input mt-1"
              placeholder="Ex : Intel Core i5"
            />
          </label>
          <label class="text-xs font-semibold text-ink">
            Mémoire (Go)
            <input
              id="pathway-ram"
              :required="pathwayForm.requires_equipment_validation"
              v-model.number="pathwayForm.min_ram_gb"
              class="app-input mt-1"
              type="number"
              min="1"
            />
          </label>
          <label class="text-xs font-semibold text-ink">
            Stockage (Go)
            <input
              id="pathway-storage"
              :required="pathwayForm.requires_equipment_validation"
              v-model.number="pathwayForm.min_storage_gb"
              class="app-input mt-1"
              type="number"
              min="1"
            />
          </label>
          <label class="text-xs font-semibold text-ink md:col-span-3">
            Remarques
            <input
              id="pathway-notes"
              v-model.trim="pathwayForm.notes"
              class="app-input mt-1"
              maxlength="500"
            />
          </label>
          <p
            v-if="pathwayForm.requires_equipment_validation"
            class="text-xs text-quiet md:col-span-3"
          >
            Processeur, mémoire et stockage sont obligatoires quand une preuve de matériel est
            exigée.
          </p>
          <label class="flex items-center gap-2 text-sm text-ink md:col-span-3">
            <input
              id="pathway-validation"
              v-model="pathwayForm.requires_equipment_validation"
              type="checkbox"
            />
            Exiger une preuve de matériel validée avant l'admission
          </label>
        </fieldset>
        <label class="flex items-center gap-2 text-sm text-ink">
          <input id="pathway-active" v-model="pathwayForm.is_active" type="checkbox" />
          Visible au catalogue
        </label>
        <div class="flex justify-end gap-2 md:col-span-2">
          <button type="button" class="app-action-secondary" @click="pathwayForm = null">
            Annuler
          </button>
          <button
            class="app-action-primary"
            :disabled="savePathway.isPending.value"
            :aria-busy="savePathway.isPending.value"
          >
            Enregistrer
          </button>
        </div>
      </form>

      <div v-if="pathways.isPending.value" class="app-skeleton h-24" />
      <EmptyState
        v-else-if="!pathways.data.value?.items.length"
        title="Aucune filière"
        description="Ajoutez une filière pour y rattacher des cours et des cohortes."
      />
      <ul v-else class="divide-y divide-line">
        <li
          v-for="pathway in pathways.data.value.items"
          :key="pathway.key"
          class="flex flex-wrap items-center justify-between gap-3 py-3"
          data-test="pathway-row"
        >
          <div class="min-w-0">
            <p class="font-semibold text-ink">
              {{ pathway.name }}
              <span class="font-mono text-xs text-quiet">{{ pathway.code }}</span>
              <span
                v-if="!pathway.is_active"
                class="ml-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-quiet"
                >masquée</span
              >
            </p>
            <p class="text-xs text-quiet">
              {{ pathway.programme?.name ?? 'Programme' }} · {{ pathway.courses_count ?? 0 }} cours
              <!-- cohorts_count is not part of the list payload -->
              <template v-if="pathway.cohorts_count !== undefined">
                · {{ pathway.cohorts_count }} cohorte(s)</template
              >
              <template v-if="pathway.requires_equipment_validation">
                · preuve de matériel exigée</template
              >
            </p>
          </div>
          <div class="flex items-center gap-3 text-xs font-semibold">
            <button class="text-primary" @click="editPathway(pathway)">Modifier</button>
            <ConfirmButton
              label="Supprimer"
              confirm="Supprimer cette filière ?"
              @confirm="remove(() => deletePathway.mutateAsync(pathway.key), 'Filière supprimée.')"
            />
          </div>
        </li>
      </ul>
    </section>
  </section>
</template>

<script setup lang="ts">
import EmptyState from '@/components/app/EmptyState.vue'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import ConfirmButton from '../components/ConfirmButton.vue'
import {
  apiMessage,
  programmeStatusLabels,
  useAdminPathways,
  useDeletePathway,
  useDeleteProgramme,
  useProgrammes,
  useSavePathway,
  useSaveProgramme,
  type AdminPathway,
  type Programme,
  type ProgrammeStatus,
} from '../composables/useAdminOperations'

const programmes = useProgrammes()
const pathways = useAdminPathways()
const saveProgramme = useSaveProgramme()
const deleteProgramme = useDeleteProgramme()
const savePathway = useSavePathway()
const deletePathway = useDeletePathway()
const error = ref('')

async function remove(action: () => Promise<unknown>, success: string) {
  error.value = ''
  try {
    await action()
    toast.success(success)
  } catch (err) {
    // e.g. a programme that still has pathways, a pathway that still has courses
    error.value = apiMessage(err, 'Suppression impossible.')
  }
}

// ── Programme form ──
interface ProgrammeForm {
  key?: string
  code: string
  name: string
  description: string
  starts_at: string
  ends_at: string
  status: ProgrammeStatus
}
const programmeForm = ref<ProgrammeForm | null>(null)

function editProgramme(programme: Programme | null) {
  programmeForm.value = {
    key: programme?.key,
    code: programme?.code ?? '',
    name: programme?.name ?? '',
    description: programme?.description ?? '',
    starts_at: programme?.starts_at?.slice(0, 10) ?? '',
    ends_at: programme?.ends_at?.slice(0, 10) ?? '',
    status: programme?.status ?? 'planned',
  }
}

async function saveProgrammeForm() {
  const form = programmeForm.value
  if (!form) return
  error.value = ''
  try {
    await saveProgramme.mutateAsync({
      key: form.key,
      code: form.code,
      name: form.name,
      description: form.description || null,
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
      status: form.status,
    })
    toast.success(form.key ? 'Programme mis à jour.' : 'Programme créé.')
    programmeForm.value = null
  } catch (err) {
    error.value = apiMessage(err, "Le programme n'a pas pu être enregistré.")
  }
}

// ── Pathway form ──
interface PathwayForm {
  key?: string
  programme_key: string
  code: string
  name: string
  description: string
  min_cpu: string
  min_ram_gb: number | null
  min_storage_gb: number | null
  notes: string
  requires_equipment_validation: boolean
  is_active: boolean
}
const pathwayForm = ref<PathwayForm | null>(null)

function editPathway(pathway: AdminPathway | null) {
  const requirements = pathway?.equipment_requirements ?? {}
  pathwayForm.value = {
    key: pathway?.key,
    programme_key: pathway?.programme?.key ?? programmes.data.value?.items[0]?.key ?? '',
    code: pathway?.code ?? '',
    name: pathway?.name ?? '',
    description: pathway?.description ?? '',
    min_cpu: requirements.min_cpu ?? '',
    min_ram_gb: requirements.min_ram_gb ?? null,
    min_storage_gb: requirements.min_storage_gb ?? null,
    notes: requirements.notes ?? '',
    requires_equipment_validation: pathway?.requires_equipment_validation ?? false,
    is_active: pathway?.is_active ?? true,
  }
}

async function savePathwayForm() {
  const form = pathwayForm.value
  if (!form) return
  error.value = ''
  try {
    await savePathway.mutateAsync({
      key: form.key,
      programme_key: form.programme_key,
      code: form.code,
      name: form.name,
      description: form.description || null,
      equipment_requirements: {
        min_cpu: form.min_cpu || null,
        min_ram_gb: form.min_ram_gb || null,
        min_storage_gb: form.min_storage_gb || null,
        notes: form.notes || null,
      },
      requires_equipment_validation: form.requires_equipment_validation,
      is_active: form.is_active,
    })
    toast.success(form.key ? 'Filière mise à jour.' : 'Filière créée.')
    pathwayForm.value = null
  } catch (err) {
    error.value = apiMessage(err, "La filière n'a pas pu être enregistrée.")
  }
}
</script>
