<template>
  <AuthShell
    title="Retrouvez l'accès à votre espace"
    text="Nous vous envoyons un lien pour choisir un nouveau mot de passe."
  >
    <!-- Bouton Retour -->
    <router-link
      to="/"
      class="inline-flex items-center gap-2 text-quiet hover:text-primary mb-6 transition group font-medium text-sm"
    >
      <svg
        class="w-5 h-5 group-hover:-translate-x-1 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Retour à la connexion
    </router-link>

    <!-- Logo + Titre -->
    <div class="mb-8">
      <!-- ÉTAT 1 : FORMULAIRE -->
      <template v-if="!isSubmitted">
        <h1 class="text-3xl font-bold text-ink">Mot de passe oublié ?</h1>
        <p class="text-quiet text-sm mt-2 text-center">
          Entrez votre adresse email professionnelle. Nous vous enverrons un lien pour réinitialiser
          votre mot de passe.
        </p>
      </template>

      <!-- ÉTAT 2 : SUCCÈS -->
      <template v-else>
        <div
          class="w-16 h-16 bg-mint rounded-full flex items-center justify-center mb-4 animate-bounce"
        >
          <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 class="text-3xl font-bold text-ink">Email envoyé !</h1>
        <p class="text-quiet text-sm mt-2 text-center">
          Un lien de réinitialisation a été envoyé à <br />
          <strong class="text-ink">{{ email }}</strong
          >.
        </p>
      </template>
    </div>

    <!-- FORMULAIRE -->
    <form v-if="!isSubmitted" @submit.prevent="handleSubmit" class="space-y-5">
      <div class="relative group">
        <span
          class="absolute left-4 top-1/2 -translate-y-1/2 text-quiet group-focus-within:text-primary transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </span>
        <input
          v-model="email"
          type="email"
          required
          placeholder="Adresse e-mail"
          class="app-input min-h-12 text-base pl-12 pr-5"
        />
      </div>

      <!-- Bouton Soumettre -->
      <button
        type="submit"
        :disabled="isPending"
        class="app-action-primary min-h-12 w-full text-base group"
      >
        <svg
          v-if="isPending"
          class="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span v-if="!isPending">Envoyer le lien</span>
        <span v-else>Envoi en cours...</span>

        <svg
          v-if="!isPending"
          class="w-5 h-5 transition-transform group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      </button>
    </form>

    <!-- ÉTAT SUCCÈS : BOUTON RETOUR LOGIN -->
    <div v-else class="space-y-4">
      <router-link to="/" class="app-action-primary min-h-12 w-full text-base">
        Retour à la connexion
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
          />
        </svg>
      </router-link>

      <button
        type="button"
        @click="retry"
        class="w-full text-center text-sm text-quiet hover:text-primary transition-colors"
      >
        Vous n'avez pas reçu l'email ? Réessayer
      </button>
    </div>
  </AuthShell>
</template>

<script setup lang="ts">
import AuthShell from '../components/AuthShell.vue'
import { computed, ref } from 'vue'
import { ApiError } from '@/api/http'
import { useForgotPassword } from '../composables/useForgotPassword'

const email = ref('')
const formError = ref<string | null>(null)

const forgot = useForgotPassword()
const isPending = computed(() => forgot.isPending.value)
const isSubmitted = computed(() => forgot.isSuccess.value)

const handleSubmit = async () => {
  if (!email.value) return
  formError.value = null

  // Le backend répond 202 que l'adresse existe ou non - jamais de branche
  // "email inconnu" à afficher (voir PasswordResetController::forgot).
  try {
    await forgot.mutateAsync({ email: email.value })
  } catch (error) {
    formError.value = error instanceof ApiError ? error.message : 'Une erreur est survenue.'
  }
}

/** Back to the form (the mutation state is reset, the email field is retained). */
const retry = () => {
  forgot.reset()
}
</script>

<style scoped>
/* Apparition douce */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(24px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fadeInUp 0.7s ease-out both;
}

/* Mouvement lent des bulles */
@keyframes floatSlow {
  0%,
  100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(20px, -20px);
  }
}
.animate-float-slow {
  animation: floatSlow 8s ease-in-out infinite;
}
</style>
