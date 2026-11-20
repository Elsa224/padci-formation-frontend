<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Rapports d'Avancement</h1>
        <p class="text-sm text-gray-500 mt-1">Déposez vos rapports pour l'administration et l'employeur.</p>
      </div>
      <button @click="showReportModal = true" class="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md flex items-center gap-2">
        <i class='bx bx-file-blank text-lg'></i> Nouveau rapport
      </button>
    </div>

    <!-- Historique -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
          <tr>
            <th class="py-4 px-6">Date de soumission</th>
            <th class="py-4 px-6">Module</th>
            <th class="py-4 px-6">Type</th>
            <th class="py-4 px-6">Statut</th>
            <th class="py-4 px-6 text-center">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="rapport in rapports" :key="rapport.id" class="hover:bg-gray-50">
            <td class="py-4 px-6 text-gray-600">{{ rapport.date }}</td>
            <td class="py-4 px-6 font-medium text-gray-800">{{ rapport.module }}</td>
            <td class="py-4 px-6 text-gray-500">{{ rapport.type }}</td>
            <td class="py-4 px-6">
              <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Validé</span>
            </td>
            <td class="py-4 px-6 text-center">
              <a href="#" class="text-violet-600 hover:underline text-xs font-semibold">Voir le PDF</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modale de dépôt -->
    <div v-if="showReportModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-modal">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Déposer un rapport</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Module concerné</label>
            <select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
              <option>Network Specialist</option>
              <option>IT Support</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Type de formation</label>
            <select class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
              <option>En ligne</option>
              <option>Présentiel</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fichier du rapport (PDF)</label>
            <input type="file" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer border border-gray-200 rounded-lg bg-gray-50">
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showReportModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm">Annuler</button>
          <button @click="soumettreRapport" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm">Soumettre</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showReportModal = ref(false)
const rapports = ref([
  { id: 1, date: '15/10/2024', module: 'Network Specialist', type: 'Présentiel' },
  { id: 2, date: '10/10/2024', module: 'Network Specialist', type: 'En ligne' },
])

const soumettreRapport = () => {
  alert('Votre rapport a été soumis avec succès à l\'administration.')
  showReportModal.value = false
}
</script>

<style scoped>
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-modal { animation: modalIn 0.25s ease-out both; }
</style>
