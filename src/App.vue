<script setup lang="ts">
import 'vue-sonner/style.css'
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <router-view></router-view>
  <!-- Un seul conteneur de notifications pour toute l'application : sans lui,
       les toast.success(...) des vues ne s'affichent pas. -->
  <Toaster position="bottom-right" :close-button="false" />
</template>
