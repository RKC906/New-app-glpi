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
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/all`);
      if (!response.ok) throw new Error('Erreur récupération coûts');
      return await response.json(); // Retourne [{ ticket_id, amount, label }, ...]
    } catch (error) {
      console.error("Erreur service:", error);
      return [];
    }
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
  }

  // async Costmod1({ ticketId}) {
  //   try {
  //     const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/mod1`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ ticket_id: ticketId})
  //     });
  //     if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du coût de réouverture');
  //     return await response.json();
  //   } catch (error) {
  //     console.error("❌ Erreur [reopenTicketCost]:", error);
  //     throw error;
  //   }
  // },

  //   async Costmod2({ ticketId}) {
  //   try {
  //     const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/mod2`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ ticket_id: ticketId})
  //     });
  //     if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du coût de réouverture');
  //     return await response.json();
  //   } catch (error) {
  //     console.error("❌ Erreur [reopenTicketCost]:", error);
  //     throw error;
  //   }
  // },

  //   async Costmod3({ ticketId}) {
  //   try {
  //     const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/mod3`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ ticket_id: ticketId})
  //     });
  //     if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du coût de réouverture');
  //     return await response.json();
  //   } catch (error) {
  //     console.error("❌ Erreur [reopenTicketCost]:", error);
  //     throw error;
  //   }
  // },

  //   async Costmod4({ ticketId}) {
  //   try {
  //     const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/mod4`, {
  //       method: 'GET',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ ticket_id: ticketId})
  //     });
  //     if (!response.ok) throw new Error('Erreur lors de l\'enregistrement du coût de réouverture');
  //     return await response.json();
  //   } catch (error) {
  //     console.error("❌ Erreur [reopenTicketCost]:", error);
  //     throw error;
  //   }
  // }

};