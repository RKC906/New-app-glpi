import api from "./api";

export const ticketService = {
    /**
   * 🎫 Crée un nouveau ticket dans GLPI
   */
  async createTicket(ticketData) {
    const { data } = await api.post('/Ticket', {
      input: {
        name: ticketData.name,
        content: ticketData.content,
        type: parseInt(ticketData.type),   // 1 = Incident, 2 = Demande
        status: parseInt(ticketData.status), // 1 = Nouveau, 2 = En cours...
        priority: parseInt(ticketData.priority) || 3
      }
    })
    return data // Contient l'ID du ticket généré (data.id)
  },

  /**
   * 🔗 Associe un équipement du parc à un ticket existant (table Item_Ticket)
   */
  async linkItemToTicket(ticketId, item) {
    const { data } = await api.post('/Item_Ticket', {
      input: {
        tickets_id: parseInt(ticketId),
        itemtype: item.itemtype, // Ex: 'Computer', 'Monitor'
        items_id: parseInt(item.id)
      }
    })
    return data
  }
}