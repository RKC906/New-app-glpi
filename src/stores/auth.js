import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const sessionToken = ref(null)
  const isAuthenticated = ref(false)

  async function login(userToken) {
    try {
      const token = await authService.initSession(userToken)
      sessionToken.value = token
      isAuthenticated.value = true
    } catch (error) {
      console.error("Erreur d'initialisation de session GLPI:", error)
      throw error
    }
  }

  return { sessionToken, isAuthenticated, login }
})