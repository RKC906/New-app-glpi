import { ref } from 'vue'
import { computerService } from '@/services/computerService'

export function useComputer() {
  const computers = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Token de session récupéré sur votre Postman (temporaire avant le système de login)
  const TEMPORARY_SESSION_TOKEN = 'Kz4dnBqSExPdFJ6TklxRXhFMkZRays0dHdOU1NsFpodTc4Z'

  const fetchComputers = async () => {
    isLoading.value = true
    error.value = null
    try {
      // On passe le session token au service
      const response = await computerService.getComputers(TEMPORARY_SESSION_TOKEN)
      // Axios stocke la réponse de GLPI (le tableau []) dans response.data
      computers.value = response.data
    } catch (err) {
      console.error("Erreur GLPI:", err)
      error.value = "Impossible de récupérer les ordinateurs du parc."
    } finally {
      isLoading.value = false
    }
  }

  return {
    computers,
    isLoading,
    error,
    fetchComputers
  }
}