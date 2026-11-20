<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">Dossiers Candidats</h1>
        <p class="text-sm text-gray-500 mt-1">Consultez les pièces justificatives et soumettez vos avis à l'UCP.</p>
      </div>
    </div>

    <!-- Tableau des candidats -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
              <th class="py-4 px-6">Candidat</th>
              <th class="py-4 px-6">Formation</th>
              <th class="py-4 px-6">Date de dépôt</th>
              <th class="py-4 px-6">Statut Actuel</th>
              <th class="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 text-sm">
            <tr v-for="(candidat, index) in candidats" :key="index" class="hover:bg-gray-50 transition">
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                    {{ candidat.initials }}
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">{{ candidat.nom }}</p>
                    <p class="text-xs text-gray-500">{{ candidat.email }}</p>
                  </div>
                </div>
              </td>
              <td class="py-4 px-6 text-gray-600">{{ candidat.formation }}</td>
              <td class="py-4 px-6 text-gray-500">{{ candidat.date }}</td>
              <td class="py-4 px-6">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                  :class="{
                    'bg-amber-100 text-amber-700': candidat.statut === 'En attente',
                    'bg-indigo-100 text-indigo-700': candidat.statut === 'Avis Favorable',
                    'bg-red-100 text-red-700': candidat.statut === 'Avis Défavorable'
                  }">
                  {{ candidat.statut }}
                </span>
              </td>
              <td class="py-4 px-6 text-center">
                <button @click="openReview(candidat)" class="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 mx-auto">
                  <i class='bx bx-folder-open'></i> Examiner
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ================= MODALE DE DÉTAIL DU DOSSIER ================= -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-modal">

        <!-- En-tête Modale -->
        <div class="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
              {{ selectedCandidat?.initials }}
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-800">{{ selectedCandidat?.nom }}</h3>
              <p class="text-sm text-gray-500">{{ selectedCandidat?.email }}</p>
            </div>
          </div>
          <button @click="showModal = false" class="text-gray-400 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- Contenu Modale -->
        <div class="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">

          <!-- 1. Informations Personnelles -->
          <div>
            <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <i class='bx bx-user text-indigo-600 text-lg'></i> Identité & Contact
            </h4>
            <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
              <div><span class="text-gray-500">Genre :</span> <span class="font-medium text-gray-800">{{ selectedCandidat?.genre }}</span></div>
              <div><span class="text-gray-500">Nationalité :</span> <span class="font-medium text-gray-800">{{ selectedCandidat?.nationalite }}</span></div>
              <div><span class="text-gray-500">Téléphone :</span> <span class="font-medium text-gray-800">{{ selectedCandidat?.telephone }}</span></div>
              <div><span class="text-gray-500">Date de naissance :</span> <span class="font-medium text-gray-800">{{ selectedCandidat?.dateNaissance }}</span></div>
              <div class="col-span-2"><span class="text-gray-500">Adresse :</span> <span class="font-medium text-gray-800">{{ selectedCandidat?.adresse }}</span></div>
            </div>
          </div>

          <!-- 2. Prérequis Académiques -->
          <div>
            <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <i class='bx bx-certification text-indigo-600 text-lg'></i> Diplôme & Documents
            </h4>
            <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
              <div><span class="text-gray-500">Niveau :</span> <span class="font-medium text-gray-800">{{ selectedCandidat?.diplome }}</span></div>
              <div><span class="text-gray-500">Spécialité :</span> <span class="font-medium text-gray-800">{{ selectedCandidat?.specialite }}</span></div>

              <div class="col-span-2 flex flex-col gap-2 mt-2">
                <a href="#" class="text-indigo-600 hover:underline flex items-center gap-1 font-medium w-fit">
                  <i class='bx bx-file'></i> Voir le diplôme (PDF)
                </a>
                <a href="#" class="text-indigo-600 hover:underline flex items-center gap-1 font-medium w-fit">
                  <i class='bx bx-id-card'></i> Voir la pièce d'identité
                </a>
                <a href="#" class="text-indigo-600 hover:underline flex items-center gap-1 font-medium w-fit">
                  <i class='bx bx-file-blank'></i> Voir l'extrait de naissance
                </a>
              </div>
            </div>
          </div>

          <!-- 3. Équipement Informatique -->
          <div>
            <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3 flex items-center gap-2">
              <i class='bx bx-laptop text-indigo-600 text-lg'></i> Équipement (Core i5 / 8Go / 256Go)
            </h4>
            <div class="bg-gray-50 p-4 rounded-xl text-sm space-y-2">
              <div class="flex justify-between border-b border-gray-200 pb-2">
                <span class="text-gray-500">Processeur :</span>
                <span class="font-bold text-gray-800">{{ selectedCandidat?.processeur }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 pb-2">
                <span class="text-gray-500">RAM :</span>
                <span class="font-bold text-gray-800">{{ selectedCandidat?.ram }}</span>
              </div>
              <div class="flex justify-between border-b border-gray-200 pb-2">
                <span class="text-gray-500">Stockage :</span>
                <span class="font-bold text-gray-800">{{ selectedCandidat?.stockage }}</span>
              </div>
              <div class="flex justify-between pt-1">
                <span class="text-gray-500">Photo de l'ordinateur :</span>
                <a href="#" class="text-indigo-600 hover:underline flex items-center gap-1 font-medium">
                  <i class='bx bx-image'></i> Voir la photo
                </a>
              </div>
            </div>
          </div>

        </div>

        <!-- Pied de Modale (Actions) -->
        <div class="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-3">
          <p class="text-xs text-gray-500 mr-auto self-center mb-2 sm:mb-0">
            <i class='bx bx-info-circle'></i> Votre décision sera transmise à l'UCP pour validation.
          </p>
          <button @click="soumettreDecision('Refus')" class="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition text-sm">
            Demander le refus
          </button>
          <button @click="soumettreDecision('Admission')" class="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-md shadow-indigo-500/30 text-sm">
            Demander l'admission
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// ==================== INTERFACE ====================
interface Candidat {
  initials: string
  nom: string
  email: string
  formation: string
  date: string
  statut: 'En attente' | 'Avis Favorable' | 'Avis Défavorable'
  genre: string
  nationalite: string
  telephone: string
  dateNaissance: string
  adresse: string
  diplome: string
  specialite: string
  processeur: string
  ram: string
  stockage: string
}

// ==================== ÉTAT ====================
const showModal = ref(false)
const selectedCandidat = ref<Candidat | null>(null)

// ==================== DONNÉES FICTIVES ====================
const candidats = ref<Candidat[]>([
  {
    initials: 'AD', nom: 'Aya Diomandé', email: 'aya.d@email.ci', formation: 'Network Specialist', date: '12/10/2024', statut: 'En attente',
    genre: 'Féminin', nationalite: 'Ivoirienne', telephone: '+225 07 00 00 01', dateNaissance: '12/05/1995', adresse: 'Cocody, Abidjan',
    diplome: 'Licence', specialite: 'Réseaux & Télécoms', processeur: 'Core i7', ram: '16 Go', stockage: '512 Go'
  },
  {
    initials: 'KT', nom: 'Koffi Traoré', email: 'k.traore@email.ci', formation: 'IT Support', date: '12/10/2024', statut: 'En attente',
    genre: 'Masculin', nationalite: 'Ivoirienne', telephone: '+225 07 00 00 02', dateNaissance: '23/08/1998', adresse: 'Yopougon, Abidjan',
    diplome: 'BTS', specialite: 'Informatique', processeur: 'Core i5', ram: '8 Go', stockage: '256 Go'
  },
  {
    initials: 'MA', nom: 'Mariam Anouman', email: 'm.anouman@email.ci', formation: 'Cyber Security', date: '11/10/2024', statut: 'Avis Favorable',
    genre: 'Féminin', nationalite: 'Ivoirienne', telephone: '+225 07 00 00 03', dateNaissance: '05/11/1996', adresse: 'Marcory, Abidjan',
    diplome: 'Master', specialite: 'Cybersécurité', processeur: 'Core i9', ram: '32 Go', stockage: '1 To'
  },
])

// ==================== ACTIONS ====================
const openReview = (candidat: Candidat) => {
  selectedCandidat.value = candidat
  showModal.value = true
}

const soumettreDecision = (decision: string) => {
  if (selectedCandidat.value) {
    selectedCandidat.value.statut = decision === 'Admission' ? 'Avis Favorable' : 'Avis Défavorable'
    alert(`Votre demande d'${decision} pour ${selectedCandidat.value.nom} a été transmise à l'Administration (UCP).`)
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
