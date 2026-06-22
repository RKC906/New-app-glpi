const EXPRESS_BASE_URL = 'http://localhost:3005/api';

export const kanbanCostService = {
  async saveTicketCost({ ticket_id, amount, label, date }) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id, amount, label, date })
      });
      if (!response.ok) throw new Error('Erreur réseau lors de la sauvegarde du coût');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [kanbanCostService]:", error);
      throw error;
    }
  },

  async getAllCosts() {
    // try {
    //   const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/all`);
    //   if (!response.ok) throw new Error('Erreur récupération coûts');
    //   return await response.json();
    // } catch (error) {
    //   console.error("Erreur service:", error);
    //   return [];
    // }
    const { data } = await fetch('http://localhost:3005/api/kanban/costs/all', { params: { range: '0-100' } })
    return Array.isArray(data) ? data : []
  },

  async cancelCost({ ticketId }) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/delete/${ticketId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression du coût local');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [deleteTicketCost]:", error);
      throw error;
    }
  },

  async reopenTicketCost({ ticketId, percentage, mode }) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/reopen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, percentage, mode })
      });
      if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du coût de réouverture');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [reopenTicketCost]:", error);
      throw error;
    }
  },

  async updateCost({ id, amount }) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, amount })
      });
      if (!response.ok) throw new Error('Erreur lors de modification dans la table de couts');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [reopenTicketCost]:", error);
      throw error;
    }
  }

};