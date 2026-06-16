<template>
  <div class="kanban-page">
    <div class="kanban-header">
      <div class="header-left">
        <h2>Tableau de Bord Kanban</h2>
        <p class="subtitle">Gestion visuelle des tickets de support GLPI</p>
      </div>
      <div class="header-actions">
        <button @click="showCreateModal = true" class="create-btn">
          ➕ Créer un Ticket
        </button>
        <button @click="refreshBoard" class="refresh-btn" :disabled="isLoading">
          <span v-if="isLoading">Chargement...</span>
          <span v-else>Actualiser</span>
        </button>
      </div>
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
          @change="handleCardMove($event, column.id)"
        >
          <template #item="{ element }">
            <div class="ticket-card" @click="handleOpenDetails(element)">
              <div class="ticket-card-header">
                <span class="ticket-id">#{{ element.id }}</span>
                <span class="ticket-priority" :class="'priority-' + element.priority">
                  P{{ element.priority || 3 }}
                </span>
              </div>
              <div class="ticket-title">{{ element.name }}</div>
              <div class="ticket-card-footer">
                <span class="ticket-date">📅 {{ element.date_mod || element.date }}</span>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>

    <div v-else class="kanban-loader-container">
      <div class="loader-spinner"></div>
      <p>Synchronisation en temps réel avec la base de données...</p>
    </div>

    <TicketCreateModal 
      v-slot v-if="showCreateModal" 
      @close="showCreateModal = false" 
      @created="handleTicketCreated"
    />

    <TicketDetailModal 
      v-slot v-if="showDetailModal" 
      @close="showDetailModal = false"
    />

    <div v-if="showCostModal" class="modal-overlay" @click.self="cancelResolution">
      <div class="cost-modal-content animate-pop">
        <div class="cost-modal-header">
          <h3>💰 Clôture financière : Ticket #{{ pendingTicket?.id }}</h3>
          <button @click="cancelResolution" class="btn-close">&times;</button>
        </div>
        <div class="cost-modal-body">
          <p>Le ticket va passer au statut <strong>Résolu</strong>. Veuillez renseigner les frais de maintenance associés pour SQLite :</p>
          <div class="cost-form-group">
            <label>Libellé de l'intervention</label>
            <input v-model="costInputName" type="text" placeholder="Ex: Remplacement matériel" />
          </div>
          <div class="cost-form-group">
            <label>Montant du coût (€)</label>
            <input v-model.number="costInputAmount" type="number" step="0.01" placeholder="0.00" autofocus />
          </div>
        </div>
        <div class="cost-modal-footer">
          <button @click="cancelResolution" class="btn-cost-cancel">Annuler</button>
          <button @click="confirmResolutionWithCost" class="btn-cost-confirm">Enregistrer & Valider</button>
        </div>
      </div>
    </div>

    <div v-if="showCancelModal" class="modal-overlay" @click.self="cancelAnnulation">
      <div class="cost-modal-content animate-pop">
        <div class="cost-modal-header" style="background-color: #fff7ed; border-bottom: 1px solid #ffedd5;">
          <h3 style="color: #c2410c;">🔄 Réouverture du Ticket #{{ pendingTicket?.id }}</h3>
          <button @click="cancelAnnulation" class="btn-close">&times;</button>
        </div>
        
        <div class="cost-modal-body">
          <p>Ce ticket était résolu. Veuillez choisir l'action à réaliser pour son retour à l'état <strong>En cours</strong> :</p>
          
          <div class="reopen-box">
            <label class="reopen-label">Pourcentage appliqué pour la réouverture (%)</label>
            <div class="reopen-input-wrapper">
              <input 
                v-model.number="reopenPercentage" 
                type="number" 
                step="1" 
                placeholder="Ex: 15" 
                min="0" 
                class="reopen-field"
                autofocus
              />
              <span class="reopen-unit">%</span>
            </div>
            <small class="reopen-hint">Saisissez la valeur (ex: 15 pour ajouter 15% du dernier coût enregistré) avant de cliquer sur Réouverture.</small>
          </div>
        </div>

        <div class="cost-modal-footer dialog-footer-split">
          <button @click="confirmAnnulation" class="btn-action-delete">
            ❌ Annulation (Suppr. coût)
          </button>
          
          <button @click="confirmReouverture" class="btn-action-reopen">
            🚀 Réouverture
          </button>
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
  confirmResolutionWithCost,
  cancelResolution,
  cancelAnnulation,
  handleOpenDetails,
  handleTicketCreated,
  confirmAnnulation,
  confirmReouverture
} = useTicketKanban()
</script>

