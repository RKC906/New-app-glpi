1. La fonction d'API pour ajouter un Coût (ticketService.js)
// Dans votre service de gestion des tickets (ex: ticketService.js)
import api from '@/services/api'

export const ticketService = {
  // ... vos autres fonctions

  /**
   * Assigne un coût financier à un ticket GLPI
   * @param {Number} ticketId - L'ID du ticket concerné
   * @param {Object} costData - Les données du coût (coût direct, temps, nom)
   */
  async addTicketCost(ticketId, costData) {
    try {
      const costInput = {
        input: {
          tickets_id: ticketId,
          name: costData.name || 'Coût d’intervention', // Libellé (ex: "Achat RAM", "Main d'œuvre")
          costtime: costData.costtime || 0,             // Coût horaire calculé par GLPI (optionnel)
          costfixed: parseFloat(costData.amount) || 0,  // 💰 Le coût fixe direct (ex: 45.50)
          begin: costData.date || new Date().toISOString().slice(0, 10), // Date d'application
        }
      }

      // Appele de l'endpoint natif GLPI pour les coûts
      const { data } = await api.post('/TicketCost', costInput)
      console.log(`✅ Coût assigné au ticket #${ticketId} (ID Coût: ${data.id})`)
      return data
    } catch (error) {
      console.error("❌ Erreur lors de l'assignation du coût :", error)
      throw error
    }
  }
}

2. Formulaire rapide dans votre Vue.js (TicketDetailModal.vue)
<div class="cost-assignment-section">
  <h4>💰 Assigner un coût à ce ticket</h4>
  
  <form @submit.prevent="submitCost" class="cost-form">
    <div class="form-group">
      <input 
        v-model="newCost.name" 
        type="text" 
        placeholder="Libellé (ex: Remplacement écran, Clé Licence)" 
        required
      />
    </div>
    
    <div class="form-group amount-group">
      <input 
        v-model.number="newCost.amount" 
        type="number" 
        step="0.01" 
        placeholder="Montant (€ ou Ar)" 
        required
      />
      <button type="submit" :disabled="isSubmittingCost">
        {{ isSubmittingCost ? 'Enregistrement...' : 'Ajouter' }}
      </button>
    </div>
  </form>
</div>