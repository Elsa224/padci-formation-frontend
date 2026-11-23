<template>
  <div class="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
    <h1 class="text-2xl font-bold text-primary mb-2 text-center">Contactez-nous</h1>
    <p class="text-sm text-quiet text-center mb-6">
      Une question sur la formation ? Écrivez-nous, nous vous répondrons rapidement.
    </p>

    <!-- Succès -->
    <div v-if="sent" class="text-center py-8 space-y-4">
      <i class="bx bx-check-circle text-6xl text-primary-shade"></i>
      <h2 class="text-lg font-semibold text-ink">Message envoyé</h2>
      <p class="text-quiet">Merci, votre message a bien été transmis à notre équipe.</p>
      <router-link
        to="/accueil"
        class="inline-block px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition"
      >
        Retour à l'accueil
      </router-link>
    </div>

    <form v-else @submit.prevent="send" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-body">Nom complet *</label>
        <input v-model="form.nom" type="text" required class="app-input mt-1 w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium text-body">Email *</label>
        <input v-model="form.email" type="email" required class="app-input mt-1 w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium text-body">Téléphone</label>
        <input v-model="form.telephone" type="tel" class="app-input mt-1 w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium text-body">Sujet</label>
        <input v-model="form.sujet" type="text" class="app-input mt-1 w-full" />
      </div>
      <div>
        <label class="block text-sm font-medium text-body">Message *</label>
        <textarea v-model="form.message" required rows="5" class="app-input mt-1 w-full"></textarea>
      </div>

      <div v-if="errorMsg" class="app-alert app-alert-danger">
        {{ errorMsg }}
      </div>

      <button type="submit" :disabled="sending" class="app-action-primary w-full">
        {{ sending ? 'Envoi en cours…' : 'Envoyer le message' }}
      </button>
    </form>
  </div>
</template>

<script lang="ts">
export default {
  name: 'ContactForm',
  data() {
    return {
      sending: false,
      sent: false,
      errorMsg: '',
      form: { nom: '', email: '', telephone: '', sujet: '', message: '' },
    }
  },
  methods: {
    async send() {
      if (this.sending) return
      this.errorMsg = ''
      this.sending = true
      try {
        const base = import.meta.env.VITE_API_BASE || ''
        const res = await fetch(`${base}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Échec de l'envoi. Réessayez plus tard.")
        }
        this.sent = true
      } catch (e) {
        this.errorMsg =
          e instanceof Error ? e.message : 'Erreur réseau. Vérifiez votre connexion et réessayez.'
      } finally {
        this.sending = false
      }
    },
  },
}
</script>
