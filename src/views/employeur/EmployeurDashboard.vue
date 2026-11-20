<template>
  <div class="space-y-6 pb-10">
    <!-- En-tête -->
    <div class="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span class="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3 inline-block">Espace Recruteur</span>
          <h1 class="text-2xl sm:text-3xl font-extrabold mb-2">Bienvenue, Employeur</h1>
          <p class="text-indigo-100 text-sm max-w-lg">Gérez les candidatures et suivez l'avancement des formations pour vos futurs collaborateurs.</p>
        </div>
      </div>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <i class='bx bx-file text-2xl'></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Dossiers en attente</p>
          <p class="text-2xl font-bold text-gray-800">12</p>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <i class='bx bx-user-check text-2xl'></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Formateurs actifs</p>
          <p class="text-2xl font-bold text-gray-800">45</p>
        </div>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
          <i class='bx bx-book-content text-2xl'></i>
        </div>
        <div>
          <p class="text-xs text-gray-500 font-medium">Rapports soumis</p>
          <p class="text-2xl font-bold text-gray-800">128</p>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <router-link to="/employeur/candidatures" class="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:shadow-md transition group flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
          <i class='bx bx-folder-open text-2xl'></i>
        </div>
        <div>
          <h3 class="font-bold text-gray-800 text-lg mb-1">Examiner les dossiers</h3>
          <p class="text-sm text-gray-500">Consultez les nouvelles candidatures et soumettez vos demandes d'admission ou de refus à l'administration.</p>
        </div>
      </router-link>

      <router-link to="/employeur/formateurs" class="bg-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition group flex items-start gap-4">
        <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
          <i class='bx bx-line-chart text-2xl'></i>
        </div>
        <div>
          <h3 class="font-bold text-gray-800 text-lg mb-1">Suivi des formateurs</h3>
          <p class="text-sm text-gray-500">Vérifiez si les formateurs ont bien déposé leurs cours et rapports d'avancement.</p>
        </div>
      </router-link>
    </div>
  </div>
</template>
