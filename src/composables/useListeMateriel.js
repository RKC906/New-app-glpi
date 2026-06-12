import { ref, computed } from 'vue'
import { materielService } from '@/services/materielService'
import api from '@/services/api'

export function useListeMateriel() {
  const isLoading = ref(false)
  const rawAssets = ref([])
  
  // 🔍 Critères de recherche multicritère
  const searchFilters = ref({
    text: '',
    itemtype: '', // Tous, Computer, Monitor...
    stateId: ''   // Tous, En production, En stock...
  })

  // Liste des statuts (dropdown) qu'on va charger depuis GLPI
  const availableStates = ref([])

  /**
   * 📡 Charge les données initiales (Matériels + Référentiel des États)
   */
  const loadInventoryData = async () => {
    isLoading.value = true
    try {
      // 1. Charger tout le parc fusionné
      rawAssets.value = await materielService.getAllAssets()
      
      // 2. Charger les libellés des États (States) configurés dans GLPI pour le filtre
      const resStates = await api.get('/State', { params: { range: '0-100' } }).catch(() => ({ data: [] }))
      availableStates.value = Array.isArray(resStates.data) ? resStates.data : []
    } catch (error) {
      console.error("Erreur lors du chargement de l'inventaire :", error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 🧮 MOTEUR DE RECHERCHE MULTICRITÈRE (Calculé en temps réel)
   */
  const filteredAssets = computed(() => {
    return rawAssets.value.filter(asset => {
      // Filtre 1 : Recherche textuelle (sur le Nom, le Contact/User ou le Commentaire)
      const matchesText = !searchFilters.value.text.trim() || 
        (asset.name && asset.name.toLowerCase().includes(searchFilters.value.text.toLowerCase())) ||
        (asset.contact && asset.contact.toLowerCase().includes(searchFilters.value.text.toLowerCase())) ||
        (asset.comment && asset.comment.toLowerCase().includes(searchFilters.value.text.toLowerCase()))

      // Filtre 2 : Par type de matériel informatique (Item_Type)
      const matchesType = !searchFilters.value.itemtype || asset.itemtype === searchFilters.value.itemtype

      // Filtre 3 : Par État / Statut GLPI
      const matchesState = !searchFilters.value.stateId || asset.states_id === parseInt(searchFilters.value.stateId)

      // L'équipement doit valider les 3 conditions en même temps
      return matchesText && matchesType && matchesState
    })
  })

  // Utilitaires de formatage de l'interface
  const getItemIcon = (type) => {
    const icons = { Computer: '💻', Monitor: '🖥️', Printer: '🖨️', Peripheral: '🖱️', Phone: '📞'}
    return icons[type] || '📦'
  }

  const getStateLabel = (stateId) => {
    const found = availableStates.value.find(s => s.id === stateId)
    return found ? found.name : 'Non spécifié'
  }

  return {
    isLoading,
    searchFilters,
    availableStates,
    filteredAssets,
    loadInventoryData,
    getItemIcon,
    getStateLabel
  }
}