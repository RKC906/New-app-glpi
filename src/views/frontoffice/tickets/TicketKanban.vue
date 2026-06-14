<template>
  <div v-if="showCostModal" class="modal-overlay" @click.self="cancelResolution">
    <div class="cost-modal-content">
      <div class="cost-modal-header">
        <h3>🛠️ Clôture financière du ticket #{{ pendingTicket?.id }}</h3>
        <button @click="cancelResolution" class="btn-close">&times;</button>
      </div>
      <div class="cost-modal-body">
        <p>Saisissez le coût de maintenance pour valider la résolution :</p>
        <div class="cost-form-group">
          <label>Libellé de l'intervention</label>
          <input v-model="costInputName" type="text" />
        </div>
        <div class="cost-form-group">
          <label>Montant du coût (€)</label>
          <input v-model="costInputAmount" type="number" placeholder="0.00" min="0" step="0.01" />
        </div>
      </div>
      <div class="cost-modal-footer">
        <button @click="cancelResolution" class="btn-cost-cancel">Abandonner</button>
        <button @click="confirmResolutionWithCost" class="btn-cost-confirm">Confirmer & Résoudre</button>
      </div>
    </div>
  </div>

  <div v-if="showCancelModal" class="modal-overlay" @click.self="cancelAnnulationModal">
    <div class="cost-modal-content" style="border-top: 4px solid #f59e0b; max-width: 450px;">
      <div class="cost-modal-header">
        <h3>🔄 Réouverture du ticket #{{ pendingTicket?.id }}</h3>
        <button @click="cancelAnnulationModal" class="btn-close">&times;</button>
      </div>
      <div class="cost-modal-body">
        <p>Choisissez l'action financière à appliquer pour ce retour en cours :</p>

        <div class="cost-form-group" style="margin-bottom: 20px; background: #f8fafc; padding: 12px; border-radius: 6px;">
          <label style="color: #475569;">Pourcentage de réouverture (%)</label>
          <input
            v-model.number="reopenPercentage"
            type="number"
            placeholder="Ex: 15"
            min="0"
            style="width: 100%; border-color: #cbd5e1;"
          />
          <small class="text-muted">Sert uniquement si vous cliquez sur "Réouverture".</small>
        </div>
      </div>
      <div class="cost-modal-footer" style="display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap;">
        <button @click="cancelAnnulationModal" class="btn-cost-cancel" style="background-color: #94a3b8; color: white;">Fermer</button>

        <button @click="confirmAnnulation" class="btn-cost-confirm" style="background-color: #ef4444;">
          Annulation
        </button>

        <button @click="confirmReouverture" class="btn-cost-confirm" style="background-color: #f59e0b;">
          Réouverture
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTicketKanban } from '@/composables/locales/useTicketKanban';
import draggable from 'vuedraggable';

const {
  isLoading,
  showCreateModal,
  showDetailModal,
  showCostModal,
  showCancelModal,
  searchQuery,
  costInputAmount,
  costInputName,
  reopenPercentage,
  pendingTicket,
  columnsConfig,
  boardLists,
  refreshBoard,
  handleCardMove,
  cancelResolution,
  confirmResolutionWithCost,
  confirmAnnulation,
  confirmReouverture,
  cancelAnnulationModal
} = useTicketKanban();
</script>
