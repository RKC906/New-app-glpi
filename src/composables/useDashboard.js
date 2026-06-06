import { ref } from 'vue'

import { dashboardService } from '@/services/dashboardService'

export function useDashboard() {
  const isLoading = ref(false)
  
  // 🆕 Ajout des compteurs détaillés par Statut de Ticket
  const stats = ref({
    totalAssets: 0,
    computers: 0,
    monitors: 0,
    printers: 0,
    peripherals: 0,
    
    // Section Tickets
    totalTickets: 0,
    incidents: 0,
    demands: 0,
    // Statuts GLPI :
    statusNew: 0,       // Statut 1 : Nouveau
    statusAssigned: 0,  // Statut 2 : En cours (Assigné)
    statusPlanned: 0,   // Statut 3 : En cours (Planifié)
    statusWaiting: 0,   // Statut 4 : En attente
    statusSolved: 0,    // Statut 5 : Résolu
    statusClosed: 0,    // Statut 6 : Clos
    
    totalCosts: 0
  })

  const refreshDashboard = async () => {
    isLoading.value = true
    try {
      const data = await dashboardService.getDashboardRawData()

      // 1. Comptage du Parc
      stats.value.computers = Array.isArray(data.computers) ? data.computers.length : 0
      stats.value.monitors = Array.isArray(data.monitors) ? data.monitors.length : 0
      stats.value.printers = Array.isArray(data.printers) ? data.printers.length : 0
      stats.value.peripherals = Array.isArray(data.peripherals) ? data.peripherals.length : 0
      stats.value.totalAssets = stats.value.computers + stats.value.monitors + stats.value.printers + stats.value.peripherals

      // 2. 🎫 Traitement détaillé des Tickets
      const ticketsList = Array.isArray(data.tickets) ? data.tickets : []
      stats.value.totalTickets = ticketsList.length
      
      // Ventilation par Type (1 = Incident, 2 = Demande)
      stats.value.incidents = ticketsList.filter(t => t.type === 1).length
      stats.value.demands = ticketsList.filter(t => t.type === 2).length

      // Ventilation par Statut natif GLPI (champs numériques de 1 à 6)
      stats.value.statusNew = ticketsList.filter(t => t.status === 1).length
      stats.value.statusAssigned = ticketsList.filter(t => t.status === 2).length
      stats.value.statusPlanned = ticketsList.filter(t => t.status === 3).length
      stats.value.statusWaiting = ticketsList.filter(t => t.status === 4).length
      stats.value.statusSolved = ticketsList.filter(t => t.status === 5).length
      stats.value.statusClosed = ticketsList.filter(t => t.status === 6).length

      // 3. Calcul de la somme financière
      const costsList = Array.isArray(data.costs) ? data.costs : []
      stats.value.totalCosts = costsList.reduce((sum, item) => {
        const fixed = parseFloat(item.cost_fixed) || 0
        const time = parseFloat(item.cost_time) || 0
        return sum + fixed + time
      }, 0)

    } catch (error) {
      console.error("Erreur lors du traitement du dashboard :", error)
    } finally {
      isLoading.value = false
    }
  }

  return { stats, isLoading, refreshDashboard }
}