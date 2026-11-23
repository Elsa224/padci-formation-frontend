<template>
  <div class="flex min-w-0 flex-1 flex-wrap items-center gap-2" data-test="structure-node">
    <form
      v-if="mode === 'rename'"
      class="flex min-w-0 flex-1 flex-wrap gap-2"
      @submit.prevent="emitRename"
    >
      <input
        :id="`rename-${nodeKey}`"
        ref="input"
        v-model.trim="draft"
        class="app-input min-w-0 flex-1"
        required
        maxlength="180"
        :aria-label="`Nouveau titre pour ${title}`"
      />
      <button class="app-action-primary" :disabled="busy">Enregistrer</button>
      <button type="button" class="app-action-secondary" @click="mode = 'view'">Annuler</button>
    </form>

    <template v-else>
      <span class="min-w-0 break-words" :class="titleClass"
        ><slot>{{ title }}</slot></span
      >
      <span v-if="editable && mode === 'view'" class="flex gap-3 text-xs">
        <button
          v-if="renamable"
          type="button"
          class="font-semibold text-primary"
          data-test="rename"
          @click="startRename"
        >
          Renommer
        </button>
        <button
          type="button"
          class="font-semibold text-danger-ink"
          data-test="delete"
          @click="mode = 'confirm'"
        >
          {{ deleteLabel }}
        </button>
      </span>
      <span
        v-if="mode === 'confirm'"
        class="flex flex-wrap items-center gap-2 rounded-lg bg-danger-soft px-2 py-1 text-xs text-danger-ink"
        role="alert"
      >
        {{ confirmText }}
        <button type="button" class="font-semibold underline" @click="mode = 'view'">
          Annuler
        </button>
        <button
          type="button"
          class="font-semibold"
          :disabled="busy"
          data-test="confirm-delete"
          @click="emit('delete')"
        >
          Confirmer
        </button>
      </span>
    </template>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, useTemplateRef } from 'vue'

const props = withDefaults(
  defineProps<{
    nodeKey: string
    title: string
    editable: boolean
    busy?: boolean
    renamable?: boolean
    titleClass?: string
    deleteLabel?: string
    confirmText?: string
  }>(),
  {
    busy: false,
    renamable: true,
    titleClass: 'font-semibold text-ink',
    deleteLabel: 'Supprimer',
    confirmText: 'Supprimer définitivement ?',
  },
)

const emit = defineEmits<{ rename: [title: string]; delete: [] }>()

const mode = ref<'view' | 'rename' | 'confirm'>('view')
const draft = ref('')
const input = useTemplateRef<HTMLInputElement>('input')

async function startRename() {
  draft.value = props.title
  mode.value = 'rename'
  await nextTick()
  input.value?.focus()
}

function emitRename() {
  if (draft.value && draft.value !== props.title) emit('rename', draft.value)
  mode.value = 'view'
}

defineExpose({ reset: () => (mode.value = 'view') })
</script>
