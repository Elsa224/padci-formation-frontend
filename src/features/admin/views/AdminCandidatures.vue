<template>
  <section class="app-page" aria-labelledby="admin-applications-title">
    <!-- ================= EN-TÊTE ================= -->
    <header class="app-page-header">
      <div>
        <h1 id="admin-applications-title" class="app-page-title">File de candidatures</h1>
        <p class="app-page-copy">
          File d'admission : revue et décision sur les candidatures soumises par les apprenants.
        </p>
      </div>
    </header>

    <!-- ================= BARRE D'OUTILS (Filtres) ================= -->
    <div class="app-panel p-4 sm:p-5">
      <div class="flex flex-col gap-3 md:flex-row">
        <!-- Recherche -->
        <div class="relative flex-1">
          <svg
            class="w-5 h-5 text-quiet absolute left-3 top-1/2 -translate-y-1/2"
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
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un nom, un email..."
            class="app-input pl-10"
          />
        </div>

        <!-- Filtre Filière (filières réelles du catalogue) -->
        <select v-model="filterPathwayKey" class="app-input md:w-56">
          <option value="">Toutes les filières</option>
          <option v-for="pathway in pathways" :key="pathway.key" :value="pathway.key">
            {{ pathway.name }}
          </option>
        </select>

        <!-- Filtre Statut -->
        <select v-model="filterStatus" class="app-input md:w-48">
          <option value="">Tous les statuts</option>
          <option v-for="status in statusOptions" :key="status.value" :value="status.value">
            {{ status.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- ================= TABLEAU DES CANDIDATURES ================= -->
    <div class="app-panel overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="app-thead border-b border-line bg-canvas">
              <th class="py-4 px-6">Candidat</th>
              <th class="py-4 px-6">Filière</th>
              <th class="py-4 px-6">Session</th>
              <th class="py-4 px-6">Date de dépôt</th>
              <th class="py-4 px-6">Statut</th>
              <th class="py-4 px-6 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line text-sm">
            <tr v-if="isPending">
              <td colspan="6" class="py-10 text-center text-quiet">Chargement des candidatures…</td>
            </tr>

            <tr v-else-if="isError">
              <td colspan="6" class="py-10 text-center text-danger-ink">
                {{ (error as ApiError)?.message ?? 'Impossible de charger les candidatures.' }}
              </td>
            </tr>

            <tr v-else-if="applications.length === 0">
              <td colspan="6" class="py-10 text-center text-quiet">
                Aucune candidature ne correspond à vos critères.
              </td>
            </tr>

            <tr
              v-for="application in applications"
              :key="application.key"
              class="transition hover:bg-primary/[0.025]"
            >
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary"
                  >
                    {{ initialsOf(application.user?.name) }}
                  </div>
                  <div>
                    <p class="font-bold text-ink">{{ application.user?.name ?? '-' }}</p>
                    <p class="text-xs text-quiet">{{ application.user?.email ?? '-' }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 font-medium text-ink">
                {{ application.pathway?.name ?? '-' }}
              </td>
              <td class="px-6 py-4 text-quiet">
                {{ application.cohort?.code ?? application.cohort?.session ?? 'Standby / Ouverte' }}
              </td>
              <td class="px-6 py-4 text-quiet">
                {{ formatDate(application.submitted_at) }}
              </td>
              <td class="py-4 px-6">
                <span
                  class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                  :class="statusBadgeClass(application.status)"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full"
                    :class="statusDotClass(application.status)"
                  ></span>
                  {{ statusLabel(application.status) }}
                </span>
                <p
                  v-if="
                    application.equipment_review &&
                    !equipmentAllowsAdmission(application.equipment_review.status)
                  "
                  class="mt-1 text-xs font-medium text-warning-ink"
                >
                  Matériel : {{ equipmentReviewLabel(application.equipment_review.status) }}
                </p>
              </td>
              <td class="py-4 px-6 text-center">
                <button
                  @click="openModal(application.key)"
                  class="rounded-lg p-2 text-primary transition hover:bg-primary/10"
                  title="Voir le dossier"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION (réelle, meta.pagination du backend) -->
      <div
        v-if="pagination"
        class="flex flex-col items-center justify-between gap-4 border-t border-line bg-canvas px-6 py-4 sm:flex-row"
      >
        <span class="text-sm text-quiet">
          Affichage de <span class="font-semibold text-ink">{{ pagination.from ?? 0 }}</span> à
          <span class="font-semibold text-ink">{{ pagination.to ?? 0 }}</span> sur
          <span class="font-semibold text-ink">{{ pagination.total ?? 0 }}</span> candidatures
        </span>
        <nav class="inline-flex rounded-md shadow-sm -space-x-px">
          <button
            @click="page > 1 && page--"
            :disabled="page === 1"
            class="rounded-l-lg border border-line bg-white px-3 py-2 text-quiet transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span class="border-y border-line bg-white px-4 py-2 text-sm font-medium text-ink">
            {{ pagination.current_page }} / {{ pagination.last_page ?? 1 }}
          </span>
          <button
            @click="page < (pagination.last_page ?? 1) && page++"
            :disabled="page === (pagination.last_page ?? 1)"
            class="rounded-r-lg border border-line bg-white px-3 py-2 text-quiet transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>

    <!-- ================= VOLET LATÉRAL / TIROIR DE DÉTAIL CANDIDAT ================= -->
    <div
      v-if="selectedKey"
      class="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity duration-300"
      data-testid="candidate-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-candidate-title"
    >
      <div
        class="flex h-full w-full max-w-2xl flex-col bg-white shadow-2xl animate-drawer sm:max-w-3xl"
      >
        <!-- En-tête Volet -->
        <div class="flex items-center justify-between border-b border-line bg-canvas px-6 py-4">
          <div class="flex items-center gap-3">
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white shadow-md shadow-primary/20"
            >
              {{ initialsOf(detail?.user?.name) }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="app-eyebrow">Dossier candidat</span>
                <span
                  v-if="detail"
                  class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  :class="statusBadgeClass(detail.status)"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="statusDotClass(detail.status)"
                  ></span>
                  {{ statusLabel(detail.status) }}
                </span>
              </div>
              <h3 id="drawer-candidate-title" class="text-xl font-bold text-ink">
                {{ detail?.user?.name ?? 'Chargement…' }}
              </h3>
            </div>
          </div>
          <button
            @click="closeModal"
            class="rounded-lg p-2 text-quiet transition hover:bg-danger-soft hover:text-danger"
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

        <!-- Corps du volet défilable -->
        <div class="flex-1 space-y-6 overflow-y-auto p-6 custom-scrollbar">
          <div v-if="isDetailPending" class="py-12 text-center text-sm text-quiet">
            Chargement du dossier complet du candidat…
          </div>
          <div v-else-if="isDetailError" class="py-12 text-center text-sm text-danger-ink">
            {{ (detailError as ApiError)?.message ?? 'Impossible de charger ce dossier.' }}
          </div>

          <template v-else-if="detail">
            <!-- 1. Profil Candidat -->
            <section class="rounded-2xl border border-line bg-canvas/60 p-5">
              <h4 class="mb-3 app-label">Profil du candidat</h4>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <p class="text-xs text-quiet">Nom complet</p>
                  <p class="font-semibold text-ink">{{ detail.user?.name ?? '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-quiet">Adresse email</p>
                  <p class="font-semibold text-ink">{{ detail.user?.email ?? '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-quiet">Numéro de téléphone</p>
                  <p class="font-semibold text-ink">{{ candidatePhone }}</p>
                </div>
                <div>
                  <p class="text-xs text-quiet">Date de soumission</p>
                  <p class="font-semibold text-ink">{{ formatDate(detail.submitted_at) }}</p>
                </div>
                <div>
                  <p class="text-xs text-quiet">Filière choisie</p>
                  <p class="font-semibold text-primary">{{ detail.pathway?.name ?? '-' }}</p>
                </div>
                <div>
                  <p class="text-xs text-quiet">Session demandée</p>
                  <p class="font-semibold text-ink">
                    {{ detail.cohort?.name ?? detail.cohort?.code ?? 'Session flexible / Standby' }}
                  </p>
                </div>
              </div>
            </section>

            <!-- 2. Destination Preview Badge -->
            <section
              class="rounded-2xl border p-4 transition"
              :class="
                detail.cohort
                  ? 'border-primary/20 bg-primary/[0.04]'
                  : 'border-warning-line bg-warning-soft/60'
              "
              data-testid="admission-destination-preview"
            >
              <div class="flex items-start gap-3">
                <div
                  class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  :class="detail.cohort ? 'bg-primary text-white' : 'bg-warning text-white'"
                >
                  <svg
                    v-if="detail.cohort"
                    class="h-4 w-4"
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
                  <svg v-else class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p
                    class="text-xs font-bold"
                    :class="detail.cohort ? 'text-primary' : 'text-warning-ink'"
                  >
                    Destination prévue en cas d'admission
                  </p>
                  <p v-if="detail.cohort" class="mt-0.5 text-sm font-semibold text-ink">
                    Affectation immédiate : Cohorte
                    <span class="font-bold text-primary">{{
                      detail.cohort.name || detail.cohort.code
                    }}</span>
                    <span v-if="detail.cohort.code" class="text-quiet text-xs font-normal">
                      ({{ detail.cohort.code }})</span
                    >
                  </p>
                  <p v-else class="mt-0.5 text-sm font-semibold text-ink">
                    File d'attente (Standby) : Intégration automatique FIFO dès l'ouverture d'une
                    nouvelle session.
                  </p>
                </div>
              </div>
            </section>

            <!-- 3. Comparatif Matériel : Spécifications Requises vs Déclarées -->
            <section
              v-if="hasHardwareInfo"
              class="rounded-2xl border border-line bg-white p-5 shadow-sm"
              data-testid="hardware-comparison-card"
            >
              <div class="mb-4 flex items-center justify-between border-b border-line pb-3">
                <div class="flex items-center gap-2">
                  <svg
                    class="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <h4 class="text-sm font-bold text-ink">Vérification du matériel informatique</h4>
                </div>
                <span
                  v-if="detail.equipment_review"
                  class="rounded-full px-2.5 py-1 text-xs font-semibold"
                  :class="equipmentBadgeClass(detail.equipment_review.status)"
                >
                  {{ equipmentReviewLabel(detail.equipment_review.status) }}
                </span>
              </div>

              <!-- Tableau comparatif -->
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <!-- Processeur / CPU -->
                <div
                  class="rounded-xl border p-3"
                  :class="
                    isCpuConform
                      ? 'border-primary/30 bg-primary/[0.02]'
                      : 'border-danger-line bg-danger-soft/30'
                  "
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="app-label">Processeur (CPU)</span>
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      :class="
                        isCpuConform
                          ? 'bg-primary/20 text-primary'
                          : 'bg-danger-soft text-danger-ink'
                      "
                    >
                      <svg
                        v-if="isCpuConform"
                        class="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span v-else>!</span>
                    </span>
                  </div>
                  <p class="text-xs text-quiet">
                    Requis :
                    <span class="font-medium text-ink">{{
                      requiredSpecs.min_cpu || 'Non spécifié'
                    }}</span>
                  </p>
                  <p class="mt-1 text-sm font-bold text-ink">
                    {{ declaredSpecs.cpu || declaredSpecs.cpu_model || 'Non renseigné' }}
                  </p>
                </div>

                <!-- RAM -->
                <div
                  class="rounded-xl border p-3"
                  :class="
                    isRamConform
                      ? 'border-primary/30 bg-primary/[0.02]'
                      : 'border-danger-line bg-danger-soft/30'
                  "
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="app-label">Mémoire RAM</span>
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      :class="
                        isRamConform
                          ? 'bg-primary/20 text-primary'
                          : 'bg-danger-soft text-danger-ink'
                      "
                    >
                      <svg
                        v-if="isRamConform"
                        class="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span v-else>!</span>
                    </span>
                  </div>
                  <p class="text-xs text-quiet">
                    Requis :
                    <span class="font-medium text-ink">{{
                      requiredSpecs.min_ram_gb ? requiredSpecs.min_ram_gb + ' Go' : 'Non spécifié'
                    }}</span>
                  </p>
                  <p class="mt-1 text-sm font-bold text-ink">
                    {{ declaredSpecs.ram_gb ? declaredSpecs.ram_gb + ' Go' : 'Non renseigné' }}
                  </p>
                </div>

                <!-- Stockage -->
                <div
                  class="rounded-xl border p-3"
                  :class="
                    isStorageConform
                      ? 'border-primary/30 bg-primary/[0.02]'
                      : 'border-danger-line bg-danger-soft/30'
                  "
                >
                  <div class="flex items-center justify-between mb-1.5">
                    <span class="app-label">Stockage</span>
                    <span
                      class="flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                      :class="
                        isStorageConform
                          ? 'bg-primary/20 text-primary'
                          : 'bg-danger-soft text-danger-ink'
                      "
                    >
                      <svg
                        v-if="isStorageConform"
                        class="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="3"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span v-else>!</span>
                    </span>
                  </div>
                  <p class="text-xs text-quiet">
                    Requis :
                    <span class="font-medium text-ink">{{
                      requiredSpecs.min_storage_gb
                        ? requiredSpecs.min_storage_gb + ' Go'
                        : 'Non spécifié'
                    }}</span>
                  </p>
                  <p class="mt-1 text-sm font-bold text-ink">
                    {{
                      declaredSpecs.storage_gb || declaredSpecs.storage_total_gb
                        ? (declaredSpecs.storage_gb || declaredSpecs.storage_total_gb) + ' Go'
                        : 'Non renseigné'
                    }}
                  </p>
                </div>
              </div>

              <!-- Détails complémentaires matériel -->
              <div
                class="mt-3 flex flex-wrap gap-4 text-xs text-quiet pt-2 border-t border-line/60"
              >
                <span v-if="declaredSpecs.os || declaredSpecs.os_name">
                  Système :
                  <strong class="text-ink">{{ declaredSpecs.os || declaredSpecs.os_name }}</strong>
                </span>
                <span v-if="declaredSpecs.device_type">
                  Type d'appareil :
                  <strong class="text-ink">{{ declaredSpecs.device_type }}</strong>
                </span>
                <span v-if="detail.equipment_review?.reason">
                  Motif modérateur :
                  <span class="italic text-ink">{{ detail.equipment_review.reason }}</span>
                </span>
              </div>

              <!-- Actions rapides de revue du matériel pour l'administrateur -->
              <div
                v-if="detail.equipment_review && detail.equipment_review.status !== 'approved'"
                class="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-warning-line bg-warning-soft/70 p-3.5"
                data-testid="equipment-review-actions"
              >
                <div>
                  <p class="text-xs font-bold text-warning-ink flex items-center gap-1.5">
                    <span class="inline-block h-2 w-2 rounded-full bg-warning animate-pulse"></span>
                    Revue matériel en attente
                  </p>
                  <p class="text-[11px] text-warning-ink mt-0.5">
                    Validez le matériel pour débloquer l'approbation de cette candidature.
                  </p>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    :disabled="decideEquipmentMutation.isPending.value"
                    @click="
                      decideEquipment(
                        'rejected',
                        'Matériel non conforme aux prérequis de la filière',
                      )
                    "
                    class="rounded-lg border border-danger-line bg-white px-3 py-1.5 text-xs font-semibold text-danger-ink hover:bg-danger-soft transition disabled:opacity-50"
                  >
                    Refuser
                  </button>
                  <button
                    type="button"
                    :disabled="decideEquipmentMutation.isPending.value"
                    @click="decideEquipment('approved')"
                    class="app-action-primary min-h-9 px-3.5 py-1.5 text-xs"
                    data-testid="btn-approve-equipment"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2.5"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {{
                      decideEquipmentMutation.isPending.value
                        ? 'Validation…'
                        : 'Valider le matériel'
                    }}
                  </button>
                </div>
              </div>
            </section>

            <!-- 4. Visionneuse de Justificatif Matériel (Proof Viewer) -->
            <section
              class="rounded-2xl border border-line bg-white p-5 shadow-sm"
              data-testid="hardware-proof-viewer"
            >
              <div class="mb-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <svg
                    class="h-5 w-5 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <h4 class="text-sm font-bold text-ink">Justificatif matériel</h4>
                </div>
                <button
                  v-if="proofUrl && isProofImage"
                  @click="isProofZoomed = true"
                  class="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-1.5 text-xs font-semibold text-ink transition hover:bg-white hover:text-primary"
                  data-testid="proof-zoom-toggle"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                  Agrandir / Plein écran
                </button>
              </div>

              <!-- Affichage Image -->
              <div
                v-if="proofUrl && isProofImage"
                class="relative overflow-hidden rounded-xl border border-line bg-canvas/30 p-2 text-center"
              >
                <img
                  :src="proofUrl"
                  alt="Justificatif matériel du candidat"
                  class="max-h-72 w-full rounded-lg object-contain cursor-pointer transition hover:opacity-95"
                  data-testid="proof-media-image"
                  @click="isProofZoomed = true"
                />
                <p class="mt-2 text-xs text-quiet">
                  Cliquez sur l'image pour l'afficher en haute résolution
                </p>
              </div>

              <!-- Affichage Document / PDF -->
              <div
                v-else-if="proofUrl"
                class="rounded-xl border border-line bg-canvas/40 p-4 text-center"
              >
                <div class="flex flex-col items-center justify-center gap-2">
                  <div
                    class="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-soft text-danger-ink"
                  >
                    <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <p class="text-sm font-semibold text-ink">
                    {{ proofMediaName || 'Document justificatif de matériel' }}
                  </p>
                  <a
                    :href="proofUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="app-action-primary mt-2"
                  >
                    Ouvrir le document dans un nouvel onglet
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              </div>

              <!-- Aucun justificatif -->
              <div
                v-else
                class="rounded-xl border border-line/60 bg-canvas/30 p-4 text-center text-sm text-quiet"
              >
                Aucun justificatif matériel n'a été fourni pour cette candidature.
              </div>
            </section>

            <!-- 5. Motivation -->
            <section
              v-if="detail.motivation"
              class="rounded-2xl border border-line bg-canvas/50 p-5"
            >
              <h4 class="mb-2 app-label">Lettre / Texte de motivation</h4>
              <p class="text-sm leading-relaxed text-ink whitespace-pre-wrap">
                {{ detail.motivation }}
              </p>
            </section>

            <!-- 6. Décision déjà actée -->
            <section
              v-if="detail.decided_at"
              class="rounded-2xl border border-line bg-canvas p-4 text-sm space-y-1.5"
            >
              <p class="font-semibold text-ink">
                Décision enregistrée le {{ formatDate(detail.decided_at) }}
                <span v-if="detail.decided_by"> par {{ detail.decided_by.name }}</span>
              </p>
              <p v-if="detail.reason" class="text-quiet">
                Motif communiqué : <span class="font-medium text-ink">{{ detail.reason }}</span>
              </p>
            </section>

            <!-- 7. Alerte d'erreur de décision -->
            <div
              v-if="decideError"
              class="app-alert app-alert-danger flex items-start justify-between gap-3"
              data-testid="decide-error-banner"
              role="alert"
            >
              <div class="flex items-start gap-3">
                <svg
                  class="h-5 w-5 text-danger-ink shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p class="font-bold text-danger-ink">Erreur lors de la décision</p>
                  <p class="mt-0.5 text-xs text-danger-ink font-medium">{{ decideError }}</p>
                </div>
              </div>
              <button
                @click="decideError = null"
                class="rounded-lg p-1 text-danger hover:bg-danger-soft hover:text-danger-ink transition"
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

            <!-- 8. Saisie du motif de rejet -->
            <section
              v-if="pendingDecision === 'rejected'"
              class="rounded-2xl border border-danger-line bg-danger-soft/40 p-4 space-y-2"
            >
              <label class="block text-sm font-semibold text-ink">
                Motif du rejet (obligatoire)
              </label>
              <textarea
                v-model="rejectReason"
                rows="3"
                placeholder="Précisez la raison pour laquelle cette candidature est refusée…"
                class="app-input w-full"
                data-testid="reject-reason-input"
              ></textarea>
            </section>
          </template>
        </div>

        <!-- Pied du Volet (Actions de Décision) -->
        <div
          v-if="detail"
          class="flex flex-wrap items-center justify-end gap-3 border-t border-line bg-canvas px-6 py-4"
        >
          <button
            v-if="detail.status === 'submitted'"
            @click="startReview"
            :disabled="startReviewMutation.isPending.value"
            class="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas disabled:opacity-50"
          >
            Démarrer la revue
          </button>

          <template v-if="canDecide">
            <template v-if="pendingDecision !== 'rejected'">
              <p
                v-if="
                  !canAccept &&
                  detail.equipment_review &&
                  detail.equipment_review.status !== 'approved'
                "
                class="w-full text-xs font-semibold text-warning-ink sm:w-auto sm:mr-auto"
              >
                <TriangleAlertIcon class="inline size-4 align-[-0.2em]" aria-hidden="true" />
                Validez le matériel ci-dessus pour débloquer l'approbation.
              </p>
              <button
                @click="pendingDecision = 'rejected'"
                class="rounded-xl border border-danger-line bg-white px-5 py-2.5 text-sm font-semibold text-danger-ink transition hover:bg-danger-soft"
                data-testid="btn-reject-trigger"
              >
                Rejeter
              </button>
              <button
                @click="decide('waitlisted')"
                :disabled="decideMutation.isPending.value"
                class="rounded-xl border border-warning-line bg-white px-5 py-2.5 text-sm font-semibold text-warning-ink transition hover:bg-warning-soft disabled:opacity-50"
              >
                Liste d'attente
              </button>
              <button
                @click="decide('accepted')"
                :disabled="decideMutation.isPending.value || !canAccept"
                :title="
                  canAccept
                    ? 'Approuver la candidature'
                    : 'La revue matériel doit être approuvée avant l’admission'
                "
                class="app-action-primary"
                data-testid="btn-approve-application"
              >
                Approuver la candidature
              </button>
            </template>
            <template v-else>
              <button
                @click="cancelReject"
                class="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-canvas"
              >
                Annuler
              </button>
              <button
                @click="confirmReject"
                :disabled="decideMutation.isPending.value"
                class="rounded-xl bg-danger px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-danger/20 transition hover:bg-danger disabled:opacity-50"
                data-testid="btn-confirm-reject"
              >
                Confirmer le rejet
              </button>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- ================= VISIONNEUSE PLEIN ÉCRAN POUR LE JUSTIFICATIF ================= -->
    <div
      v-if="isProofZoomed && proofUrl"
      class="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 p-4 backdrop-blur-md"
      data-testid="proof-fullscreen-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div class="mb-4 flex w-full max-w-5xl items-center justify-between text-white">
        <span class="text-sm font-semibold">Justificatif matériel en haute résolution</span>
        <button
          @click="isProofZoomed = false"
          class="rounded-lg bg-white/20 p-2 text-white transition hover:bg-white/30"
          title="Fermer le plein écran"
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
      <div class="flex max-h-[85vh] max-w-5xl items-center justify-center overflow-auto">
        <img
          :src="proofUrl"
          alt="Justificatif matériel en plein écran"
          class="max-h-[80vh] max-w-full rounded-xl object-contain shadow-2xl"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { TriangleAlert as TriangleAlertIcon } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { ApiError } from '@/api/http'
import { useCatalogPathways } from '@/features/public/composables/useCatalogPathways'
import {
  useApplication,
  useApplications,
  useDecideApplication,
  useDecideEquipmentReview,
  useStartApplicationReview,
  type ApplicationListFilters,
} from '../composables/useApplications'

// ==================== FILTRES (server-side) ====================
const searchQuery = ref('')
const searchQueryDebounced = refDebounced(searchQuery, 350)
const filterPathwayKey = ref('')
const filterStatus = ref('')
const page = ref(1)

watch([filterPathwayKey, filterStatus, searchQueryDebounced], () => {
  page.value = 1
})

const filters = computed<ApplicationListFilters>(() => ({
  q: searchQueryDebounced.value || undefined,
  pathwayKey: filterPathwayKey.value || undefined,
  status: filterStatus.value || undefined,
  page: page.value,
}))

const { data, isPending, isError, error } = useApplications(filters)
const applications = computed(() => data.value?.items ?? [])
const pagination = computed(() => data.value?.pagination ?? null)

const { data: pathways } = useCatalogPathways()

const statusOptions = [
  { value: 'submitted', label: 'Soumise' },
  { value: 'in_review', label: 'En revue' },
  { value: 'accepted', label: 'Acceptée' },
  { value: 'standby', label: 'Standby' },
  { value: 'waitlisted', label: 'Liste d’attente' },
  { value: 'rejected', label: 'Rejetée' },
  { value: 'withdrawn', label: 'Retirée' },
]

function statusLabel(status: string): string {
  return statusOptions.find((option) => option.value === status)?.label ?? status
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-primary/10 text-primary'
    case 'in_review':
    case 'waitlisted':
    case 'standby':
      return 'bg-warning-soft text-warning-ink'
    case 'rejected':
      return 'bg-danger-soft text-danger-ink'
    default:
      return 'bg-canvas text-ink'
  }
}

function statusDotClass(status: string): string {
  switch (status) {
    case 'accepted':
      return 'bg-primary'
    case 'in_review':
    case 'waitlisted':
    case 'standby':
      return 'bg-warning'
    case 'rejected':
      return 'bg-danger'
    default:
      return 'bg-quiet'
  }
}

function initialsOf(name: string | undefined): string {
  if (!name) return '-'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('fr-FR')
}

// ==================== VOLET LATÉRAL DE DÉTAIL ====================
const selectedKey = ref<string | null>(null)
const pendingDecision = ref<'rejected' | null>(null)
const rejectReason = ref('')
const decideError = ref<string | null>(null)
const isProofZoomed = ref(false)

const {
  data: detail,
  isPending: isDetailPending,
  isError: isDetailError,
  error: detailError,
} = useApplication(computed(() => selectedKey.value))

const candidatePhone = computed(() => {
  if (!detail.value) return '-'
  const userPhone = detail.value.user?.phone
  if (userPhone) return userPhone
  const payload = detail.value.payload as Record<string, unknown> | null
  if (payload) {
    if (typeof payload.phone === 'string' && payload.phone) return payload.phone
    if (typeof payload.telephone === 'string' && payload.telephone) return payload.telephone
  }
  return '-'
})

const requiredSpecs = computed(() => {
  if (!detail.value) return {}
  const snapshot = detail.value.equipment_review?.requirements_snapshot
  if (snapshot && Object.keys(snapshot).length > 0) return snapshot as Record<string, unknown>
  return (detail.value.pathway?.equipment_requirements ?? {}) as Record<string, unknown>
})

const declaredSpecs = computed(() => {
  if (!detail.value) return {}
  const dec = detail.value.equipment_review?.declaration
  if (dec && Object.keys(dec).length > 0) return dec as Record<string, unknown>
  const payload = detail.value.payload as Record<string, unknown> | null
  if (payload?.equipment) return payload.equipment as Record<string, unknown>
  return {}
})

const hasHardwareInfo = computed(() => {
  return (
    detail.value?.equipment_review !== undefined ||
    Object.keys(requiredSpecs.value).length > 0 ||
    Object.keys(declaredSpecs.value).length > 0
  )
})

const isCpuConform = computed(() => {
  const reqCpu = requiredSpecs.value.min_cpu
  const declCpu = declaredSpecs.value.cpu || declaredSpecs.value.cpu_model
  if (!reqCpu) return true
  return Boolean(declCpu)
})

const isRamConform = computed(() => {
  const minRam = Number(requiredSpecs.value.min_ram_gb) || 0
  const declRam = Number(declaredSpecs.value.ram_gb) || 0
  if (!minRam) return true
  return declRam >= minRam
})

const isStorageConform = computed(() => {
  const minStorage = Number(requiredSpecs.value.min_storage_gb) || 0
  const declStorage =
    Number(declaredSpecs.value.storage_gb) || Number(declaredSpecs.value.storage_total_gb) || 0
  if (!minStorage) return true
  return declStorage >= minStorage
})

const proofUrl = computed(() => {
  if (!detail.value) return null
  return (
    detail.value.proof_media_url ||
    detail.value.equipment_review?.proof_media?.download_url ||
    detail.value.equipment_review?.proof_media_url ||
    null
  )
})

const proofMediaName = computed(() => {
  return detail.value?.equipment_review?.proof_media?.original_name ?? null
})

const isProofImage = computed(() => {
  if (!proofUrl.value) return false
  const mime = detail.value?.equipment_review?.proof_media?.mime_detected
  if (mime) {
    return mime.startsWith('image/')
  }
  return !proofUrl.value.toLowerCase().endsWith('.pdf')
})

const canDecide = computed(
  () =>
    detail.value !== undefined &&
    detail.value !== null &&
    ['submitted', 'in_review', 'waitlisted', 'standby'].includes(detail.value.status),
)

const canAccept = computed(
  () =>
    detail.value !== undefined &&
    detail.value !== null &&
    (detail.value.equipment_review === undefined ||
      detail.value.equipment_review === null ||
      equipmentAllowsAdmission(detail.value.equipment_review.status)),
)

function equipmentAllowsAdmission(status: string): boolean {
  return status === 'not_required' || status === 'approved'
}

function equipmentReviewLabel(status: string | undefined): string {
  if (!status) return 'Aucune revue'
  const labels: Record<string, string> = {
    not_required: 'Aucune revue nécessaire',
    pending: 'Revue matériel en attente',
    needs_info: 'Informations complémentaires',
    approved: 'Matériel validé',
    rejected: 'Matériel non validé',
  }
  return labels[status] ?? status
}

function equipmentBadgeClass(status: string | undefined): string {
  switch (status) {
    case 'approved':
      return 'bg-primary/10 text-primary'
    case 'pending':
    case 'needs_info':
      return 'bg-warning-soft text-warning-ink'
    case 'rejected':
      return 'bg-danger-soft text-danger-ink'
    default:
      return 'bg-canvas text-quiet'
  }
}

function openModal(key: string) {
  selectedKey.value = key
  pendingDecision.value = null
  rejectReason.value = ''
  decideError.value = null
  isProofZoomed.value = false
}

function closeModal() {
  selectedKey.value = null
  pendingDecision.value = null
  rejectReason.value = ''
  decideError.value = null
  isProofZoomed.value = false
}

function cancelReject() {
  pendingDecision.value = null
  decideError.value = null
}

const startReviewMutation = useStartApplicationReview()
function startReview() {
  if (!selectedKey.value) return
  startReviewMutation.mutate(selectedKey.value)
}

const decideEquipmentMutation = useDecideEquipmentReview()
async function decideEquipment(decision: 'approved' | 'rejected' | 'needs_info', reason?: string) {
  if (!detail.value?.equipment_review?.key) return
  decideError.value = null
  try {
    await decideEquipmentMutation.mutateAsync({
      key: detail.value.equipment_review.key,
      decision,
      reason,
    })
  } catch (err) {
    decideError.value =
      (err as ApiError).displayMessage || 'Impossible de mettre à jour la revue matériel.'
  }
}

const decideMutation = useDecideApplication()

function decide(decision: 'accepted' | 'waitlisted') {
  if (!selectedKey.value) return
  decideError.value = null
  decideMutation.mutate(
    { key: selectedKey.value, decision },
    {
      onError: (mutationError) => {
        decideError.value = (mutationError as ApiError).displayMessage
      },
    },
  )
}

function confirmReject() {
  if (!selectedKey.value) return
  if (!rejectReason.value.trim()) {
    decideError.value = 'Le motif du rejet est obligatoire.'
    return
  }
  decideError.value = null
  decideMutation.mutate(
    { key: selectedKey.value, decision: 'rejected', reason: rejectReason.value.trim() },
    {
      onSuccess: () => {
        pendingDecision.value = null
      },
      onError: (mutationError) => {
        decideError.value = (mutationError as ApiError).displayMessage
      },
    },
  )
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border, #e5e7eb);
  border-radius: 4px;
}

@keyframes drawerIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.animate-drawer {
  animation: drawerIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
}
</style>