<style scoped>
.kanban-page { padding: 24px; background-color: #f8fafc; min-height: 100vh; font-family: system-ui, sans-serif; }
.kanban-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.header-left h2 { margin: 0; font-size: 1.75rem; color: #0f172a; font-weight: 700; }
.subtitle { margin: 4px 0 0; color: #64748b; font-size: 0.95rem; }
.header-actions { display: flex; gap: 12px; }
.create-btn { background-color: #0f172a; color: white; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.create-btn:hover { background-color: #1e293b; }
.refresh-btn { background-color: white; border: 1px solid #cbd5e1; color: #334155; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; }
.refresh-btn:hover:not(:disabled) { background-color: #f1f5f9; }

.search-container { margin-bottom: 24px; }
.search-input { width: 100%; max-width: 500px; padding: 11px 16px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border 0.2s; }
.search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1); }

.kanban-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: start; }
.kanban-column { background-color: #f1f5f9; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; max-height: 80vh; overflow: hidden; }
.column-header { padding: 14px 16px; border-top: 4px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; }
.column-header h3 { margin: 0; font-size: 1rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.ticket-count { padding: 2px 8px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }

.column-cards-zone { padding: 12px; overflow-y: auto; flex-grow: 1; min-height: 200px; display: flex; flex-direction: column; gap: 12px; }
.ticket-card { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
.ticket-card:hover { transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
.ticket-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ticket-id { font-size: 0.8rem; font-weight: 700; color: #94a3b8; }
.ticket-priority { font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
.priority-5 { background: #fef2f2; color: #ef4444; }
.priority-3 { background: #fffbeb; color: #d97706; }
.ticket-title { font-size: 0.95rem; color: #1e293b; font-weight: 600; line-height: 1.4; margin-bottom: 10px; word-break: break-word; }
.ticket-card-footer { font-size: 0.75rem; color: #64748b; }

.kanban-loader-container { text-center: center; padding: 60px 0; color: #64748b; }
.loader-spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top-color: #0f172a; border-radius: 50%; margin: 0 auto 16px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Modales */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; backdrop-filter: blur(2px); }
.cost-modal-content { background: white; border-radius: 12px; width: 100%; max-width: 520px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); overflow: hidden; }
.animate-pop { animation: pop 0.2s ease-out; }
@keyframes pop { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.cost-modal-header { padding: 16px 20px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
.cost-modal-header h3 { margin: 0; font-size: 1.1rem; color: #0f172a; }
.btn-close { background: none; border: none; font-size: 1.5rem; color: #94a3b8; cursor: pointer; }
.cost-modal-body { padding: 20px; color: #475569; font-size: 0.95rem; line-height: 1.5; }
.cost-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.cost-form-group label { font-size: 0.8rem; font-weight: 700; color: #64748b; text-transform: uppercase; }
.cost-form-group input { padding: 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 1rem; outline: none; color: #1e293b; }
.cost-form-group input:focus { border-color: #10b981; }

/* Styles spécifiques Réouverture */
.reopen-box { background: #fef8f2; border: 1px solid #ffedd5; padding: 16px; border-radius: 8px; margin-top: 10px; }
.reopen-label { font-size: 0.85rem; font-weight: 700; color: #c2410c; display: block; margin-bottom: 6px; text-transform: uppercase; }
.reopen-input-wrapper { display: flex; align-items: center; position: relative; max-width: 160px; }
.reopen-field { width: 100%; padding: 10px 35px 10px 12px; border: 1px solid #fdba74; border-radius: 6px; font-size: 1.1rem; font-weight: bold; text-align: center; color: #9a3412; outline: none; }
.reopen-field:focus { border-color: #ea580c; box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.15); }
.reopen-unit { position: absolute; right: 12px; font-weight: bold; color: #9a3412; }
.reopen-hint { display: block; font-size: 0.78rem; color: #7c2d12; margin-top: 8px; line-height: 1.3; }

.cost-modal-footer { padding: 14px 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; }
.dialog-footer-split { justify-content: space-between !important; align-items: center; }

.btn-cost-cancel { background: white; border: 1px solid #cbd5e1; padding: 9px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; color: #475569; }
.btn-cost-confirm { background: #10b981; color: white; border: none; padding: 9px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
.btn-cost-confirm:hover { background: #059669; }

.btn-action-delete { background-color: #ef4444; color: white; border: none; padding: 10px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-action-delete:hover { background-color: #dc2626; }
.btn-action-reopen { background-color: #3b82f6; color: white; border: none; padding: 10px 18px; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.btn-action-reopen:hover { background-color: #2563eb; }
</style>