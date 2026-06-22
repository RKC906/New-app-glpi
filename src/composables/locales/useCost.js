import { ref} from 'vue';
import { kanbanCostService } from '@/services/locale/kanbanCostService';

export function useCost() 
{
    const costs = ref([])
    const isLoading = ref(false)
    const error = ref(null)

    const fetchCost = async () => 
    {
        isLoading.value = true
        error.value = null
        try 
        {
            
          const response = await kanbanCostService.getAllCosts()
          costs.value = response.data
        } catch (err) {
          console.error(err)
          error.value = "Impossible de récupérer les couts."
        } finally {
          isLoading.value = false
        }
    }


      const editCost = async (formData) => {
      isLoading.value = true
      error.value = null
      try {
        const response = await kanbanCostService.updateCost(formData)
        console.log("Cout mis à jour avec succès !")
        
        const index = costs.value.findIndex(comp => comp.id === formData.id)
        if (index !== -1) {
          costs.value[index] = { ...costs.value[index], ...formData }
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

    return {costs, isLoading, error, fetchCost, editCost}
}