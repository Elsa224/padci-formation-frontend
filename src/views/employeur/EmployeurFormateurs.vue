<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Suivi des Formateurs</h1>
        <p class="text-sm text-gray-500 mt-1">Vérifiez le dépôt des rapports et des cours par les formateurs.</p>
      </div>
    </div>

    <!-- Tableau -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
              <th class="py-4 px-6">Formateur</th>
              <th class="py-4 px-6">Module</th>
              <th class="py-4 px-6 text-center">Rapport d'avancement</th>
              <th class="py-4 px-6 text-center">Cours / Support</th>
              <th class="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr v-for="(prof, index) in formateurs" :key="index" class="hover:bg-gray-50 transition">
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                    {{ prof.initials }}
                  </div>
                  <p class="font-bold text-gray-800">{{ prof.nom }}</p>
                </div>
              </td>
              <td class="py-4 px-6 text-gray-600">{{ prof.module }}</td>
              <td class="py-4 px-6 text-center">
                <span v-if="prof.rapport" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600" title="Rapport déposé"><i class='bx bx-check text-xl'></i></span>
                <span v-else class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600" title="Rapport manquant"><i class='bx bx-x text-xl'></i></span>
              </td>
              <td class="py-4 px-6 text-center">
                <span v-if="prof.cours" class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600" title="Cours déposé"><i class='bx bx-check text-xl'></i></span>
                <span v-else class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600" title="Cours manquant"><i class='bx bx-x text-xl'></i></span>
              </td>
              <td class="py-4 px-6 text-center">
                <button
                  @click="openDetails(prof)"
                  class="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  Voir les détails
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= MODALE DE DÉTAIL DU FORMATEUR ================= -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden animate-modal">

        <!-- En-tête -->
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {{ selectedProf?.initials }}
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-800">{{ selectedProf?.nom }}</h3>
              <p class="text-sm text-gray-500">Module : {{ selectedProf?.module }}</p>
            </div>
          </div>
          <button @click="showModal = false" class="text-gray-400 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Contenu -->
        <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">

          <!-- 1. Rapports d'avancement (En ligne / Présentiel) -->
          <div>
            <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <i class='bx bx-line-chart text-indigo-600 text-lg'></i> Rapports de formation
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Rapport En ligne -->
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-semibold text-gray-500 uppercase">Formation en ligne</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">Déposé le 15/10</span>
                </div>
                <p class="text-sm text-gray-800 font-medium mb-2">50h effectuées sur 50h</p>
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div class="bg-blue-600 h-1.5 rounded-full" style="width: 100%"></div>
                  </div>
                  <span class="text-xs font-bold text-blue-600">100%</span>
                </div>
                <a href="#" class="text-xs text-indigo-600 hover:underline mt-3 inline-flex items-center gap-1">
                  <i class='bx bx-file'></i> Télécharger le rapport
                </a>
              </div>

              <!-- Rapport Présentiel -->
              <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div class="flex justify-between items-center mb-2">
                  <span class="text-xs font-semibold text-gray-500 uppercase">Formation présentiel</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700">En cours</span>
                </div>
                <p class="text-sm text-gray-800 font-medium mb-2">20h effectuées sur 30h</p>
                <div class="flex items-center gap-2">
                  <div class="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div class="bg-amber-500 h-1.5 rounded-full" style="width: 66%"></div>
                  </div>
                  <span class="text-xs font-bold text-amber-600">66%</span>
                </div>
                <a href="#" class="text-xs text-indigo-600 hover:underline mt-3 inline-flex items-center gap-1">
                  <i class='bx bx-file'></i> Télécharger le rapport
                </a>
              </div>
            </div>
          </div>

          <!-- 2. Liste de présence par cohorte -->
          <div>
            <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <i class='bx bx-group text-indigo-600 text-lg'></i> Liste de présence par cohorte
            </h4>
            <div class="border border-gray-100 rounded-xl overflow-hidden">
              <table class="w-full text-left text-sm">
                <thead class="bg-gray-50 text-xs font-semibold text-gray-500">
                  <tr>
                    <th class="py-3 px-4">Cohorte</th>
                    <th class="py-3 px-4">Effectif</th>
                    <th class="py-3 px-4">Présents</th>
                    <th class="py-3 px-4">Taux</th>
                    <th class="py-3 px-4 text-center">Fichier</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="(cohorte, index) in selectedProf?.cohortes" :key="index" class="hover:bg-gray-50">
                    <td class="py-3 px-4 font-medium text-gray-800">{{ cohorte.nom }}</td>
                    <td class="py-3 px-4 text-gray-600">{{ cohorte.effectif }}</td>
                    <td class="py-3 px-4 text-gray-600">{{ cohorte.presents }}</td>
                    <td class="py-3 px-4">
                      <span class="text-xs font-bold" :class="cohorte.taux >= 90 ? 'text-green-600' : 'text-amber-600'">{{ cohorte.taux }}%</span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      <a href="#" class="text-indigo-600 hover:underline text-xs">
                        <i class='bx bx-download'></i> PDF
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 3. Supports de cours -->
          <div>
            <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <i class='bx bx-book-content text-indigo-600 text-lg'></i> Supports de cours déposés
            </h4>
            <div class="space-y-2">
              <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center"><i class='bx bxs-file-pdf text-lg'></i></div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">Chapitre 1 - Les bases</p>
                    <p class="text-xs text-gray-500">PDF · 2.4 Mo</p>
                  </div>
                </div>
                <a href="#" class="text-indigo-600 hover:underline text-xs font-semibold">Ouvrir</a>
              </div>
              <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded bg-red-100 text-red-600 flex items-center justify-center"><i class='bx bxs-file-pdf text-lg'></i></div>
                  <div>
                    <p class="text-sm font-medium text-gray-800">Chapitre 2 - Les VLAN</p>
                    <p class="text-xs text-gray-500">PDF · 1.8 Mo</p>
                  </div>
                </div>
                <a href="#" class="text-indigo-600 hover:underline text-xs font-semibold">Ouvrir</a>
              </div>
            </div>
          </div>

        </div>

        <!-- Pied de Modale -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button @click="showModal = false" class="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition text-sm">
            Fermer
          </button>
          <button @click="relancer(selectedProf)" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-500/30 text-sm flex items-center gap-2">
            <i class='bx bx-mail-send'></i> Relancer le formateur
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ==================== INTERFACES ====================
interface CohortePresence {
  nom: string
  effectif: number
  presents: number
  taux: number
}

