<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Saisie des Notes</h1>
        <p class="text-sm text-gray-500 mt-1">Évaluez les apprenants pour le module en cours.</p>
      </div>
      <button @click="enregistrerNotes" class="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md">
        Enregistrer les notes
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
          <tr>
            <th class="py-4 px-6">Apprenant</th>
            <th class="py-4 px-6">Module</th>
            <th class="py-4 px-6 w-32">Note / 20</th>
            <th class="py-4 px-6">Appréciation</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="(etudiant, index) in etudiants" :key="index" class="hover:bg-gray-50">
            <td class="py-4 px-6 font-medium text-gray-800">{{ etudiant.nom }}</td>
            <td class="py-4 px-6 text-gray-500">{{ etudiant.module }}</td>
            <td class="py-4 px-6">
              <input type="number" v-model="etudiant.note" min="0" max="20" class="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-center focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500">
            </td>
            <td class="py-4 px-6">
              <input type="text" v-model="etudiant.appreciation" placeholder="Ex: Très bon travail" class="w-full px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-sm">
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const etudiants = ref([
  { nom: 'Kouassi Jean', module: 'Network Specialist', note: 15.5, appreciation: 'Bon travail' },
  { nom: 'Aya Diomandé', module: 'Network Specialist', note: 18, appreciation: 'Excellent' },
  { nom: 'Yao Bamba', module: 'Network Specialist', note: 12, appreciation: 'Peut mieux faire' },
])

const enregistrerNotes = () => {
  alert('Les notes ont été enregistrées avec succès !')
}
</script>
