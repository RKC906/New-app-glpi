import { ref } from "vue";
import { ticketService } from "@/services/ticketService";
import { materielService } from "@/services/materielService";

export function useTickets() {
    const isLoading = ref(false)
  const isSubmitting = ref(false)
  
  // Liste globale des équipements disponibles dans le parc
  const availableAssets = ref([])
  
  // Données du formulaire de création
  const ticketForm = ref({
    name: '',
    content: '',
    type: '1',     // Id par défaut : 1 = Incident
    status: '1',   // Id par défaut : 1 = Nouveau
    priority: '3'  // Id par défaut : 3 = Moyenne
  })

  // Liste des éléments sélectionnés par l'utilisateur pour ce ticket
  const selectedAssets = ref([])

  /**
   * 📡 Charge la liste de tous les équipements pour remplir le sélecteur
   */
  const loadAvailableAssets = async () => {
    isLoading.value = true
    try {
      availableAssets.value = await materielService.getAllAssets()
    } catch (error) {
      console.error("Erreur lors du chargement des équipements pour le ticket :", error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * ➕ Ajoute un équipement à la liste des associations temporaires
   */
  const addAssetToTicket = (assetId) => {
    if (!assetId) return
    const asset = availableAssets.value.find(a => a.id === parseInt(assetId))
    // Évite les doublons
    if (asset && !selectedAssets.value.some(a => a.id === asset.id && a.itemtype === asset.itemtype)) {
      selectedAssets.value.push(asset)
    }
  }

  /**
   * 🗑️ Supprime un équipement de la liste temporaire
   */
  const removeAssetFromTicket = (index) => {
    selectedAssets.value.splice(index, 1)
  }

  /**
   * 🚀 Soumission globale du formulaire (Ticket + Liaisons)
   */
  const handleSubmitTicket = async () => {
    if (!ticketForm.value.name.trim() || !ticketForm.value.content.trim()) {
      alert("Veuillez remplir le titre et la description du ticket.")
      return false
    }

    isSubmitting.value = true
    try {
      // Étape 1 : Création du ticket principal
      console.log("⏳ Création du ticket principal...")
      const newTicket = await ticketService.createTicket(ticketForm.value)
      const ticketId = newTicket.id
      console.log(`✅ Ticket créé avec succès ! ID GLPI : ${ticketId}`)

      // Étape 2 : Création séquentielle des liaisons pour chaque équipement sélectionné
      if (selectedAssets.value.length > 0) {
        console.log(`⏳ Association de ${selectedAssets.value.length} élément(s) au ticket...`)
        for (const asset of selectedAssets.value) {
          await ticketService.linkItemToTicket(ticketId, asset)
          console.log(`🔗 Élément [${asset.itemtype}] ID ${asset.id} lié au ticket.`)
        }
      }

      alert(`Le ticket #${ticketId} a été créé et configuré avec succès !`)
      
      // Réinitialisation du formulaire après succès
      resetForm()
      return true

    } catch (error) {
      console.error("Échec de la création complète du ticket :", error)
      alert("Une erreur est survenue lors de la création du ticket dans GLPI.")
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  const resetForm = () => {
    ticketForm.value = { name: '', content: '', type: '1', status: '1', priority: '3' }
    selectedAssets.value = []
  }

  const getItemIcon = (type) => {
    const icons = { Computer: '💻', Monitor: '🖥️', Printer: '🖨️', Peripheral: '🖱️' }
    return icons[type] || '📦'
  }

  return {
    isLoading,
    isSubmitting,
    availableAssets,
    ticketForm,
    selectedAssets,
    loadAvailableAssets,
    addAssetToTicket,
    removeAssetFromTicket,
    handleSubmitTicket,
    getItemIcon
  }
}