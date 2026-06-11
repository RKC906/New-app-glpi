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
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, watch } from 'vue'
import draggable from 'vuedraggable'
import { useTicketsManager } from '@/composables/useTicketsManager'
import TicketCreateModal from '@/components/front/tickets/TicketCreateModal.vue'
import TicketDetailModal from '@/components/front/tickets/TicketDetailModal.vue'
// Utilisation du service SQLite
import { kanbanConfigService } from '@/services/locale/kanbanConfigService'

const { tickets, isLoading, loadTickets, updateTicketStatus, selectTicket } = useTicketsManager()

const showCreateModal = ref(false)
const showDetailModal = ref(false)
const searchQuery = ref('')

// Configuration initiale par défaut
const columnsConfig = ref([
  { id: 1, title: 'Nouveau', color: '#0ea5e9', bg: '#f0f9ff', textColor: '#0369a1', badgeBg: 'rgba(14, 165, 233, 0.15)' },
  { id: 2, title: 'En Cours', color: '#f59e0b', bg: '#fffaf0', textColor: '#b45309', badgeBg: 'rgba(245, 158, 11, 0.15)' },
  { id: 5, title: 'Résolu', color: '#10b981', bg: '#f0fdf4', textColor: '#15803d', badgeBg: 'rgba(16, 185, 129, 0.15)' }
])

const boardLists = reactive({ 1: [], 2: [], 5: [] })

/**
 * Lit la configuration SQLite (Couleurs + Langue choisie par l'admin)
 */
const loadCustomKanbanConfig = async () => {
  try {
    const config = await kanbanConfigService.fetchConfig()
    // Forcer en minuscule et nettoyer la langue active
    const activeLang = (config.currentLang || 'fr').toLowerCase().trim() 

    columnsConfig.value = columnsConfig.value.map(column => {
      const customColor = config.colors.find(c => c.id_status === column.id)
      
      // Sécuriser la comparaison de la langue
      const customTrans = config.translations.find(t => {
        const tLang = (t.langue || '').toLowerCase().trim()
        return t.id_status === column.id && tLang === activeLang
      })

      return {
        ...column,
        bg: customColor ? customColor.color : column.bg,
        // Si customTrans existe, on prend sa traduction, sinon on garde la valeur par défaut
        title: customTrans ? customTrans.translation : column.title
      }
    })
  } catch (error) {
    console.error('Erreur de chargement des paramètres SQLite:', error)
  }
}

const dispatchTicketsToBoard = () => {
  const filtered = tickets.value.filter(t => {
    const query = searchQuery.value.toLowerCase().trim()
    if (!query) return true
    
    const matchesTitle = t.name ? t.name.toLowerCase().includes(query) : false
    const matchesId = t.id ? t.id.toString().includes(query.replace('#', '')) : false
    
    return matchesTitle || matchesId
  })

  boardLists[1] = filtered.filter(t => parseInt(t.status) === 1)
  boardLists[2] = filtered.filter(t => parseInt(t.status) === 2 || parseInt(t.status) === 3)
  boardLists[5] = filtered.filter(t => parseInt(t.status) === 5 || parseInt(t.status) === 6)
}

watch([tickets, searchQuery], () => { 
  dispatchTicketsToBoard() 
}, { deep: true })

const handleCardMove = async (event, targetStatusId) => {
  if (!event.added) return
  const targetTicket = event.added.element
  try {
    await updateTicketStatus(targetTicket.id, targetStatusId)
    targetTicket.status = targetStatusId
  } catch (error) {
    refreshBoard()
  }
}

const handleOpenDetails = async (ticket) => {
  showDetailModal.value = true
  await selectTicket(ticket)
}

const handleTicketCreated = () => {
  showCreateModal.value = false
  refreshBoard()
}

const refreshBoard = () => {
  loadTickets()
  loadCustomKanbanConfig() // Se remet à jour avec la langue et les couleurs de l'admin
}

onMounted(() => {
  loadTickets()
  loadCustomKanbanConfig()
})
</script>

<style scoped>
/* Conserve ton CSS d'origine */
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
</style>