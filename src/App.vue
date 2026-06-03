<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  try {
    const USER_TOKEN = import.meta.env.VITE_GLPI_USER_TOKEN 
    
    console.log("⏳ Initialisation de la session GLPI...")
    await authStore.login(USER_TOKEN)
    console.log("🚀 Application connectée à GLPI et prête !")
  } catch (error) {
    console.error("Impossible de démarrer l'application:", error)
  }
})
</script>

<template>
  <div v-if="!authStore.isAuthenticated" class="app-loading">
    <div class="spinner"></div>
    <p>Connexion sécurisée à GLPI en cours...</p>
  </div>

  <RouterView v-else />
</template>

<style>
/* Un petit style propre pour ton écran de chargement global */
.app-loading {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-family: sans-serif;
  color: #2c3e50;
  background-color: #f8f9fa;
}
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border-left-color: #3498db;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>