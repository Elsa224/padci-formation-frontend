<template>
  <div class="space-y-6 pb-10">
    <!-- En-tête -->
    <div class="bg-gradient-to-r from-violet-600 to-violet-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
      <div class="absolute -right-10 -top-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span class="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Espace Formateur</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">Bienvenue, M. Traoré</h1>
          <p class="text-violet-100 text-sm max-w-lg">Gérez vos cours, vos listes de présence et déposez vos rapports d'avancement.</p>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
          <i class='bx bx-book-open text-2xl'></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Cours publiés</p>
          <p class="text-2xl font-bold text-gray-800">12</p>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <i class='bx bx-group text-2xl'></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Apprenants</p>
          <p class="text-2xl font-bold text-gray-800">45</p>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <i class='bx bx-check-circle text-2xl'></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Présence moyenne</p>
          <p class="text-2xl font-bold text-gray-800">92%</p>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
          <i class='bx bx-file-blank text-2xl'></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Rapports en attente</p>
          <p class="text-2xl font-bold text-gray-800">1</p>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <router-link to="/formateur/cours" class="bg-white rounded-xl shadow-sm border border-violet-100 p-6 hover:shadow-md transition group flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
          <i class='bx bx-upload text-2xl'></i>
        </div>
        <div>
          <h3 class="font-bold text-gray-800 text-lg mb-1">Déposer un cours</h3>
          <p class="text-sm text-gray-500">Mettez en ligne vos supports de formation (PDF, vidéos).</p>
        </div>
      </router-link>

      <router-link to="/formateur/presences" class="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition group flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
          <i class='bx bx-user-check text-2xl'></i>
        </div>
        <div>
          <h3 class="font-bold text-gray-800 text-lg mb-1">Faire l'appel</h3>
          <p class="text-sm text-gray-500">Remplissez la liste de présence pour la cohorte du jour.</p>
        </div>
      </router-link>

      <router-link to="/formateur/rapports" class="bg-white rounded-xl shadow-sm border border-amber-100 p-6 hover:shadow-md transition group flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
          <i class='bx bx-file-blank text-2xl'></i>
        </div>
        <div>
          <h3 class="font-bold text-gray-800 text-lg mb-1">Déposer un rapport</h3>
          <p class="text-sm text-gray-500">Soumettez votre rapport d'avancement à l'administration.</p>
        </div>
      </router-link>
    </div>

    <!-- Prochaines sessions -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <i class='bx bx-calendar text-violet-600 text-xl'></i> Prochaines sessions
      </h3>
      <div class="space-y-3">
        <div v-for="(session, i) in sessions" :key="i" class="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-lg bg-violet-100 text-violet-700 flex flex-col items-center justify-center font-bold">
              <span class="text-xs uppercase">{{ session.mois }}</span>
              <span class="text-lg leading-none">{{ session.jour }}</span>
            </div>
            <div>
              <p class="font-bold text-gray-800">{{ session.titre }}</p>
              <p class="text-xs text-gray-500">{{ session.horaire }} · {{ session.lieu }}</p>
            </div>
          </div>
          <span class="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">{{ session.cohorte }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const sessions = ref([
  { mois: 'Oct', jour: '24', titre: 'Introduction au Pentesting', horaire: '09h00 - 12h30', lieu: 'Salle B12', cohorte: 'Cohorte A' },
  { mois: 'Oct', jour: '25', titre: 'Les bases du VLAN', horaire: '13h30 - 17h00', lieu: 'LMS (En ligne)', cohorte: 'Cohorte B' },
  { mois: 'Oct', jour: '26', titre: 'TP - Configuration OSPF', horaire: '08h30 - 12h30', lieu: 'Labo Info 1', cohorte: 'Cohorte A' },
])
</script>
