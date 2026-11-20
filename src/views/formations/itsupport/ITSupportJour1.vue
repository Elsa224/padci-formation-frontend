<template>
  <div class="flex flex-col h-[calc(100vh-8rem)] relative">

    <!-- BARRE D'OUTILS SUPÉRIEURE -->
    <div class="bg-white border-b border-gray-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-t-xl shadow-sm z-10 shrink-0">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-sm">
          <i class='bx bx-headphone text-2xl'></i>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-0.5">
            <span class="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Jour 1 / 4</span>
            <span class="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">S1 & S2</span>
          </div>
          <h1 class="text-lg font-bold text-gray-800">Découvrir le métier du support</h1>
        </div>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <a
          :href="pdfUrl"
          download="ITSupport_Jour1.pdf"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Télécharger
        </a>
        <a
          :href="pdfUrl"
          target="_blank"
          class="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-md shadow-slate-800/20"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          Plein écran
        </a>
      </div>
    </div>

    <!-- LECTEUR PDF INTÉGRÉ -->
    <div class="flex-1 relative bg-gray-100 rounded-b-xl overflow-hidden shadow-inner border border-t-0 border-gray-200">
      <iframe
        :src="`${pdfUrl}#toolbar=1&navpanes=0`"
        class="w-full h-full border-none"
        title="Support de cours IT Support - Jour 1"
      ></iframe>
    </div>

    <!-- BOUTON SUIVANT -->
    <div class="mt-4 flex justify-end shrink-0">
      <router-link
        to="/formations/itsupport/jour2"
        class="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold transition shadow-lg flex items-center gap-2"
      >
        Passer au Jour 2
        <i class='bx bx-right-arrow-alt text-xl'></i>
      </router-link>
    </div>

  </div>
</template>

<script setup lang="ts">

const pdfUrl = '/public/Module3_ITSupport_Journee_1_Pages_13_a_41.pdf'
</script>
