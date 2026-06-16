Étape 1 : Le Backend (SQLite & Express)

Il nous faut un nouvel endpoint dédié à la suppression totale de tous les coûts d'un ticket (contrairement à votre méthode actuelle cancelLastCosts qui ne supprime que le dernier coût inséré via MAX(id)).
A. Dans kanbanConfigService.js (Service SQL)

Ajoutez cette méthode pour purger toutes les lignes correspondantes :
JavaScript

async clearAllTicketCosts(ticketId) {
  const db = await getDb();
  try {
    // Supprime absolument toutes les entrées liées à ce ticket_id
    return await db.run('DELETE FROM tickets_costs WHERE ticket_id = ?', [ticketId]);
  } catch (error) {
    console.error("❌ Erreur SQLite lors de la purge complète des coûts :", error);
    throw error;
  }
}

B. Dans kanbanConfigController.js (Contrôleur)

Créez la fonction qui appelle ce service :
JavaScript

async purgeCosts(req, res) {
  const { ticket_id } = req.params;

  if (!ticket_id) {
    return res.status(400).json({ message: "L'identifiant du ticket (ticket_id) est requis." });
  }

  try {
    await kanbanConfigService.clearAllTicketCosts(ticket_id);
    res.json({ message: "Tout l'historique des coûts pour ce ticket a été supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne lors de la purge des coûts." });
  }
}

C. Dans kanbanConfigRoutes.js (Route Express)

Déclarez la nouvelle route de suppression totale :
JavaScript

router.delete('/kanban/costs/purge/:ticket_id', kanbanConfigController.purgeCosts);

Étape 2 : Le Frontend (Service API & Composable)
A. Dans kanbanCostService.js (Appel API)

Ajoutez la fonction pour envoyer la requête DELETE vers votre serveur Express :
JavaScript

async purgeTicketCosts(ticketId) {
  try {
    const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/purge/${ticketId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) throw new Error('Erreur lors de la purge complète des coûts locaux');
    return await response.json();
  } catch (error) {
    console.error("❌ Erreur [kanbanCostService.purgeTicketCosts]:", error);
    throw error;
  }
}

B. Dans useTicketKanban.js (Gestion de l'état)

Nous devons ajouter un nouvel état réactif showResetModal et intercepter le mouvement lorsque le statut d'origine est 5 (Résolu/Terminé) et le statut cible est 1 (Nouveau).

Modifiez votre composable comme suit :
JavaScript

// 1. Ajoutez la nouvelle variable réactive en haut du composable
const showResetModal = ref(false);

// 2. Modifiez ou étendez votre logique d'interception (ex: dans handleCardMove)
const handleCardMove = async (evt, targetColumnId) => {
  // Supposons que vous détectez le ticket déplacé et sa colonne d'origine :
  const ticket = evt.draggedContext?.element || pendingTicket.value; 
  const oldStatus = ticket.status;
  const newStatus = targetColumnId;

  // INTERCEPTION : De "Terminé" (5) vers "Nouveau" (1)
  if (oldStatus === 5 && newStatus === 1) {
    pendingTicket.value = ticket;
    pendingMoveEvent.value = evt; // Pour annuler graphiquement si besoin
    showResetModal.value = true;   // Ouvre la modal d'avertissement de suppression
    return false;                  // Bloque le déplacement immédiat automatique
  }
  
  // ... reste de votre logique handleCardMove classique ...
};

// 3. Ajoutez les fonctions de validation et d'annulation pour cette modal
const confirmReset = async () => {
  if (!pendingTicket.value) return;

  try {
    const ticketId = pendingTicket.value.id;

    // Étape A : On efface TOUS les coûts de SQLite
    await kanbanCostService.purgeTicketCosts(ticketId);

    // Étape B : On remet le statut à 1 (Nouveau) dans GLPI
    await updateTicketStatus(ticketId, 1);

    showResetModal.value = false;
    pendingTicket.value = null;
    pendingMoveEvent.value = null;

    alert("Le ticket a été replacé en 'Nouveau' et ses coûts SQLite ont été entièrement purgés !");
    refreshBoard();
  } catch (error) {
    alert("Une erreur est survenue lors du retour à l'état initial.");
    refreshBoard();
  }
};

const cancelReset = () => {
  showResetModal.value = false;
  pendingTicket.value = null;
  pendingMoveEvent.value = null;
  refreshBoard(); // Annule visuellement le drag and drop en rechargeant le board
};

// 4. N'oubliez pas d'exposer les variables dans le return final
return {
  // ... vos autres retours
  showResetModal,
  confirmReset,
  cancelReset,
  // ...
}

Étape 3 : L'Interface Graphique (TicketKanban.vue)

Ajoutez le code HTML de la nouvelle fenêtre modale n'importe où dans votre template (par exemple, juste à côté de vos autres modals existantes comme showCostModal).
HTML

<div v-if="showResetModal" class="cost-modal-overlay">
  <div class="cost-modal-container border-danger-top">
    
    <div class="cost-modal-header bg-danger-subtle">
      <h3 class="text-danger fw-bold m-0">⚠️ Action Critique : Réinitialisation</h3>
      <button @click="cancelReset" class="btn-close">&times;</button>
    </div>

    <div class="cost-modal-body py-4">
      <p class="fs-5 text-dark">
        Vous déplacez le ticket <strong class="badge bg-dark">#{{ pendingTicket?.id }}</strong> de la colonne <strong>Terminé</strong> vers <strong>Nouveau</strong>.
      </p>
      <div class="alert alert-danger border-0 shadow-sm my-3">
        <h5 class="fw-bold mb-1">❌ Conséquence irréversible :</h5>
        <p class="m-0">
          Cette action va <strong>supprimer définitivement TOUS les montants financiers et surcoûts</strong> enregistrés localement dans SQLite pour ce ticket. Les rapports de rentabilité par catégorie (AssetStats) seront recalculés sans ces données.
        </p>
      </div>
      <p class="text-muted small m-0">Souhaitez-vous réellement purger l'historique financier de cette intervention ?</p>
    </div>

    <div class="cost-modal-footer d-flex justify-content-end gap-2 p-3 border-top">
      <button @click="cancelReset" class="btn btn-secondary px-4">
        Annuler le déplacement
      </button>
      <button @click="confirmReset" class="btn btn-danger px-4 fw-bold">
        Confirmer et Purger les coûts
      </button>
    </div>

  </div>
</div>

Quelques règles de style CSS à ajouter (Optionnel) :

Pour donner un aspect d'avertissement critique à la modal, vous pouvez ajouter ces quelques classes dans la section <style scoped> :
CSS

.border-danger-top {
  border-top: 5px solid #dc3545 !important;
}
.bg-danger-subtle {
  background-color: #f8d7da !important;
}
.cost-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 1050;
}
.cost-modal-container {
  background: white; border-radius: 12px; max-width: 550px; width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
  overflow: hidden; animation: modalPop 0.25s ease-out;
}