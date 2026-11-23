<template>
  <div class="app-page">
    <!-- ================= EN-TÊTE ================= -->
    <header class="app-page-header">
      <div>
        <h1 class="app-page-title">Gestion des Cohortes</h1>
        <p class="app-page-copy">Sessions par filière : effectifs, statut et dates.</p>
      </div>
      <div>
        <button
          @click="openCreateModal"
          class="app-action-primary"
          data-testid="btn-open-create-cohort"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Nouvelle cohorte
        </button>
      </div>
    </header>

    <!-- ================= NOTIFICATION DE DRAINAGE STANDBY ================= -->
    <div
      v-if="drainedNotification"
      class="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm font-semibold text-primary shadow-sm"
      data-testid="cohort-drained-notification"
    >
      <div class="flex items-center gap-3">
        <svg
          class="h-5 w-5 text-primary shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{{ drainedNotification }}</span>
      </div>
      <button
        @click="drainedNotification = null"
        class="text-primary hover:text-ink transition p-1"
        title="Fermer"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- ================= FILTRES ================= -->
    <div class="bg-white rounded-xl shadow-sm border border-line p-4">
      <div class="flex flex-col md:flex-row gap-4">
        <select
          v-model="filterPathwayKey"
          class="px-4 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-ink bg-white min-w-[200px]"
        >
          <option value="">Toutes les filières</option>
          <option v-for="pathway in pathways" :key="pathway.key" :value="pathway.key">
            {{ pathway.name }}
          </option>
        </select>
        <select
          v-model="filterStatus"
          class="px-4 py-2.5 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm text-ink bg-white min-w-[170px]"
        >
          <option value="">Tous les statuts</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- ================= RÉSUMÉ GLOBAL (calculé depuis les cohortes réellement chargées) ================= -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-sm p-5 border border-line flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm text-quiet font-medium">Total inscrits</p>
          <p class="text-2xl font-bold text-ink">{{ totalEnrolled }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5 border border-line flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm text-quiet font-medium">Sessions actives</p>
          <p class="text-2xl font-bold text-primary">
            {{ activeCount }}
            <span class="text-sm text-quiet font-normal">/ {{ cohorts.length }}</span>
          </p>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm p-5 border border-line flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <div>
          <p class="text-sm text-quiet font-medium">Sessions terminées</p>
          <p class="text-2xl font-bold text-ink">
            {{ completedCount }}
            <span class="text-sm text-quiet font-normal">/ {{ cohorts.length }}</span>
          </p>
        </div>
      </div>
    </div>

    <!-- ================= ÉTATS ================= -->
    <div v-if="isPending" class="text-center text-quiet py-10">Chargement des cohortes…</div>
    <div v-else-if="isError" class="text-center text-red-600 py-10">
      {{ (error as ApiError)?.message ?? 'Impossible de charger les cohortes.' }}
    </div>
    <div v-else-if="cohorts.length === 0" class="text-center text-quiet py-10">
      Aucune cohorte ne correspond à vos critères.
    </div>

    <!-- ================= CARTES DES COHORTES ================= -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="cohort in cohorts"
        :key="cohort.key"
        class="overflow-hidden rounded-[18px] border border-line bg-white shadow-panel hover:shadow-md transition flex flex-col"
      >
        <!-- En-tête de la carte -->
        <div class="p-5 border-b border-line flex justify-between items-start bg-canvas/50">
          <div class="flex items-center gap-3">
            <div
              class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0"
            >
              {{ cohort.code.slice(0, 4) }}
            </div>
            <div>
              <h3 class="font-bold text-ink">{{ cohort.pathway?.name ?? '-' }}</h3>
              <p class="text-xs text-quiet">{{ cohort.session ?? cohort.code }}</p>
            </div>
          </div>
          <span
            class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0"
            :class="statusBadgeClass(cohort.status)"
          >
            {{ statusLabel(cohort.status) }}
          </span>
        </div>

        <!-- Corps de la carte (Effectif, Capacité & Places disponibles) -->
        <div class="p-5 flex-1 space-y-4">
          <div>
            <div class="flex justify-between text-sm mb-1.5">
              <span class="text-quiet font-medium">Effectif / Capacité</span>
              <span class="font-bold text-ink">
                {{ enrolledCount(cohort) }} /
                {{
                  cohort.capacity !== null && cohort.capacity !== undefined
                    ? cohort.capacity
                    : 'Illimitée'
                }}
              </span>
            </div>

            <!-- Jauge de remplissage -->
            <div v-if="cohort.capacity" class="w-full bg-canvas rounded-full h-2 overflow-hidden">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{
                  width: Math.min(100, (enrolledCount(cohort) / cohort.capacity) * 100) + '%',
                }"
              ></div>
            </div>

            <!-- Indicateur places disponibles -->
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-quiet">Places disponibles</span>
              <span
                v-if="availableSeats(cohort) !== null"
                class="font-bold rounded-md px-2 py-0.5"
                :class="
                  (availableSeats(cohort) ?? 0) > 0
                    ? 'bg-primary/10 text-primary'
                    : 'bg-red-100 text-red-700'
                "
              >
                {{
                  (availableSeats(cohort) ?? 0) > 0 ? `${availableSeats(cohort)} places` : 'Complet'
                }}
              </span>
              <span v-else class="font-bold rounded-md px-2 py-0.5 bg-primary/10 text-primary">
                Illimitées
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-canvas p-2 rounded-lg">
              <p class="text-xs text-quiet mb-0.5">Début</p>
              <p class="font-medium text-ink">{{ formatDate(cohort.starts_at) }}</p>
            </div>
            <div class="bg-canvas p-2 rounded-lg">
              <p class="text-xs text-quiet mb-0.5">Fin</p>
              <p class="font-medium text-ink">{{ formatDate(cohort.ends_at) }}</p>
            </div>
          </div>

          <!-- Phase présentielle tag -->
          <div
            v-if="cohort.offline_starts_at"
            class="mt-2.5 flex items-center gap-2 rounded-lg bg-mint border border-primary/25 px-3 py-1.5 text-xs font-semibold text-primary-shade"
            data-testid="cohort-offline-tag"
          >
            <svg
              class="h-4 w-4 text-primary-shade shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <span>Présentiel : dès le {{ formatDate(cohort.offline_starts_at) }}</span>
          </div>
        </div>

        <!-- Pied de la carte -->
        <div
          class="p-4 border-t border-line bg-canvas text-xs text-quiet flex flex-wrap items-center justify-between gap-2"
        >
          <span
            >Code : <strong class="font-medium text-ink">{{ cohort.code }}</strong></span
          >
          <div class="flex items-center gap-1.5">
            <button
              v-if="cohort.offline_starts_at"
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line bg-white hover:bg-canvas text-ink font-semibold text-xs transition shadow-sm"
              data-testid="btn-cohort-attendance"
              @click="openAttendanceModal(cohort)"
            >
              Présences
            </button>
            <button
              type="button"
              @click="openMembersDrawer(cohort)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white font-bold text-xs transition shadow-sm"
              data-testid="btn-view-cohort-members"
            >
              <svg
                class="w-3.5 h-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              Voir les apprenants ({{ enrolledCount(cohort) }})
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ================= MODALE CRÉATION DE COHORTE ================= -->
    <div
      v-if="isCreateModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      data-testid="create-cohort-modal"
      role="dialog"
      aria-modal="true"
    >
      <div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-5">
        <div class="flex items-center justify-between border-b border-line pb-4">
          <div>
            <h3 class="text-lg font-bold text-ink">Créer une nouvelle cohorte</h3>
            <p class="text-xs text-quiet mt-0.5">
              Paramétrez la nouvelle promotion et sa capacité.
            </p>
          </div>
          <button
            @click="closeCreateModal"
            class="rounded-lg p-1.5 text-quiet transition hover:bg-canvas hover:text-ink"
            title="Fermer"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form @submit.prevent="submitCreateCohort" class="space-y-4">
          <div
            v-if="createError"
            class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600"
          >
            {{ createError }}
          </div>

          <!-- Filière -->
          <div>
            <label class="app-label mb-1 block"> Filière * </label>
            <select
              v-model="createForm.pathway_key"
              required
              class="app-input w-full"
              data-testid="cohort-pathway-select"
            >
              <option value="" disabled>Sélectionner une filière</option>
              <option v-for="pathway in pathways" :key="pathway.key" :value="pathway.key">
                {{ pathway.name }} ({{ pathway.code }})
              </option>
            </select>
          </div>

          <!-- Code & Nom -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="app-label mb-1 block"> Code Cohorte * </label>
              <input
                v-model="createForm.code"
                type="text"
                required
                placeholder="Ex : DW-2026-P2"
                class="app-input w-full"
                data-testid="cohort-code-input"
              />
            </div>
            <div>
              <label class="app-label mb-1 block"> Nom de la cohorte * </label>
              <input
                v-model="createForm.name"
                type="text"
                required
                placeholder="Ex : Promo Mars 2026"
                class="app-input w-full"
                data-testid="cohort-name-input"
              />
            </div>
          </div>

          <!-- Capacité d'accueil (défaut 100) -->
          <div>
            <label class="app-label mb-1 block"> Capacité d'accueil * </label>
            <input
              v-model.number="createForm.capacity"
              type="number"
              min="1"
              max="100000"
              required
              class="app-input w-full"
              data-testid="cohort-capacity-input"
            />
            <p class="text-[11px] text-quiet mt-1">Pré-rempli à 100 places par défaut.</p>
          </div>

          <!-- Dates en ligne (obligatoires) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="app-label mb-1 block"> Date de début (en ligne) * </label>
              <input
                v-model="createForm.starts_at"
                type="date"
                required
                class="app-input w-full"
                data-testid="cohort-starts-at-input"
              />
            </div>
            <div>
              <label class="app-label mb-1 block"> Date de fin (en ligne) * </label>
              <input
                v-model="createForm.ends_at"
                type="date"
                required
                class="app-input w-full"
                data-testid="cohort-ends-at-input"
              />
            </div>
          </div>

          <!-- Phase présentielle / Ateliers (optionnel) -->
          <div class="rounded-xl border border-line bg-canvas/40 p-3.5 space-y-3">
            <div>
              <h4 class="text-xs font-bold uppercase tracking-wider text-ink">
                Phase présentielle / Ateliers (optionnel)
              </h4>
              <p class="text-[11px] text-quiet mt-0.5">
                Généralement après les cours en ligne pour les ateliers pratiques.
              </p>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-quiet mb-1">
                  Début cours présentiels
                </label>
                <input
                  v-model="createForm.offline_starts_at"
                  type="date"
                  class="app-input w-full"
                  data-testid="cohort-offline-starts-at-input"
                />
                <p class="text-[10px] text-quiet mt-1">Généralement après les cours en ligne.</p>
              </div>
              <div>
                <label class="block text-xs font-medium text-quiet mb-1">
                  Fin cours présentiels
                </label>
                <input
                  v-model="createForm.offline_ends_at"
                  type="date"
                  class="app-input w-full"
                  data-testid="cohort-offline-ends-at-input"
                />
                <p class="text-[10px] text-quiet mt-1">Non obligatoire.</p>
              </div>
            </div>
          </div>

          <!-- Statut -->
          <div>
            <label class="app-label mb-1 block"> Statut initial </label>
            <select
              v-model="createForm.status"
              class="app-input w-full"
              data-testid="cohort-status-select"
            >
              <option value="open">Ouverte (accepte les inscriptions et draine le standby)</option>
              <option value="planned">Planifiée</option>
            </select>
          </div>

          <!-- Boutons -->
          <div class="flex items-center justify-end gap-3 pt-3 border-t border-line">
            <button
              type="button"
              @click="closeCreateModal"
              class="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-canvas"
            >
              Annuler
            </button>
            <button
              type="submit"
              :disabled="createMutation.isPending.value"
              class="app-action-primary"
              data-testid="btn-submit-create-cohort"
            >
              Créer la cohorte
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ================= VOLET LATÉRAL / TIROIR DES APPRENANTS ================= -->
    <div
      v-if="isMembersDrawerOpen"
      class="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      data-testid="cohort-members-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-cohort-members-title"
      @click.self="closeMembersDrawer"
    >
      <div
        class="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl animate-drawer sm:max-w-2xl"
      >
        <!-- En-tête du volet -->
        <div class="flex items-center justify-between border-b border-line bg-canvas px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold text-sm shadow-md shadow-primary/20"
            >
              {{ selectedCohort?.code?.slice(0, 4) ?? 'COH' }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="app-eyebrow"> Apprenants de la cohorte </span>
                <span
                  v-if="selectedCohort"
                  class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  :class="statusBadgeClass(selectedCohort.status)"
                >
                  {{ statusLabel(selectedCohort.status) }}
                </span>
              </div>
              <h3 id="drawer-cohort-members-title" class="text-lg font-bold text-ink">
                {{ selectedCohort?.name ?? selectedCohort?.code }}
              </h3>
              <p class="text-xs text-quiet">Code : {{ selectedCohort?.code }}</p>
            </div>
          </div>
          <button
            type="button"
            @click="closeMembersDrawer"
            class="rounded-lg p-2 text-quiet transition hover:bg-canvas hover:text-ink"
            data-testid="btn-close-members-drawer"
            title="Fermer"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Bannière statistiques rapides -->
        <div class="border-b border-line bg-canvas/40 px-6 py-3.5 grid grid-cols-2 gap-4 text-xs">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-primary/10 text-primary">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-quiet font-medium">Inscrits / Capacité</p>
              <p class="font-bold text-ink text-sm">
                {{ selectedCohort ? enrolledCount(selectedCohort) : 0 }} /
                {{
                  selectedCohort?.capacity !== null && selectedCohort?.capacity !== undefined
                    ? selectedCohort.capacity
                    : 'Illimitée'
                }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-blue-50 text-blue-700">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p class="text-quiet font-medium">Places restantes</p>
              <p class="font-bold text-ink text-sm">
                {{
                  selectedCohort && availableSeats(selectedCohort) !== null
                    ? `${availableSeats(selectedCohort)} places`
                    : 'Illimitées'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Recherche et filtres de membres -->
        <div class="p-4 border-b border-line bg-white flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <input
              v-model="membersSearchQuery"
              type="text"
              placeholder="Rechercher par nom ou email…"
              class="w-full pl-9 pr-4 py-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              data-testid="cohort-members-search"
            />
            <svg
              class="w-4 h-4 text-quiet absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <select
            v-model="membersStatusFilter"
            class="px-3 py-2 border border-line rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
            data-testid="cohort-members-status-filter"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="enrolled">Inscrit</option>
            <option value="suspended">Suspendu</option>
            <option value="completed">Terminé</option>
          </select>
        </div>

        <!-- Corps : Liste des apprenants -->
        <div class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div v-if="isMembersPending" class="py-12 text-center text-quiet text-sm">
            Chargement des apprenants…
          </div>
          <div v-else-if="isMembersError" class="py-12 text-center text-red-600 text-sm">
            {{ (membersError as ApiError)?.message ?? 'Impossible de charger les apprenants.' }}
          </div>
          <div
            v-else-if="cohortMembersList.length === 0"
            class="py-12 text-center text-quiet text-sm"
            data-testid="cohort-members-empty"
          >
            Aucun apprenant dans cette cohorte pour le moment
          </div>
          <div
            v-else
            v-for="member in cohortMembersList"
            :key="member.key"
            class="flex items-center justify-between rounded-xl border border-line p-3.5 bg-white hover:bg-canvas/40 transition shadow-sm"
            data-testid="cohort-member-row"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs"
              >
                {{ initialsOf(member.name) }}
              </div>
              <div class="min-w-0">
                <p class="font-bold text-ink text-sm truncate" data-testid="cohort-member-name">
                  {{ member.name }}
                </p>
                <p class="text-xs text-quiet truncate" data-testid="cohort-member-email">
                  {{ member.email }}
                </p>
                <p class="text-[11px] text-quiet mt-0.5" data-testid="cohort-member-joined">
                  Inscrit le {{ formatDate(member.joined_at) }}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <!-- Progression cours -->
              <div
                v-if="member.progress_rate !== null && member.progress_rate !== undefined"
                class="hidden sm:flex flex-col items-end text-right"
                data-testid="cohort-member-progress"
              >
                <span class="text-[11px] font-semibold text-ink">
                  Cours : {{ Math.round(member.progress_rate * 100) }}%
                </span>
                <span class="text-[10px] text-quiet">
                  {{ member.completed_chapters_count ?? 0 }}/{{ member.total_chapters_count ?? 0 }}
                  chap.
                </span>
              </div>

              <!-- Taux d'assiduité -->
              <div
                v-if="member.attendance_rate !== null && member.attendance_rate !== undefined"
                class="hidden sm:flex flex-col items-end text-right"
                data-testid="cohort-member-attendance"
              >
                <span
                  class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                  :class="
                    member.attendance_rate >= 0.8
                      ? 'bg-mint text-primary-shade border border-primary/25'
                      : member.attendance_rate >= 0.5
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                  "
                >
                  Assiduité {{ Math.round(member.attendance_rate * 100) }}%
                </span>
              </div>

              <div class="text-right">
                <span
                  class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                  :class="memberStatusBadgeClass(member.status)"
                  data-testid="cohort-member-status"
                >
                  {{ memberStatusLabel(member.status) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Pied du tiroir -->
        <div
          class="border-t border-line bg-canvas/50 px-6 py-3 flex items-center justify-between text-xs text-quiet"
        >
          <span>Total affiché : {{ cohortMembersList.length }}</span>
          <button
            type="button"
            @click="closeMembersDrawer"
            class="rounded-lg border border-line bg-white px-3.5 py-1.5 font-semibold text-ink hover:bg-canvas transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>

    <!-- Modale de pointage / assiduité -->
    <CohortAttendanceModal
      v-if="isAttendanceModalOpen"
      :open="isAttendanceModalOpen"
      :cohort-key="attendanceCohortKey"
      :cohort-name="attendanceCohortName"
      @close="isAttendanceModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { ApiError } from '@/api/http'
import CohortAttendanceModal from '@/features/cohorts/components/CohortAttendanceModal.vue'
import { useCatalogPathways } from '@/features/public/composables/useCatalogPathways'
import {
  useCohorts,
  useCreateCohort,
  useCohortMembers,
  type Cohort,
  type CohortListFilters,
  type CohortMember,
  type CohortMemberFilters,
} from '../composables/useCohorts'

const filterPathwayKey = ref('')
const filterStatus = ref('')

const filters = computed<CohortListFilters>(() => ({
  pathwayKey: filterPathwayKey.value || undefined,
  status: filterStatus.value || undefined,
}))

const { data, isPending, isError, error } = useCohorts(filters)
const cohorts = computed(() => data.value?.items ?? [])

const { data: pathways } = useCatalogPathways()

const statusOptions = [
  { value: 'planned', label: 'Planifiée' },
  { value: 'open', label: 'Ouverte' },
  { value: 'running', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' },
]

function statusLabel(status: string): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-primary/10 text-primary'
    case 'open':
    case 'running':
      return 'bg-blue-100 text-blue-700'
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-canvas text-quiet'
  }
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

function enrolledCount(cohort: Cohort): number {
  return cohort.enrolled_count ?? cohort.enrollments_count ?? 0
}

function availableSeats(cohort: Cohort): number | null {
  if (cohort.available_seats !== undefined && cohort.available_seats !== null) {
    return cohort.available_seats
  }
  if (cohort.capacity === null || cohort.capacity === undefined) {
    return null
  }
  return Math.max(0, cohort.capacity - enrolledCount(cohort))
}

const totalEnrolled = computed(() =>
  cohorts.value.reduce((sum, cohort) => sum + enrolledCount(cohort), 0),
)
const activeCount = computed(
  () =>
    cohorts.value.filter((cohort) => cohort.status === 'open' || cohort.status === 'running')
      .length,
)
const completedCount = computed(
  () => cohorts.value.filter((cohort) => cohort.status === 'completed').length,
)

// ==================== CRÉATION DE COHORTE ====================
const isCreateModalOpen = ref(false)
const createError = ref<string | null>(null)
const drainedNotification = ref<string | null>(null)

const createForm = reactive({
  pathway_key: '',
  code: '',
  name: '',
  capacity: 100, // Pre-filled with 100 by default
  starts_at: '',
  ends_at: '',
  offline_starts_at: '',
  offline_ends_at: '',
  status: 'open',
})

const createMutation = useCreateCohort()

watch(
  () => createForm.pathway_key,
  (newPathwayKey) => {
    if (!newPathwayKey) return
    const pathway = pathways.value?.find((p) => p.key === newPathwayKey)
    if (!pathway) return

    const currentYear = new Date().getFullYear()
    const existingCount = cohorts.value.filter((c) => {
      const matchesPathway = c.pathway?.key === newPathwayKey || c.pathway?.code === pathway.code
      if (!matchesPathway) return false

      const yearFromStart = c.starts_at ? new Date(c.starts_at).getFullYear() : null
      const yearFromCreated = c.created_at ? new Date(c.created_at).getFullYear() : null
      const yearInCode = c.code ? c.code.includes(`-${currentYear}-`) : false
      return yearFromStart === currentYear || yearFromCreated === currentYear || yearInCode
    }).length

    const sequence = existingCount + 1
    createForm.code = `${pathway.code}-${currentYear}-C${sequence}`
    createForm.name = `${pathway.name} — Cohorte ${sequence}`
  },
)

function openCreateModal() {
  createForm.pathway_key = ''
  createForm.code = ''
  createForm.name = ''
  createForm.capacity = 100
  createForm.starts_at = ''
  createForm.ends_at = ''
  createForm.offline_starts_at = ''
  createForm.offline_ends_at = ''
  createForm.status = 'open'
  createError.value = null
  isCreateModalOpen.value = true
}

function closeCreateModal() {
  isCreateModalOpen.value = false
  createError.value = null
}

async function submitCreateCohort() {
  if (!createForm.pathway_key || !createForm.code || !createForm.name) {
    createError.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }

  if (
    createForm.capacity === null ||
    createForm.capacity === undefined ||
    isNaN(Number(createForm.capacity)) ||
    Number(createForm.capacity) < 1
  ) {
    createError.value = "La capacité doit être d'au moins 1 place."
    return
  }

  if (!createForm.starts_at || !createForm.ends_at) {
    createError.value = 'Veuillez renseigner les dates de début et de fin en ligne.'
    return
  }

  if (createForm.ends_at < createForm.starts_at) {
    createError.value = 'La date de fin doit être postérieure ou égale à la date de début.'
    return
  }

  if (createForm.offline_starts_at && createForm.offline_starts_at < createForm.starts_at) {
    createError.value =
      'La date de début du présentiel doit être postérieure ou égale à la date de début de la cohorte.'
    return
  }

  if (createForm.offline_ends_at) {
    if (!createForm.offline_starts_at) {
      createError.value =
        'Veuillez renseigner une date de début du présentiel avant la date de fin.'
      return
    }
    if (createForm.offline_ends_at < createForm.offline_starts_at) {
      createError.value =
        'La date de fin du présentiel doit être postérieure ou égale à la date de début du présentiel.'
      return
    }
  }

  createError.value = null

  try {
    const result = await createMutation.mutateAsync({
      pathway_key: createForm.pathway_key,
      code: createForm.code,
      name: createForm.name,
      capacity: createForm.capacity ?? 100,
      starts_at: createForm.starts_at,
      ends_at: createForm.ends_at,
      offline_starts_at: createForm.offline_starts_at || undefined,
      offline_ends_at: createForm.offline_ends_at || undefined,
      status: createForm.status,
    })

    const drained = result.drained_standby_count ?? 0
    drainedNotification.value = `Cohorte créée. ${drained} apprenant(s) en standby ont été automatiquement intégrés.`

    closeCreateModal()
  } catch (err) {
    createError.value = (err as ApiError).displayMessage || 'Impossible de créer la cohorte.'
  }
}

// ==================== TIROIR DES APPRENANTS ====================
const selectedCohort = ref<Cohort | null>(null)
const isMembersDrawerOpen = ref(false)
const membersSearchQuery = ref('')
const membersStatusFilter = ref('')

const membersFilters = computed<CohortMemberFilters>(() => ({
  q: membersSearchQuery.value.trim() || undefined,
  status: membersStatusFilter.value || undefined,
}))

const selectedCohortKey = computed(() => selectedCohort.value?.key ?? '')
const {
  data: membersData,
  isPending: isMembersPending,
  isError: isMembersError,
  error: membersError,
} = useCohortMembers(selectedCohortKey, membersFilters)

const cohortMembersList = computed<CohortMember[]>(() => {
  const items = (membersData.value?.items ?? []) as CohortMember[]
  let list = items
  const q = membersSearchQuery.value.trim().toLowerCase()
  if (q) {
    list = list.filter(
      (m: CohortMember) => m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q),
    )
  }
  const s = membersStatusFilter.value.trim().toLowerCase()
  if (s) {
    list = list.filter((m: CohortMember) => m.status?.toLowerCase() === s)
  }
  return list
})

function openMembersDrawer(cohort: Cohort) {
  selectedCohort.value = cohort
  membersSearchQuery.value = ''
  membersStatusFilter.value = ''
  isMembersDrawerOpen.value = true
}

function closeMembersDrawer() {
  isMembersDrawerOpen.value = false
  selectedCohort.value = null
  membersSearchQuery.value = ''
  membersStatusFilter.value = ''
}

// ==================== MODAL ÉMARGEMENT / PRÉSENCES ====================
const isAttendanceModalOpen = ref(false)
const attendanceCohortKey = ref('')
const attendanceCohortName = ref('')

function openAttendanceModal(cohort: Cohort) {
  attendanceCohortKey.value = cohort.key
  attendanceCohortName.value = cohort.name
  isAttendanceModalOpen.value = true
}

function initialsOf(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return (parts[0]?.[0] ?? '?').toUpperCase()
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase() || '?'
}

function memberStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Actif'
    case 'enrolled':
      return 'Inscrit'
    case 'suspended':
      return 'Suspendu'
    case 'completed':
      return 'Terminé'
    case 'cancelled':
      return 'Annulé'
    default:
      return status
  }
}

function memberStatusBadgeClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-mint text-primary-shade border-primary/25'
    case 'enrolled':
      return 'bg-blue-50 text-blue-700 border-blue-200'
    case 'suspended':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'completed':
      return 'bg-purple-50 text-purple-700 border-purple-200'
    default:
      return 'bg-canvas text-body border-line'
  }
}

function handleGlobalKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (isAttendanceModalOpen.value) {
      isAttendanceModalOpen.value = false
    } else if (isMembersDrawerOpen.value) {
      closeMembersDrawer()
    } else if (isCreateModalOpen.value) {
      closeCreateModal()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<style scoped>
@keyframes drawerIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-drawer {
  animation: drawerIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
}
</style>
