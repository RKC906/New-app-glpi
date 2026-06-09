<template>
  <div class="kanban-page">
    <div class="kanban-header">
      <div class="header-left">
        <h2>📋 Tableau de Bord Kanban</h2>
        <p class="subtitle">Gestion visuelle des tickets de support GLPI</p>
      </div>
      <button @click="refreshBoard" class="refresh-btn" :disabled="isLoading">
        <span v-if="isLoading">⏳ Chargement...</span>
        <span v-else><i class="fa-solid fa-rotate"></i> Actualiser</span>
      </button>
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
            {{ getTicketsByStatus(column.id).length }}
          </span>
        </div>

        <draggable
          :list="getTicketsByStatus(column.id)"
          group="tickets"
          item-key="id"
          class="column-cards-zone"
          ghost-class="ghost-card"
          @change="(evt) => handleCardMove(evt, column.id)"
        >
          <template #item="{ element }">
            <div class="ticket-card" @click="selectTicket(element)">
              
              <div class="card-header-tags">
                <span class="ticket-id">#{{ element.id }}</span>
                <span class="priority-tag" :class="'prio-' + element.priority">
                  P{{ element.priority }}
                </span>
              </div>

              <h4 class="card-title">{{ element.name || 'Sans titre' }}</h4>
              
              <div class="card-footer">
                <span class="card-date">
                  📅 {{ element.date ? new Date(element.date).toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'}) : 'N/A' }}
                </span>
              </div>

            </div>
          </template>
        </draggable>
      </div>

    </div>

    <div v-else class="loading-state">
      <div class="spinner"></div>
      <p>Synchronisation en temps réel avec vos modules GLPI...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import draggable from 'vuedraggable'
import { useTicketsManager } from '@/composables/useTicketsManager' // Ajuste le chemin selon ton projet

// Extraction des outils de ton composable existant
const { tickets, isLoading, loadTickets, updateTicketStatus, selectTicket } = useTicketsManager()

// Configuration Palette SaaS Pro validée
const columnsConfig = [
  { id: 1, title: 'Nouveau', color: '#0ea5e9', bg: '#f0f9ff', textColor: '#0369a1', badgeBg: 'rgba(14, 165, 233, 0.15)' },
  { id: 2, title: 'En Cours (Ass)', color: '#f59e0b', bg: '#fffaf0', textColor: '#b45309', badgeBg: 'rgba(245, 158, 11, 0.15)' },
  { id: 4, title: 'En Attente', color: '#94a3b8', bg: '#f8fafc', textColor: '#475569', badgeBg: 'rgba(148, 163, 184, 0.15)' },
  { id: 5, title: 'Résolu', color: '#10b981', bg: '#f0fdf4', textColor: '#15803d', badgeBg: 'rgba(16, 185, 129, 0.15)' }
]

/**
 * 🔍 Filtre dynamiquement la liste de tes tickets réactifs pour chaque colonne
 */
const getTicketsByStatus = (statusId) => {
  return tickets.value.filter(ticket => parseInt(ticket.status) === statusId)
}

/**
 * 🔀 Intercepte le lâcher de souris et applique la mise à jour GLPI
 */
const handleCardMove = async (event, targetStatusId) => {
  if (!event.added) return // On écoute uniquement la colonne qui reçoit la carte

  const targetTicket = event.added.element
  
  try {
    // Appel de la nouvelle méthode de ton composable !
    await updateTicketStatus(targetTicket.id, targetStatusId)
    // On force la mise à jour locale de la propriété status pour éviter les sauts visuels
    targetTicket.status = targetStatusId
  } catch (error) {
    // Si l'API GLPI échoue (Ex: Token expiré, droits insuffisants), on rafraîchit pour annuler le déplacement
    refreshBoard()
  }
}

const refreshBoard = () => {
  loadTickets()
}

onMounted(() => {
  loadTickets() // Utilise directement ta méthode existante qui interroge dashboardService.getTicketsList()
})
</script>

<style scoped>
.kanban-page { padding: 30px; background-color: #f1f5f9; min-height: 100vh; font-family: sans-serif; }
.kanban-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.kanban-header h2 { font-size: 1.8rem; color: #1e293b; margin: 0; font-weight: 700; }
.subtitle { margin: 4px 0 0 0; font-size: 0.95rem; color: #64748b; }

.refresh-btn { padding: 10px 18px; background: #1e293b; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
.refresh-btn:hover { background: #334155; }

.kanban-board { display: flex; gap: 24px; align-items: flex-start; overflow-x: auto; padding-bottom: 20px; }
.kanban-column { flex: 1; min-width: 300px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; display: flex; flex-direction: column; max-height: 80vh; overflow: hidden; }

.column-header { padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; border-top: 4px solid #ccc; }
.column-header h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
.ticket-count { padding: 2px 10px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }

.column-cards-zone { flex: 1; overflow-y: auto; padding: 16px; min-height: 250px; display: flex; flex-direction: column; gap: 14px; }

.ticket-card { background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02); cursor: grab; }
.ticket-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05); border-color: #e2e8f0; transition: transform 0.15s; }

.card-header-tags { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.ticket-id { font-size: 0.8rem; font-weight: 700; color: #94a3b8; }
.priority-tag { padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; background: #e2e8f0; color: #475569; }
.prio-4, .prio-5 { background: #fee2e2; color: #dc2626; } /* Gestion rouge pour tickets urgents */

.card-title { margin: 0 0 12px 0; font-size: 0.95rem; color: #334155; font-weight: 600; line-height: 1.5; }
.card-footer { font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }

.ghost-card { opacity: 0.3; background-color: #cbd5e1 !important; border: 2px dashed #94a3b8 !important; box-shadow: none !important; }

.loading-state { text-align: center; padding: 60px 0; color: #64748b; }
.spinner { width: 45px; height: 45px; border: 4px solid #e2e8f0; border-top-color: #1e293b; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px auto; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>