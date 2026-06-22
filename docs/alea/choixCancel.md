Étape 1 : Modifier le Backend (Express & SQLite)

Ton endpoint doit maintenant recevoir l'ID spécifique de la ligne que l'utilisateur a cliquée. Nous allons modifier la route pour intercepter cet id unique, extraire la ligne correspondante, la copier dans l'historique, puis la supprimer.

Voici le code à mettre dans ton contrôleur/routeur backend :
JavaScript

// Côté Serveur (Express) - Remplacement de l'ancienne route d'annulation
router.post('/kanban/costs/cancel/:costId', async (req, res) => {
  const { costId } = req.params; // On récupère l'ID unique de la ligne de coût

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // 1. On cherche la ligne EXACTE correspondant à cet ID
    const selectQuery = "SELECT * FROM tickets_costs WHERE id = ?";
    
    db.get(selectQuery, [costId], (err, row) => {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        db.run("ROLLBACK");
        return res.status(404).json({ error: "Ligne de coût introuvable." });
      }

      // 2. On insère cette ligne spécifique dans l'historique des annulations
      const insertHistoryQuery = `
        INSERT INTO cancelled_costs (original_id, ticket_id, amount, label, date)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(insertHistoryQuery, [row.id, row.ticket_id, row.amount, row.label, row.date], (err) => {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }

        // 3. On supprime la ligne de la table principale grâce à son ID unique
        const deleteQuery = "DELETE FROM tickets_costs WHERE id = ?";
        
        db.run(deleteQuery, [costId], (err) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: err.message });
          }

          // Tout est bon, on valide la transaction
          db.run("COMMIT");
          res.json({ message: `Le coût #${costId} a été annulé et archivé.` });
        });
      });
    });
  });
});

Étape 2 : Mettre à jour ton Service Frontend (kanbanCostService.js)

Dans ton fichier service, on adapte la fonction pour envoyer le costId au serveur au lieu du ticketId.
JavaScript

// Dans ton fichier kanbanCostService.js

  async cancelSpecificCost(costId) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/cancel/${costId}`, {
        method: 'POST', // Utilisation de POST pour l'action d'archivage
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Erreur lors de l\'annulation du coût ciblé');
      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [cancelSpecificCost]:", error);
      throw error;
    }
  },

Étape 3 : L'interface utilisateur dans ta Vue (ex: dans ta Modal de Détails)

Pour que l'utilisateur puisse "choisir", il faut lui afficher la liste des coûts liés au ticket (par exemple à l'intérieur de ta modal de détails d'un ticket showDetailModal).

À côté de chaque ligne de coût, on ajoute un bouton "Annuler" en lui passant l'ID de la ligne.

Voici à quoi ressemblera la section dans ton composant Vue :
Extrait de code

<div class="ticket-costs-section">
  <h3>💰 Historique financier de ce ticket</h3>
  
  <ul>
    <li v-for="cost in currentTicketCosts" :key="cost.id" class="cost-item">
      <span>{{ cost.label }} - <strong>{{ cost.amount }} €</strong></span>
      
      <button @click="handleCancelCost(cost.id)" class="btn-cancel-specific">
        ❌ Annuler ce coût
      </button>
    </li>
  </ul>
</div>

Étape 4 : Adapter la logique dans ton Composable (useTicketKanban.js)

Dans ton composable qui gère le tableau Kanban, tu ajoutes la fonction pour gérer l'action du clic :
JavaScript

// Dans ton fichier useTicketKanban.js

const handleCancelCost = async (costId) => {
  if (!confirm("Voulez-vous vraiment annuler et archiver ce coût spécifique ?")) return;

  try {
    // 1. Appel du service avec l'ID du coût sélectionné
    await kanbanCostService.cancelSpecificCost(costId);
    
    alert("Le coût a bien été retiré et transféré dans l'historique !");
    
    // 2. Rafraîchir les données de l'écran pour mettre à jour l'affichage
    await refreshBoard(); 
    // Si tu affiches la liste dans la modal, pense à recharger aussi `currentTicketCosts`
    
  } catch (error) {
    alert("Impossible d'annuler ce coût.");
  }
};