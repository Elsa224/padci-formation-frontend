<template>
  <section class="app-page max-w-6xl">
    <header class="app-page-header"><div><p class="text-xs font-bold uppercase tracking-wider text-primary">Admissions</p><h1 class="app-page-title mt-2">Vérification du matériel</h1><p class="app-page-copy">Examinez les équipements déclarés au regard des exigences de la filière.</p></div></header>
    <div class="app-panel space-y-5">
      <div class="flex flex-wrap items-end justify-between gap-4"><div><h2 class="text-lg font-bold text-ink">Dossiers</h2><p class="text-sm text-quiet">La décision d'admission reste réservée à l'administration.</p></div><label class="text-sm font-semibold text-ink">Statut<select v-model="status" class="app-input mt-1"><option value="pending">À examiner</option><option value="needs_info">Complément demandé</option><option value="approved">Validés</option><option value="rejected">Refusés</option><option value="">Tous les statuts</option></select></label></div>
      <div v-if="query.isPending.value" class="space-y-3" aria-label="Chargement"><div v-for="n in 3" :key="n" class="app-skeleton h-24" /></div>
      <div v-else-if="query.isError.value" class="rounded-xl bg-red-50 p-4 text-sm text-red-800" role="alert">{{ message(query.error.value) }} <button class="underline" @click="query.refetch()">Réessayer</button></div>
      <p v-else-if="!query.data.value?.items.length" class="rounded-xl bg-canvas p-8 text-center text-sm text-quiet">Aucun dossier pour ce statut.</p>
      <div v-else class="space-y-3"><article v-for="review in query.data.value?.items" :key="review.key" class="rounded-xl border border-line p-4 sm:p-5">
        <div class="flex flex-wrap items-start justify-between gap-3"><div><p class="text-xs font-semibold text-primary">{{ review.pathway?.name ?? 'Filière' }}</p><h3 class="mt-1 font-bold text-ink">{{ review.application?.candidate?.name ?? 'Candidat' }}</h3><p class="mt-1 text-xs text-quiet">{{ label(review.status) }}</p></div><button class="app-action-secondary" @click="selected = selected?.key === review.key ? null : review">{{ selected?.key === review.key ? 'Fermer' : 'Examiner' }}</button></div>
        <div v-if="selected?.key === review.key" class="mt-5 space-y-5 border-t border-line pt-5">
          <div class="grid gap-4 md:grid-cols-2"><div class="rounded-xl bg-canvas p-4"><h4 class="font-bold text-ink">Matériel déclaré</h4><dl class="mt-3 space-y-2 text-sm"><div v-for="field in declarationFields" :key="field.key" class="flex justify-between gap-3"><dt class="text-quiet">{{ field.label }}</dt><dd class="text-right font-medium text-ink">{{ display(review.declaration?.[field.key]) }}</dd></div></dl></div><div class="rounded-xl bg-canvas p-4"><h4 class="font-bold text-ink">Exigences de la filière</h4><dl class="mt-3 space-y-2 text-sm"><div v-for="field in requirementFields" :key="field.key" class="flex justify-between gap-3"><dt class="text-quiet">{{ field.label }}</dt><dd class="text-right font-medium text-ink">{{ display(review.requirements_snapshot?.[field.key]) }}</dd></div></dl></div></div>
          <p v-if="review.reason" class="text-sm text-quiet">Motif : {{ review.reason }}</p>
          <form v-if="review.status === 'pending'" class="space-y-3" @submit.prevent="decide(review)"><label class="block text-sm font-semibold text-ink">Décision<select v-model="decision" class="app-input mt-1"><option value="approved">Valider le matériel</option><option value="needs_info">Demander un complément</option><option value="rejected">Refuser le matériel</option></select></label><label class="block text-sm font-semibold text-ink">Motif <span class="font-normal text-quiet">{{ decision === 'approved' ? '(facultatif)' : '(obligatoire)' }}</span><textarea v-model.trim="reason" class="app-input mt-1" rows="3" maxlength="2000" :required="decision !== 'approved'" /></label><p v-if="actionError" role="alert" class="text-sm text-red-700">{{ actionError }}</p><button class="app-action-primary" :disabled="mutation.isPending.value">{{ mutation.isPending.value ? 'Enregistrement...' : 'Enregistrer la décision' }}</button></form>
        </div>
      </article></div>
      <nav v-if="query.data.value?.pagination && (query.data.value.pagination.last_page ?? 1) > 1" class="flex items-center justify-end gap-3" aria-label="Pagination"><button class="app-action-secondary" :disabled="page <= 1" @click="page--">Précédent</button><span class="text-sm text-quiet">{{ page }} / {{ query.data.value.pagination.last_page }}</span><button class="app-action-secondary" :disabled="page >= (query.data.value.pagination.last_page ?? 1)" @click="page++">Suivant</button></nav>
    </div>
  </section>
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { apiMeta, ApiError, http } from '@/api/http'
import type { ApiPaginationMeta } from '@/api/types'
interface Review { key: string; status: string; reason: string | null; declaration: Record<string, unknown> | null; requirements_snapshot: Record<string, unknown> | null; application?: { candidate?: { name: string } }; pathway?: { name: string } }
const status = ref('pending'), page = ref(1), selected = ref<Review | null>(null), reason = ref(''), actionError = ref('')
const decision = ref<'approved' | 'needs_info' | 'rejected'>('approved')
const client = useQueryClient()
watch(status, () => { page.value = 1; selected.value = null })
const query = useQuery({ queryKey: computed(() => ['moderation-equipment', status.value, page.value]), queryFn: async () => { const response = await http.get<Review[]>('/moderation/equipment-reviews', { params: { status: status.value || undefined, page: page.value } }); return { items: response.data, pagination: apiMeta(response)?.pagination ?? null as ApiPaginationMeta | null } } })
const mutation = useMutation({ mutationFn: async (review: Review) => http.post(`/moderation/equipment-reviews/${review.key}/decide`, { decision: decision.value, reason: reason.value || null }), onSuccess: () => { selected.value = null; reason.value = ''; decision.value = 'approved'; void client.invalidateQueries({ queryKey: ['moderation-equipment'] }) } })
function decide(review: Review) { actionError.value = ''; mutation.mutate(review, { onError: (error) => { actionError.value = message(error) } }) }
function message(error: unknown) { return error instanceof ApiError ? error.displayMessage : 'Impossible de charger les informations.' }
function label(value: string) { return ({ pending: 'À examiner', needs_info: 'Complément demandé', approved: 'Validé', rejected: 'Refusé', not_required: 'Non requis' } as Record<string, string>)[value] ?? value }
function display(value: unknown) { return value === null || value === undefined || value === '' ? 'Non précisé' : typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value) }
const declarationFields = [{ key: 'device_type', label: 'Appareil' }, { key: 'cpu_model', label: 'Processeur' }, { key: 'ram_gb', label: 'RAM (Go)' }, { key: 'storage_total_gb', label: 'Stockage (Go)' }, { key: 'os_name', label: 'Système' }, { key: 'virtualization_supported', label: 'Virtualisation' }, { key: 'notes', label: 'Notes' }]
const requirementFields = [{ key: 'min_cpu', label: 'Processeur' }, { key: 'min_ram_gb', label: 'RAM minimale (Go)' }, { key: 'min_storage_gb', label: 'Stockage minimal (Go)' }, { key: 'notes', label: 'Notes' }]
</script>
