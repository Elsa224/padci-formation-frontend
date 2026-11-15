<template>
  <div class="max-w-xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10">
    <h1 class="text-2xl font-bold text-primary mb-2 text-center">Contactez-nous</h1>
    <p class="text-sm text-gray-500 text-center mb-6">
      Une question sur la formation ? Écrivez-nous, nous vous répondrons rapidement.
    </p>

    <!-- Succès -->
    <div v-if="sent" class="text-center py-8 space-y-4">
      <i class="bx bx-check-circle text-6xl text-green-600"></i>
      <h2 class="text-lg font-semibold text-gray-800">Message envoyé</h2>
      <p class="text-gray-600">Merci, votre message a bien été transmis à notre équipe.</p>
      <router-link to="/accueil"
                   class="inline-block px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition">
        Retour à l'accueil
      </router-link>
    </div>

    <form v-else @submit.prevent="send" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Nom complet *</label>
        <input v-model="form.nom" type="text" required
               class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Email *</label>
        <input v-model="form.email" type="email" required
               class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Téléphone</label>
        <input v-model="form.telephone" type="tel"
               class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Sujet</label>
        <input v-model="form.sujet" type="text"
               class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:border-primary focus:outline-none" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700">Message *</label>
        <textarea v-model="form.message" required rows="5"
                  class="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:border-primary focus:outline-none"></textarea>
      </div>

      <div v-if="errorMsg" class="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-3">
        {{ errorMsg }}
      </div>

      <button type="submit" :disabled="sending"
              class="w-full px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition disabled:opacity-60 disabled:cursor-not-allowed">
        {{ sending ? 'Envoi en cours…' : 'Envoyer le message' }}
      </button>
    </form>
  </div>
</template>

<script>
export default {
  name: 'ContactForm',
  data() {
    return {
      sending: false,
      sent: false,
      errorMsg: '',
      form: { nom: '', email: '', telephone: '', sujet: '', message: '' },
    };
  },
  methods: {
    async send() {
      if (this.sending) return;
      this.errorMsg = '';
      this.sending = true;
      try {
        const base = import.meta.env.VITE_API_BASE || '';
        const res = await fetch(`${base}/api/contact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          throw new Error(data.error || "Échec de l'envoi. Réessayez plus tard.");
        }
        this.sent = true;
      } catch (e) {
        this.errorMsg = e.message || 'Erreur réseau. Vérifiez votre connexion et réessayez.';
      } finally {
        this.sending = false;
      }
    },
  },
};
</script>
