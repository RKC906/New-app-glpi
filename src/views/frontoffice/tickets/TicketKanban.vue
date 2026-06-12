<template>
  <div class="kanban-page">
    <div class="kanban-header">
      <div class="header-left">
        <h2>Tableau de Bord Kanban</h2>
        <p class="subtitle">Gestion visuelle des tickets de support GLPI</p>
      </div>
      <button @click="refreshBoard" class="refresh-btn" :disabled="isLoading">
        <span v-if="isLoading">Chargement...</span>
        <span v-else>Actualiser</span>
      </button>
    </div>

    <div class="search-container">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Rechercher un ticket par titre ou numéro (#125)..." 
        class="search-input"
      />
    </div>

    <div v-if="!isLoading" class="kanban-board">
      <div 
        v-for="column in columnsConfig" 
        :key="column.id" 
        class="kanban-column"
      >
        <div class="column-header" :style="{ borderTopColor: column.color, backgroundColor: column.bg }">
          <h3 :style="{ color: column.textColor }">{{ column.title }}</h3>
          <span class="ticket-count" :style="{ backgroundColor: column.badgeBg, color: column.textColor }">
            {{ boardLists[column.id]?.length || 0 }}
          </span>
        </div>

        <draggable
          v-model="boardLists[column.id]"
          group="tickets"
          item-key="id"
          class="column-cards-zone"
          ghost-class="ghost-card"
          @change="(evt) => handleCardMove(evt, column.id)"
        >
          <template #item="{ element }">
            <div class="ticket-card" :key="element.id" @click="handleOpenDetails(element)">
              <div class="card-header-tags">
                <span class="ticket-id">#{{ element.id }}</span>
                <span class="priority-tag" :class="'prio-' + element.priority">
                  P{{ element.priority }}
                </span>
              </div>
              <h4 class="card-title">{{ element.name || 'Sans titre' }}</h4>
              <div class="card-footer">
                <span class="card-date">
                  {{ element.date ? new Date(element.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) : 'N/A' }}
                </span>
              </div>
            </div>
          </template>
        </draggable>

        <div v-if="column.id === 1" class="column-footer">
          <button @click="showCreateModal = true" class="btn-add-ticket">
            + Ajouter un ticket
          </button>
        </div>
      </div>
    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Synchronisation en temps réel avec vos modules GLPI...</p>
    </div>

    <TicketCreateModal 
      v-if="showCreateModal" 
      @close="showCreateModal = false"
      @success="handleTicketCreated"
    />

    <TicketDetailModal 
      v-if="showDetailModal"
      @close="showDetailModal = false"
    />

    <div v-if="showCostModal" class="modal-overlay" @click.self="cancelResolution">
      <div class="cost-modal-content">
        <div class="cost-modal-header">
          <h3>🛠️ Résolution du ticket #{{ pendingTicket?.id }}</h3>
          <button @click="cancelResolution" class="btn-close">&times;</button>
        </div>
        
        <div class="cost-modal-body">
          <p>Vous êtes sur le point de marquer ce ticket comme <strong>Résolu</strong>. Veuillez renseigner le coût lié à cette intervention pour les statistiques locales :</p>
          
          <div class="cost-form-group">
            <label>Libellé du coût</label>
            <input v-model="costInputName" type="text" placeholder="Ex: Remplacement matériel, Main d'œuvre..." />
          </div>

          <div class="cost-form-group">
            <label>Montant du coût</label>
            <input v-model.number="costInputAmount" type="number" step="0.01" placeholder="0.00" min="0" required autofocus />
          </div>
        </div>

        <div class="cost-modal-footer">
          <button @click="cancelResolution" class="btn-cost-cancel">Annuler</button>
          <button @click="confirmResolutionWithCost" class="btn-cost-confirm">Confirmer & Résoudre</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import draggable from 'vuedraggable'
import TicketCreateModal from '@/components/front/tickets/TicketCreateModal.vue'
import TicketDetailModal from '@/components/front/tickets/TicketDetailModal.vue'
import { useTicketKanban } from '@/composables/locales/useTicketKanban'

// Extraction de toute la logique métier depuis le composable
const {
  isLoading,
  showCreateModal,
  showDetailModal,
  showCostModal,
  searchQuery,
  costInputAmount,
  costInputName,
  pendingTicket,
  columnsConfig,
  boardLists,
  refreshBoard,
  handleCardMove,
  confirmResolutionWithCost,
  cancelResolution,
  handleOpenDetails,
  handleTicketCreated
} = useTicketKanban()
</script>

<style scoped>
.kanban-page { padding: 30px; background-color: #f1f5f9; min-height: 100vh; font-family: sans-serif; }
.kanban-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.kanban-header h2 { font-size: 1.8rem; color: #1e293b; margin: 0; font-weight: 700; }
.subtitle { margin: 4px 0 0 0; font-size: 0.95rem; color: #64748b; }
.refresh-btn { padding: 10px 18px; background: #1e293b; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.refresh-btn:hover { background: #334155; }
.search-container { margin-bottom: 25px; max-width: 500px; }
.search-input { width: 100%; padding: 12px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.9rem; color: #1e293b; background-color: #ffffff; outline: none; transition: all 0.15s ease-in-out; }
.search-input:focus { border-color: #1e293b; box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.08); }
.kanban-board { display: flex; gap: 24px; align-items: flex-start; overflow-x: auto; padding-bottom: 20px; }
.kanban-column { flex: 1; min-width: 320px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; max-height: 80vh; overflow: hidden; }
.column-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 4px solid #ccc; }
.column-header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
.ticket-count { padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
.column-cards-zone { flex: 1; overflow-y: auto; padding: 16px; min-height: 150px; display: flex; flex-direction: column; gap: 14px; }
.ticket-card { background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); cursor: grab; }
.ticket-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border-color: #e2e8f0; transition: transform 0.15s; }
.card-header-tags { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ticket-id { font-size: 0.8rem; font-weight: 700; color: #94a3b8; }
.priority-tag { padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: #e2e8f0; color: #475569; }
.prio-4, .prio-5 { background: #fee2e2; color: #dc2626; }
.card-title { margin: 0 0 12px 0; font-size: 0.95rem; color: #334155; font-weight: 600; line-height: 1.5; }
.card-footer { font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
.column-footer { padding: 12px 16px; border-top: 1px solid #e2e8f0; background-color: #ffffff; }
.btn-add-ticket { width: 100%; padding: 10px; background: none; border: 1px dashed #cbd5e1; border-radius: 6px; color: #64748b; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center; }
.btn-add-ticket:hover { background-color: #f1f5f9; color: #1e293b; border-color: #94a3b8; }
.ghost-card { opacity: 0.3; background-color: #cbd5e1 !important; border: 2px dashed #94a3b8 !important; box-shadow: none !important; }
.loading-state { text-align: center; padding: 60px 0; color: #64748b; }
.spinner { width: 45px; height: 45px; border: 4px solid #e2e8f0; border-top-color: #1e293b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modale de gestion des coûts locaux */
.modal-overlay { 
  position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
  background-color: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px); 
  display: flex; justify-content: center; align-items: center; z-index: 1000; 
}
.cost-modal-content {
  background: white; width: 100%; max-width: 450px; border-radius: 10px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15); display: flex; flex-direction: column;
  overflow: hidden; animation: popUp 0.2s ease-out;
}
@keyframes popUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.cost-modal-header {
  padding: 16px 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;
  display: flex; justify-content: space-between; align-items: center;
}
.cost-modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.btn-close { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
.cost-modal-body { padding: 20px; color: #475569; font-size: 0.95rem; line-height: 1.5; }
.cost-form-group { display: flex; flex-direction: column; gap: 6px; margin-top: 14px; }
.cost-form-group label { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.cost-form-group input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; outline: none; color: #1e293b; }
.cost-form-group input:focus { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); }
.cost-modal-footer { padding: 14px 20px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 10px; background-color: #f8fafc; }
.btn-cost-cancel { padding: 9px 16px; background: #e2e8f0; border: none; border-radius: 6px; font-weight: 600; color: #475569; cursor: pointer; }
.btn-cost-cancel:hover { background: #cbd5e1; }
.btn-cost-confirm { padding: 9px 16px; background: #10b981; border: none; border-radius: 6px; font-weight: 600; color: white; cursor: pointer; }
.btn-cost-confirm:hover { background: #059669; }
</style>