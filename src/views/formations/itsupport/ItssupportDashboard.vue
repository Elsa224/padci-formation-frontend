<template>
  <div class="space-y-6 pb-10">

    <!-- ================= EN-TÊTE ================= -->
    <div class="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div class="absolute right-20 bottom-0 w-20 h-20 bg-blue-500 opacity-20 rounded-full blur-xl"></div>

      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span class="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-white/20 mb-3 inline-block">
            Module M3 · IT Support
          </span>
          <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">Formation de Formateurs en Support Informatique</h1>
          <p class="text-slate-300 text-sm max-w-xl">
            Diagnostiquer, dépanner et accompagner : de l'incident au service de confiance.
          </p>
        </div>

        <!-- Progression Globale (Calculée dynamiquement) -->
        <div class="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 shrink-0 w-full md:w-64">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-semibold text-slate-300 uppercase">Progression Globale</span>
            <span class="text-lg font-bold text-white">{{ globalProgress }}%</span>
          </div>
          <div class="w-full bg-black/30 rounded-full h-2.5">
            <div class="bg-blue-400 h-2.5 rounded-full transition-all duration-1000 ease-out" :style="{ width: `${globalProgress}%` }"></div>
          </div>
          <p class="text-[10px] text-slate-300 mt-2 text-right">{{ completedSessions }} sessions terminées sur 8</p>
        </div>
      </div>
    </div>

    <!-- ================= STATISTIQUES (KPIs) ================= -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="(kpi, index) in kpis" :key="index" class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4 hover:shadow-md transition">
        <div :class="['w-12 h-12 rounded-lg flex items-center justify-center shrink-0', kpi.bgColor, kpi.textColor]">
          <i :class="[kpi.icon, 'text-2xl']"></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">{{ kpi.title }}</p>
          <p class="text-2xl font-bold text-gray-800">
            {{ kpi.value }} <span class="text-sm text-gray-400 font-normal">/ {{ kpi.total }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- ================= CONTENU PRINCIPAL (2 COLONNES) ================= -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

      <!-- COLONNE GAUCHE : Programme des 4 jours -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between mb-2">
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <i class='bx bx-grid-alt text-slate-700 text-xl'></i> Programme des 4 jours
          </h2>
        </div>

        <div class="space-y-3">
          <router-link
            v-for="jour in jours"
            :key="jour.id"
            :to="`/formations/itsupport/jour${jour.id}`"
            class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 hover:border-blue-400 hover:shadow-md transition group"
            :class="{ 'opacity-60': jour.status === 'À venir' }"
          >
            <!-- Icône et Statut -->
            <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition"
                 :class="jour.status === 'Terminé' ? 'bg-green-100 text-green-600' : (jour.status === 'En cours' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500')">
              <i v-if="jour.status === 'Terminé'" class='bx bx-check text-2xl'></i>
              <i v-else :class="[jour.icon, 'text-xl']"></i>
            </div>

            <!-- Infos -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-center mb-1">
                <h3 class="font-bold text-gray-800 truncate group-hover:text-blue-600 transition">{{ jour.title }}</h3>
                <span class="text-[10px] font-bold px-2 py-1 rounded"
                  :class="{
                    'bg-green-100 text-green-700': jour.status === 'Terminé',
                    'bg-blue-100 text-blue-700': jour.status === 'En cours',
                    'bg-gray-100 text-gray-500': jour.status === 'À venir'
                  }">
                  {{ jour.status }}
                </span>
              </div>
              <p class="text-xs text-gray-500 truncate mb-2">{{ jour.description }}</p>

              <!-- Barre de progression locale -->
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-gray-100 rounded-full h-1.5">
                  <div class="h-1.5 rounded-full transition-all duration-500"
                       :class="jour.status === 'Terminé' ? 'bg-green-500' : 'bg-blue-500'"
                       :style="{ width: `${jour.progress}%` }"></div>
                </div>
                <span class="text-[10px] font-medium text-gray-400">{{ jour.sessions }} sessions</span>
              </div>
            </div>
          </router-link>
        </div>
      </div>

      <!-- COLONNE DROITE : Scénario & Activités récentes -->
      <div class="space-y-6">

        <!-- Scénario -->
        <div class="bg-slate-800 rounded-xl shadow-md p-5 text-white relative overflow-hidden">
          <div class="absolute -right-5 -bottom-5 opacity-10">
            <i class='bx bx-buildings text-8xl'></i>
          </div>
          <div class="relative z-10">
            <h3 class="font-bold text-lg mb-2 flex items-center gap-2">
              <i class='bx bx-map-pin text-blue-400'></i> Pharmacies Baobab
            </h3>
            <p class="text-sm text-slate-300 leading-relaxed mb-4">
              Suivez le fil rouge de la formation à travers une chaîne fictive de 9 pharmacies en Côte d'Ivoire. Tous les Labs et études de cas s'appuient sur ce scénario.
            </p>
            <div class="flex items-center gap-3 text-xs font-medium text-slate-400">
              <span class="flex items-center gap-1"><i class='bx bx-store'></i> 9 officines</span>
              <span class="flex items-center gap-1"><i class='bx bx-user'></i> 70 employés</span>
            </div>
          </div>
        </div>

        <!-- Activités récentes (Typées) -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 class="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <i class='bx bx-history text-slate-500'></i> Dernières activités
          </h3>

          <div class="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            <div v-for="act in activities" :key="act.id" class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <!-- Point sur la ligne -->
              <div class="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                <i :class="[act.icon, 'text-sm']"></i>
              </div>
              <!-- Contenu -->
              <div class="w-[calc(100%-4rem)] md:w-[calc(50%-2rem)] bg-gray-50 rounded-lg p-3 border border-gray-100">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-800">{{ act.type }}</span>
                  <span class="text-[10px] text-gray-400">{{ act.time }}</span>
                </div>
                <p class="text-xs text-gray-600">{{ act.text }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

// ==================== INTERFACES TYPESCRIPT ====================
interface KPI {
  title: string
  value: number | string
  total: number | string
  icon: string
  bgColor: string
  textColor: string
}

interface JourModule {
  id: number
  title: string
  description: string
  icon: string
  sessions: string
  progress: number
  status: 'Terminé' | 'En cours' | 'À venir'
}

interface Activity {
  id: number
  type: string
  text: string
  time: string
  icon: string
}

// ==================== ÉTAT RÉACTIF ====================
const kpis = ref<KPI[]>([
  { title: 'Jours complétés', value: 1, total: 4, icon: 'bx-calendar', bgColor: 'bg-slate-100', textColor: 'text-slate-700' },
  { title: 'Sessions suivies', value: 2, total: 8, icon: 'bx-time-five', bgColor: 'bg-blue-50', textColor: 'text-blue-600' },
  { title: 'Labs réussis', value: 1, total: 4, icon: 'bx-laptop', bgColor: 'bg-slate-100', textColor: 'text-slate-700' },
  { title: 'Certification', value: 'Interne', total: '', icon: 'bx-certification', bgColor: 'bg-green-50', textColor: 'text-green-600' }
])

const jours = ref<JourModule[]>([
  { id: 1, title: 'Découvrir le métier', description: 'Incident, requête, niveaux N1/N2/N3 et méthode de diagnostic.', icon: 'bx-headphone', sessions: 'S1 & S2', progress: 100, status: 'Terminé' },
  { id: 2, title: 'Gestes techniques', description: 'Diagnostic matériel, installation poste et script d\'assistance.', icon: 'bx-wrench', sessions: 'S3 & S4', progress: 50, status: 'En cours' },
  { id: 3, title: 'Comptes & Réseau', description: 'Moindre privilège, diagnostic réseau et prise en main à distance.', icon: 'bx-network-chart', sessions: 'S5 & S6', progress: 0, status: 'À venir' },
  { id: 4, title: 'Transmission & Évaluation', description: 'Micro-enseignement, ticket et épreuve technique finale.', icon: 'bx-certification', sessions: 'S7 & S8', progress: 0, status: 'À venir' }
])

const activities = ref<Activity[]>([
  { id: 1, type: 'Lab 1 validé', text: 'Diagnostic et réparation d\'un poste de caisse.', time: 'Aujourd\'hui, 10:30', icon: 'bx-check' },
  { id: 2, type: 'Session terminée', text: 'Écoute active et reformulation (S2).', time: 'Hier, 17:00', icon: 'bx-book-open' },
  { id: 3, type: 'Début du module', text: 'Introduction au métier du support.', time: '12 Oct. 2024', icon: 'bx-play-circle' }
])

// ==================== COMPUTED ====================
// Calcule la progression globale basée sur les sessions terminées
const completedSessions = computed(() => {
  return jours.value.reduce((acc, jour) => acc + (jour.progress / 100) * 2, 0)
})

const globalProgress = computed(() => {
  return Math.round((completedSessions.value / 8) * 100)
})
</script>
