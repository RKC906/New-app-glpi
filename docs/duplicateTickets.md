1. BACKEND : Gestion de la duplication dans SQLite
A. Le Service de Base de Données (kanbanConfigService.js)

On ajoute une méthode optimisée en SQL pur qui sélectionne les coûts de l'ancien ticket pour les réinsérer instantanément avec le nouvel identifiant de ticket.
JavaScript

// Dans src/services/locale/kanbanConfigService.js

const kanbanConfigService = {
  // ... vos autres méthodes (saveCout, getAllCosts...)

  async duplicateCosts(oldTicketId, newTicketId) {
    const db = await getDb();
    try {
      // Insertion à la volée en sélectionnant l'ancien ticket_id
      const result = await db.run(`
        INSERT INTO tickets_costs (ticket_id, item_id, category, amount, label, date)
        SELECT ? as ticket_id, item_id, category, amount, label, date
        FROM tickets_costs
        WHERE ticket_id = ?
      `, [newTicketId, oldTicketId]);
      
      return { success: true, changes: result.changes };
    } catch (error) {
      console.error("❌ Erreur SQLite lors de la duplication des coûts :", error);
      throw error;
    }
  }
};

B. Le Contrôleur (kanbanConfigController.js)

On expose une méthode pour intercepter la requête HTTP contenant l'ID source et l'ID de la copie.
JavaScript

// Dans src/controllers/kanbanConfigController.js

const kanbanConfigController = {
  // ... vos autres méthodes

  async duplicateCosts(req, res) {
    try {
      const { old_ticket_id, new_ticket_id } = req.body;

      if (!old_ticket_id || !new_ticket_id) {
        return res.status(400).json({ message: "Les identifiants source (old_ticket_id) et cible (new_ticket_id) sont requis." });
      }

      const result = await kanbanConfigService.duplicateCosts(old_ticket_id, new_ticket_id);
      res.json({ message: "Coûts locaux dupliqués avec succès !", changes: result.changes });
    } catch (error) {
      console.error("Erreur contrôleur duplicateCosts :", error);
      res.status(500).json({ message: "Erreur interne lors de la duplication des coûts." });
    }
  }
};

C. La Route Express (kanbanConfigRoutes.js)

On déclare le point d'accès d'API en méthode POST.
JavaScript

// Dans src/routes/kanbanConfigRoutes.js
// (Vérifiez votre fichier de routage existant)

router.post('/kanban/costs/duplicate', kanbanConfigController.duplicateCosts);

2. FRONTEND : Orchestration de la duplication
A. Le Service API (kanbanCostService.js)

On ajoute l'appel vers la nouvelle route du serveur Express.
JavaScript

// Dans src/services/locale/kanbanCostService.js

export const kanbanCostService = {
  // ... vos autres méthodes ...

  async duplicateTicketCosts(oldTicketId, newTicketId) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_ticket_id: oldTicketId, new_ticket_id: newTicketId })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la duplication des coûts dans SQLite');
      }
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [kanbanCostService.duplicateTicketCosts]:", error);
      throw error;
    }
  }
};

B. Le Composable du Kanban (useTicketKanban.js)

On écrit la fonction principale. Elle va d'abord demander à GLPI de cloner le ticket (en reprenant le titre, le contenu, la catégorie et le statut actuel), attendre la réponse pour obtenir le nouvel ID, puis appeler SQLite pour les coûts.
JavaScript

// Dans src/composables/locales/useTicketKanban.js

// ... À l'intérieur de la fonction useTicketKanban() ...

const duplicateTicketWithCosts = async (ticket) => {
  isLoading.value = true;
  try {
    // 1. Duplication dans GLPI (via votre gestionnaire ou service GLPI existant)
    // On prépare le payload avec les données du ticket d'origine
    const glpiPayload = {
      name: `[COPIE] ${ticket.name}`,
      content: ticket.content,
      status: ticket.status, // Reste dans la même colonne Kanban
      itilcategories_id: ticket.itilcategories_id,
      urgency: ticket.urgency,
      impact: ticket.impact,
      // Ajoutez ici d'autres champs GLPI nécessaires (items_id, itemtype...)
    };

    // Note : Ajustez cette ligne selon la méthode exacte de création de votre projet (ex: axios ou useTicketsManager)
    // Ici on suppose que useTicketsManager ou api retourne le nouveau ticket créé contenant son nouvel .id
    const newGlpiTicket = await useTicketsManager().createTicket(glpiPayload); 
    
    if (!newGlpiTicket || !newGlpiTicket.id) {
      throw new Error("Impossible de récupérer le nouvel ID du ticket GLPI");
    }

    const newTicketId = newGlpiTicket.id;

    // 2. Duplication des coûts associés dans SQLite local
    await kanbanCostService.duplicateTicketCosts(ticket.id, newTicketId);

    alert(`Ticket #${ticket.id} dupliqué avec succès en Ticket #${newTicketId} (données + coûts dupliqués) !`);
    
    // 3. Rafraîchir le tableau de bord pour afficher le nouveau clone
    await refreshBoard();
  } catch (error) {
    console.error("Erreur lors de la duplication globale :", error);
    alert("Une erreur est survenue lors de la duplication du ticket et de ses coûts.");
  } finally {
    isLoading.value = false;
  }
};

// Pensez à l'ajouter au return final du composable pour que TicketKanban.vue y ait accès
return {
  // ... vos autres retours
  duplicateTicketWithCosts,
};

C. Le Rendu HTML (TicketKanban.vue)

Il ne reste plus qu'à ajouter un bouton ou une option d'action sur vos cartes de tickets (Cards) ou dans votre fenêtre de détails pour déclencher la duplication.
HTML

<div class="ticket-card-actions mt-2 d-flex justify-content-end gap-2">
  <button 
    class="btn btn-sm btn-outline-secondary py-0 px-2" 
    style="font-size: 0.75rem;"
    title="Dupliquer le ticket et ses coûts" 
    @click.stop="duplicateTicketWithCosts(ticket)"
    :disabled="isLoading"
  >
    📋 Dupliquer
  </button>
</div>