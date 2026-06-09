import { ref, computed } from 'vue'
import api from '@/services/api'
import { dashboardService } from '@/services/dashboardService'

export function useTicketsManager() {
  const isLoading = ref(false)
  const isLoadingDetails = ref(false)
  const tickets = ref([])
  const selectedTicket = ref(null)
  
  // Sous-données de la fiche sélectionnée
  const associatedItems = ref([])
  const ticketCosts = ref([])

  /**
   * 📡 Charge la liste des tickets depuis le service
   */
  const loadTickets = async () => {
    isLoading.value = true
    try {
      tickets.value = await dashboardService.getTicketsList()
    } catch (error) {
      console.error("Erreur composable listant les tickets:", error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 🎯 Sélectionne un ticket et résout ses liaisons matériels et financières
   */
  const selectTicket = async (ticket) => {
    selectedTicket.value = ticket
    isLoadingDetails.value = true
    associatedItems.value = []
    ticketCosts.value = []

    try {
      // Requêtes en parallèle sur les tables intermédiaires et financières de GLPI
      const [resItems, resCosts] = await Promise.all([
        api.get('/Item_Ticket', { params: { range: '0-100' } }),
        api.get('/TicketCost', { params: { range: '0-100' } })
      ])

      // 1. Liaison Matérielle (Fichiers 1 & 2)
      const allLiaisons = Array.isArray(resItems.data) ? resItems.data : []
      const rawLiaisons = allLiaisons.filter(link => link.tickets_id === ticket.id)

      // Pour chaque liaison, on résout le nom de l'équipement via le service
      for (const liaison of rawLiaisons) {
        liaison.item_name = await dashboardService.getItemName(liaison.itemtype, liaison.items_id)
        associatedItems.value.push(liaison)
      }

      // 2. Liaison Financière (Fichier 3)
      const allCosts = Array.isArray(resCosts.data) ? resCosts.data : []
      ticketCosts.value = allCosts.filter(cost => cost.tickets_id === ticket.id)

    } catch (error) {
      console.error("Erreur composable chargeant la fiche détaillée:", error)
    } finally {
      isLoadingDetails.value = false
    }
  }

  /**
   * 🧮 Calculateur réactif de la somme totale cumulée sur la fiche
   */
  const totalTicketSum = computed(() => {
    return ticketCosts.value.reduce((sum, cost) => {
      const fixed = parseFloat(cost.cost_fixed) || 0
      const time = parseFloat(cost.cost_time) || 0
      return sum + fixed + time
    }, 0)
  })

  // Formatage utilitaire des dates
  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
  }

  // Formatage de la durée (secondes en heures/minutes)
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0 min'
    const minutes = Math.round(seconds / 60)
    if (minutes >= 60) {
      return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
    }
    return `${minutes} min`
  }

  // Traduction des statuts GLPI
  const getStatusLabel = (statusId) => {
    const statuts = { 1: 'Nouveau', 2: 'En cours (Ass)', 3: 'Planifié', 4: 'En attente', 5: 'Résolu', 6: 'Clos' }
    return statuts[statusId] || 'Inconnu'
  }

  /**
   * 🔀 Met à jour le statut d'un ticket dans GLPI (Utile pour le Kanban)
   */
  const updateTicketStatus = async (ticketId, newStatusId) => {
    try {
      await api.put(`/Ticket/${ticketId}`, {
        input: {
          id: ticketId,
          status: newStatusId
        }
      })
      console.log(`✅ Statut du ticket #${ticketId} synchronisé sur GLPI (${newStatusId})`)
    } catch (error) {
      console.error(`❌ Échec de la mise à jour du statut pour le ticket #${ticketId}:`, error)
      throw error // On propage l'erreur pour que le composant puisse annuler le mouvement visuel
    }
  }

  return {
    isLoading,
    isLoadingDetails,
    tickets,
    selectedTicket,
    associatedItems,
    ticketCosts,
    totalTicketSum,
    loadTickets,
    selectTicket,
    formatDate,
    formatDuration,
    getStatusLabel,
    updateTicketStatus
  }
}