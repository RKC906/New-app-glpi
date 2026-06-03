import { ref } from 'vue'
import { computerService } from '@/services/computerService'

export function useComputers() {
  const computers = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchComputers = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await computerService.getComputers()
      computers.value = response.data
    } catch (err) {
      console.error(err)
      error.value = "Impossible de récupérer le parc informatique."
    } finally {
      isLoading.value = false
    }
  }

  return { computers, isLoading, error, fetchComputers }
}