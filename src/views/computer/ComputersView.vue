<template>
  <div class="test-container">
    <h2>Page de Test - Connexion GLPI</h2>
    <p>Ouvre la console de ton navigateur (F12) pour voir le Session-Token.</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { authService } from '@/services/authService'

onMounted(async () => {
  try {
    // 1. Remplace par ton vrai USER-TOKEN généré dans GLPI
    const MON_USER_TOKEN = 'TfHejTJVeRa7F2zV5sVgCAJY1o0lp38GAwDXwM5Z' 
    
    console.log("Demande de session en cours...")
    
    // 2. Appel du service d'authentification
    const sessionTokenGenere = await authService.initSession(MON_USER_TOKEN)
    
    console.log("🔑 Succès ! Voici ton Session-Token :", sessionTokenGenere)
  } catch (error) {
    console.error("❌ Échec de la connexion à GLPI :", error)
  }
})
</script>

<style scoped>
.test-container {
  padding: 40px;
  text-align: center;
  font-family: sans-serif;
}
h2 { color: #2c3e50; }
p { color: #7f8c8d; }
</style>