interface Formateur {
  initials: string
  nom: string
  module: string
  rapport: boolean
  cours: boolean
  cohortes: CohortePresence[]
}

// ==================== ÉTAT ====================
const showModal = ref(false)
const selectedProf = ref<Formateur | null>(null)

// ==================== DONNÉES FICTIVES ====================
const formateurs = ref<Formateur[]>([
  {
    initials: 'MT', nom: 'M. Traoré', module: 'Network Specialist', rapport: true, cours: true,
    cohortes: [
      { nom: 'Cohorte IT SUPPORT (Abidjan)', effectif: 25, presents: 24, taux: 96 },
      { nom: 'Cohorte CYBER SECURITY (Abidjan)', effectif: 20, presents: 18, taux: 90 },
    ]
  },
  {
    initials: 'MD', nom: 'Mme. Diallo', module: 'IT Support', rapport: true, cours: false,
    cohortes: [
      { nom: 'Cohorte C (Yamoussoukro)', effectif: 30, presents: 22, taux: 73 },
      { nom: 'Cohorte D (San-Pédro)', effectif: 15, presents: 15, taux: 100 },
    ]
  },
  {
    initials: 'MK', nom: 'M. Kone', module: 'Cyber Security', rapport: false, cours: false,
    cohortes: []
  },
])

// ==================== ACTIONS ====================
const openDetails = (prof: Formateur) => {
  selectedProf.value = prof
  showModal.value = true
}

const relancer = (prof: Formateur | null) => {
  if (prof) {
    alert(`Une relance a été envoyée à ${prof.nom} pour le dépôt de ses documents manquants.`)
    showModal.value = false
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-modal { animation: modalIn 0.25s ease-out both; }
</style>
