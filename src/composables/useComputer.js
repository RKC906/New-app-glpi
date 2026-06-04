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

  const addComputer = async (formData) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await computerService.createComputer(formData)
      console.log("Ordinateur créé avec l'ID :", response.data.id)
      return response.data
    } catch (err) {
      console.error(err)
      error.value = "Échec de la création de l'ordinateur."
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const delComputer = async (id) => {
    isLoading.value = true
    error.value = null
    try {
      const response = await computerService.deleteComputer(id)
      console.log("Ordinateur Supprimé, ID :", id)

      // 💡 Astuce : On retire l'ordinateur de notre tableau réactif local
      computers.value = computers.value.filter(comp => comp.id !== id)

      return response.data
    } catch (err) {
      console.error(err)
      error.value = "Échec de la suppression de l'ordinateur."
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const editComputer = async (formData) => {
  isLoading.value = true
  error.value = null
  try {
    const response = await computerService.updateComputer(formData)
    console.log("Ordinateur mis à jour avec succès !")
    
    // 💡 Astuce : On met à jour l'ordinateur modifié dans notre liste locale
    const index = computers.value.findIndex(comp => comp.id === formData.id)
    if (index !== -1) {
      computers.value[index] = { ...computers.value[index], ...formData }
    }
    
    return response.data
  } catch (err) {
    console.error(err)
    error.value = "Échec de la modification de l'ordinateur."
    throw err
  } finally {
    isLoading.value = false
  }
}

  return { computers, isLoading, error, fetchComputers, addComputer, delComputer, editComputer}
}