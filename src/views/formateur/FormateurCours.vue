<template>
  <div class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Mes Cours & Supports</h1>
        <p class="text-sm text-gray-500 mt-1">Déposez vos cours pour les apprenants et l'administration.</p>
      </div>
      <button @click="showUploadModal = true" class="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2.5 rounded-xl font-semibold transition shadow-md flex items-center gap-2">
        <i class='bx bx-upload text-lg'></i> Déposer un cours
      </button>
    </div>

    <!-- Liste des cours -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="cours in coursList" :key="cours.id" class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition flex flex-col justify-between">
        <div>
          <div class="flex justify-between items-start mb-3">
            <div class="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <i :class="cours.icon + ' text-xl'"></i>
            </div>
            <span class="text-[10px] font-bold px-2 py-1 rounded bg-gray-100 text-gray-500">{{ cours.type }}</span>
          </div>
          <h3 class="font-bold text-gray-800 text-lg mb-1">{{ cours.titre }}</h3>
          <p class="text-xs text-gray-500 mb-4">Module : {{ cours.module }} · {{ cours.cohorte }}</p>
        </div>
        <div class="flex items-center justify-between pt-3 border-t border-gray-100">
          <span class="text-xs text-gray-400">Déposé le {{ cours.date }}</span>
          <a href="#" class="text-violet-600 font-semibold text-sm hover:underline">Voir</a>
        </div>
      </div>
    </div>

    <!-- Modale d'upload -->
    <div v-if="showUploadModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-modal">
        <h3 class="text-lg font-bold text-gray-800 mb-4">Déposer un nouveau cours</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Titre du cours</label>
            <input v-model="newCours.titre" type="text" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm" placeholder="Ex: Chapitre 1 - Introduction">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Module</label>
            <select v-model="newCours.module" class="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm bg-white">
              <option value="Network Specialist">Network Specialist</option>
              <option value="IT Support">IT Support</option>
              <option value="Cyber Security">Cyber Security</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Fichier (PDF, Vidéo...)</label>
            <input type="file" class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100 cursor-pointer border border-gray-200 rounded-lg bg-gray-50">
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showUploadModal = false" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium text-sm">Annuler</button>
          <button @click="publierCours" class="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium text-sm">Publier</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const showUploadModal = ref(false)
const newCours = ref({ titre: '', module: 'Network Specialist' })

const coursList = ref([
  { id: 1, titre: 'Introduction au Pentesting', module: 'Network Specialist', cohorte: 'Cohorte A', type: 'PDF', icon: 'bx-file-pdf', date: '15/10/2024' },
  { id: 2, titre: 'Configuration OSPF', module: 'Network Specialist', cohorte: 'Cohorte A', type: 'Vidéo', icon: 'bx-video', date: '12/10/2024' },
  { id: 3, titre: 'Les bases du VLAN', module: 'IT Support', cohorte: 'Cohorte B', type: 'PDF', icon: 'bx-file-pdf', date: '10/10/2024' },
])

const publierCours = () => {
  alert(`Le cours "${newCours.value.titre}" a été publié avec succès !`)
  showUploadModal.value = false
  newCours.value = { titre: '', module: 'Network Specialist' }
}
</script>

<style scoped>
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-modal { animation: modalIn 0.25s ease-out both; }
</style>
