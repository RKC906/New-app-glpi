const EXPRESS_BASE_URL = 'http://localhost:3005/api';

export const kanbanCostService = {
  // ... (conserve saveTicketCost et getAllCosts)

  async saveTicketCost({ ticket_id, amount, label, date }) {
    const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id, amount, label, date })
    });
    return await response.json();
  },

  async getAllCosts() {
    const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/all`);\n    return await response.json();
  },

  // 🛠️ APPEL ANNULATION (Suppression du dernier coût)
  async cancelCost(ticketId) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/delete/${ticketId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du coût local');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [cancelCost]:", error);
      throw error;
    }
  },

  // 🛠️ APPEL RÉOUVERTURE (Calcul du pourcentage au backend)
  async reopenTicketCost(ticketId, percentage) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, percentage: percentage })
      });
      if (!response.ok) throw new Error('Erreur lors de la réouverture financière');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [reopenTicketCost]:", error);
      throw error;
    }
  }
};
