import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  // 💾 Au démarrage, on regarde si un jeton et un état de connexion existaient déjà
  const sessionToken = ref(localStorage.getItem('glpi_session_token') || null)
  const isAuthenticated = ref(localStorage.getItem('is_admin_authenticated') === 'true')

  const ADMIN_PASSWORD = "mdp1234" 

  async function loginWithCredentials(password) {
    if (password === ADMIN_PASSWORD) {
      try {
        const GLPI_USER_TOKEN = import.meta.env.VITE_GLPI_USER_TOKEN
        const token = await authService.initSession(GLPI_USER_TOKEN)
        
        // 1. Sauvegarde dans les variables réactives (Pinia)
        sessionToken.value = token
        isAuthenticated.value = true

        // 2. 💾 Sauvegarde physique dans le navigateur pour résister au F5
        localStorage.setItem('glpi_session_token', token)
        localStorage.setItem('is_admin_authenticated', 'true')

        console.log("✅ Admin connecté et sauvegardé dans le localStorage.")
      } catch (error) {
        console.error(error)
        throw new Error("Identifiants OK, mais échec de connexion à GLPI.")
      }
    } else {
      throw new Error("Identifiant ou mot de passe incorrect.")
    }
  }

  async function initFrontSession() {
    // Si on a déjà un token (venant du localStorage ou d'une session active), on ne fait rien
    if (sessionToken.value) return 

    try {
      const GLPI_USER_TOKEN = import.meta.env.VITE_GLPI_USER_TOKEN
      const token = await authService.initSession(GLPI_USER_TOKEN)
      
      sessionToken.value = token
      // On sauvegarde le token pour les requêtes de l'intercepteur api.js
      localStorage.setItem('glpi_session_token', token)
    } catch (error) {
      console.error(error)
    }
  }

  function logout() {
    sessionToken.value = null
    isAuthenticated.value = false
    localStorage.removeItem('glpi_session_token')
    localStorage.removeItem('is_admin_authenticated')
  }

  return { sessionToken, isAuthenticated, loginWithCredentials, initFrontSession, logout }
})