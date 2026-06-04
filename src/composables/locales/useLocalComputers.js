import { ref } from 'vue'
import axios from 'axios'

// 🔗 URL de ton serveur Express local
const API_URL = 'http://localhost:3005/api/local-computers'

export function useLocalComputers() {
  const localComputers = ref([])
  const isLocalLoading = ref(false)
  const localError = ref(null)

  // 1. Lire (GET)
  const fetchLocalComputers = async () => {
    isLocalLoading.value = true
    localError.value = null
    try {
      const response = await axios.get(API_URL)
      localComputers.value = response.data
    } catch (err) {
      localError.value = "Impossible de charger les ordinateurs locaux."
      console.error(err)
    } finally {
      isLocalLoading.value = false
    }
  }

  // 2. Créer (POST)
  const addLocalComputer = async (computerData) => {
    isLocalLoading.value = true
    try {
      const response = await axios.post(API_URL, computerData)
      // On rafraîchit la liste locale après l'ajout
      await fetchLocalComputers()
      return response.data
    } catch (err) {
      console.error("Erreur lors de l'ajout local :", err)
      throw err
    } finally {
      isLocalLoading.value = false
    }
  }

  // 3. Supprimer (DELETE)
  const delLocalComputer = async (id) => {
    isLocalLoading.value = true
    try {
      await axios.delete(`${API_URL}/${id}`)
      // On filtre le tableau réactif pour enlever l'élément sans refaire d'appel API
      localComputers.value = localComputers.value.filter(c => c.id !== id)
    } catch (err) {
      console.error("Erreur lors de la suppression locale :", err)
      throw err
    } finally {
      isLocalLoading.value = false
    }
  }

  return {
    localComputers,
    isLocalLoading,
    localError,
    fetchLocalComputers,
    addLocalComputer,
    delLocalComputer
  }
}