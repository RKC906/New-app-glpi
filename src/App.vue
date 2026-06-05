<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  // On initialise la session GLPI "invité" en arrière-plan pour que le Frontoffice 
  // puisse directement afficher les ordinateurs sans bloquer l'utilisateur.
  await authStore.initFrontSession()
})
</script>

<template>
  <RouterView />
</template>

<style>
/* Style global pour l'ensemble de ton application */
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
  background-color: #f5f7fa;
}
</style>