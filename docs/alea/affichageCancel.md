Étape 1 : S'assurer que le Backend renvoie la date d'annulation

Dans la table cancelled_costs que nous avons planifiée, le champ cancelled_at DATETIME DEFAULT CURRENT_TIMESTAMP génère automatiquement la date et l'heure exactes au moment de l'insertion.

Dans ton serveur Express (par exemple dans ton fichier de routes ou ton contrôleur des coûts), tu dois créer un endpoint GET pour récupérer ces lignes :
JavaScript

// Côté Serveur (Express) - Exemple d'endpoint dans tes routes
router.get('/kanban/costs/cancelled', (req, res) => {
  const query = "SELECT * FROM cancelled_costs ORDER BY cancelled_at DESC";
  
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    // rows contient maintenant toutes les annulations avec la colonne 'cancelled_at'
    res.json(rows);
  });
});

Étape 2 : Ajouter la méthode dans ton Service Frontend (kanbanCostService.js)

Tu dois ouvrir ton fichier kanbanCostService.js (qui utilise l'API native fetch) et ajouter la fonction getCancelledCosts pour appeler ce nouvel endpoint.

Voici le code à y ajouter :
JavaScript

// Dans ton fichier kanbanCostService.js

  async getCancelledCosts() {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs/cancelled`);
      if (!response.ok) throw new Error('Erreur lors de la récupération de l\'historique');
      return await response.json(); // Retourne [{ id, ticket_id, amount, label, cancelled_at }, ...]
    } catch (error) {
      console.error("❌ Erreur [getCancelledCosts]:", error);
      return [];
    }
  },

Étape 3 : Créer le composant d'affichage Vue.js (HistoriqueAnnulations.vue)

Tu peux maintenant créer un nouveau composant Vue (ou l'intégrer sous forme de Modal / Onglet dans ta page de statistiques). Ce composant va appeler le service au montage (onMounted), stocker les données dans une variable réactive (ref), et les afficher dans un tableau HTML propre.

Voici un exemple de fichier .vue complet, moderne (Vue 3 <script setup>) et stylisé :
Extrait de code

<template>
  <div class="history-container">
    <h2>📋 Historique des Annulations de Frais</h2>

    <div v-if="loading" class="loading">Chargement de l'historique...</div>

    <div v-else-if="cancelledCosts.length === 0" class="empty-state">
      Aucune annulation enregistrée pour le moment.
    </div>

    <table v-else class="history-table">
      <thead>
        <tr>
          <th>ID Ticket</th>
          <th>Libellé d'Origine</th>
          <th>Montant Annulé</th>
          <th>Date Prestation</th>
          <th>Date d'Annulation</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="cost in cancelledCosts" :key="cost.id">
          <td class="ticket-id">#{{ cost.ticket_id }}</td>
          <td>{{ cost.label || 'Sans libellé' }}</td>
          <td class="amount">{{ cost.amount.toFixed(2) }} €</td>
          <td>{{ formatDate(cost.date) }}</td>
          <td class="cancelled-date">{{ formatDate(cost.cancelled_at) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { kanbanCostService } from '@/services/locale/kanbanCostService';

const cancelledCosts = ref([]);
const loading = ref(false);

// Charger les données depuis l'API locale SQLite
const fetchHistory = async () => {
  loading.value = true;
  try {
    cancelledCosts.value = await kanbanCostService.getCancelledCosts();
  } catch (error) {
    console.error("Erreur lors du chargement de l'historique dans le composant", error);
  } finally {
    loading.value = false;
  }
};

// Fonction utilitaire pour formater proprement les dates SQL en français
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  // Retourne un format lisible : DD/MM/YYYY à HH:MM
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Charger les données dès que le composant est affiché à l'écran
onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
.history-container {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

h2 {
  color: #1e293b;
  margin-bottom: 20px;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.history-table th {
  background-color: #f8fafc;
  color: #64748b;
  padding: 12px;
  font-weight: 600;
  border-bottom: 2px solid #e2e8f0;
}

.history-table td {
  padding: 12px;
  border-bottom: 1px solid #e2e8f0;
  color: #334155;
}

.ticket-id {
  font-weight: bold;
  color: #0284c7;
}

.amount {
  font-weight: 600;
  color: #ef4444; /* Rouge pour symboliser l'annulation / retrait */
}

.cancelled-date {
  font-weight: 500;
  color: #475569;
  background-color: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
}

.loading, .empty-state {
  text-align: center;
  padding: 4px 0;
  color: #64748b;
  font-style: italic;
}
</style>