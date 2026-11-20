<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Liste de Présence</h1>
        <p class="text-sm text-gray-500 mt-1">Faites l'appel pour la cohorte du jour.</p>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="selectedCohorte" class="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-violet-500">
          <option>Cohorte A (Abidjan)</option>
          <option>Cohorte B (Bouaké)</option>
        </select>
        <button @click="validerAppel" class="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition shadow-sm">
          Valider l'appel
        </button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
          <tr>
            <th class="py-4 px-6">Apprenant</th>
            <th class="py-4 px-6">Email</th>
            <th class="py-4 px-6 text-center">Statut (Présent / Absent)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="(apprenant, index) in apprenants" :key="index" class="hover:bg-gray-50">
            <td class="py-4 px-6 font-medium text-gray-800">{{ apprenant.nom }}</td>
            <td class="py-4 px-6 text-gray-500">{{ apprenant.email }}</td>
            <td class="py-4 px-6">
              <div class="flex justify-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" :name="'statut-' + index" :value="true" v-model="apprenant.present" class="text-violet-600 focus:ring-violet-500">
                  <span class="text-sm text-green-600 font-medium">Présent</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" :name="'statut-' + index" :value="false" v-model="apprenant.present" class="text-violet-600 focus:ring-violet-500">
                  <span class="text-sm text-red-600 font-medium">Absent</span>
                </label>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const selectedCohorte = ref('Cohorte A (Abidjan)')

const apprenants = ref([
  { nom: 'Kouassi Jean', email: 'j.kouassi@email.ci', present: true },
  { nom: 'Aya Diomandé', email: 'a.diomande@email.ci', present: true },
  { nom: 'Yao Bamba', email: 'y.bamba@email.ci', present: false },
  { nom: 'Fatou Sarr', email: 'f.sarr@email.ci', present: true },
  { nom: 'Koffi Traoré', email: 'k.traore@email.ci', present: true },
])

const validerAppel = () => {
  alert(`L'appel pour la ${selectedCohorte.value} a été validé et enregistré.`)
}
</script>
