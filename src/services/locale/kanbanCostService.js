const EXPRESS_BASE_URL = 'http://localhost:3005/api';

export const kanbanCostService = {
  async saveTicketCost({ ticket_id, amount, label, date }) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id, amount, label, date })
      });

      if (!response.ok) {
        throw new Error('Erreur réseau lors de la sauvegarde du coût');
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [kanbanCostService]:", error);
      throw error;
    }
  },

  async getAllCosts() {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/all`);
      if (!response.ok) throw new Error('Erreur lors de la récupération de tous les coûts');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [kanbanCostService.getAllCosts]:", error);
      throw error;
    }
  }
};