import api from "./api";

export const dashboardService = {
    async getDashboardRawData() {
    // Requêtes simultanées (parallélisme) avec capture d'erreur pour chaque module
    const [
      resComputers, 
      resMonitors, 
      resPrinters, 
      resPeripherals, 
      resTickets, 
      resCosts
    ] = await Promise.all([
      api.get('/Computer', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Monitor', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Printer', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Peripheral', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/Ticket', { params: { range: '0-999' } }).catch(() => ({ data: [] })),
      api.get('/TicketCost', { params: { range: '0-999' } }).catch(() => ({ data: [] }))
    ])

    return {
      computers: resComputers.data,
      monitors: resMonitors.data,
      printers: resPrinters.data,
      peripherals: resPeripherals.data,
      tickets: resTickets.data,
      costs: resCosts.data
    }
  },
  /**
   * 🎫 Récupère la liste brute des tickets GLPI
   */
  async getTicketsList() {
    const { data } = await api.get('/Ticket', { params: { range: '0-100' } })
    return Array.isArray(data) ? data : []
  },

  /**
   * 🔌 Récupère le nom d'un équipement du parc en fonction de sa table et de son ID
   */
  async getItemName(itemtype, items_id) {
    try {
      const { data } = await api.get(`/${itemtype}/${items_id}`)
      return data.name || `Équipement #${items_id}`
    } catch (error) {
      console.warn(`Impossible de charger le nom de l'item [${itemtype}] ID ${items_id}`)
      return `Équipement #${items_id}`
    }
  }
}
