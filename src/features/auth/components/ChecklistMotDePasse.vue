<script setup lang="ts">
import { computed, type Component } from 'vue'
import { CheckIcon, CircleIcon, XIcon } from '@lucide/vue'
import { CLES_REGLES, etatCriteres } from '@/features/auth/utils/passwordRules'
import type { CleRegle, EtatCritere } from '@/features/auth/utils/passwordRules'

const props = defineProps<{ motDePasse: string }>()

const LIBELLES: Record<CleRegle, string> = {
  longueur: '8 caractères minimum',
  majuscule: 'Une majuscule',
  minuscule: 'Une minuscule',
  chiffre: 'Un chiffre',
  special: 'Un caractère spécial',
}

const ICONES: Record<EtatCritere, Component> = {
  remplie: CheckIcon,
  manquante: XIcon,
  'au-repos': CircleIcon,
}

const CLASSES: Record<EtatCritere, string> = {
  remplie: 'text-primary font-medium',
  manquante: 'text-danger-ink',
  'au-repos': 'text-quiet',
}

const criteres = computed(() => etatCriteres(props.motDePasse))

const nombreRemplies = computed(
  () => criteres.value.filter((critere) => critere.etat === 'remplie').length,
)

const annonce = computed(() => {
  if (props.motDePasse === '') {
    return ''
  }

  if (nombreRemplies.value === CLES_REGLES.length) {
    return `Les ${CLES_REGLES.length} conditions sont remplies.`
  }

  if (nombreRemplies.value === 1) {
    return `1 condition remplie sur ${CLES_REGLES.length}.`
  }

  return `${nombreRemplies.value} conditions remplies sur ${CLES_REGLES.length}.`
})
</script>

<template>
  <div class="mt-2 text-left">
    <ul class="space-y-1">
      <li
        v-for="critere in criteres"
        :key="critere.cle"
        class="flex items-center gap-2 text-xs transition-colors duration-200"
        :class="CLASSES[critere.etat]"
      >
        <component :is="ICONES[critere.etat]" class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{{ LIBELLES[critere.cle] }}</span>
      </li>
    </ul>
    <p class="sr-only" aria-live="polite">{{ annonce }}</p>
  </div>
</template>
