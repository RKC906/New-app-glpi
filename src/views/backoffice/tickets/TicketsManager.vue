<template>
 <div class="tickets-manager">
 <div class="tickets-sidebar">
 <div class="sidebar-header">
 <h3>Tickets GLPI ({{ filteredTickets.length }})</h3>
 <button @click="loadTickets" :disabled="isLoading" class="btn-refresh-sm">Actualiser</button>
 </div>

 <div class="sidebar-search">
 <input 
 v-model="searchQuery" 
 type="text" 
 placeholder="Rechercher par titre ou numéro (#12)..." 
 class="search-input"
 />
 </div>

 <div v-if="isLoading && tickets.length === 0" class="loading-box">Chargement...</div>

 <div class="tickets-list" v-else>
 <div 
 v-for="ticket in filteredTickets" 
 :key="ticket.id" 
 class="ticket-item-card"
 :class="{ 'active': selectedTicket && selectedTicket.id === ticket.id }"
 @click="selectTicket(ticket)"
 >
 <div class="ticket-card-header">
 <span class="ticket-id">#{{ ticket.id }}</span>
 <span class="badge-type" :class="ticket.type === 1 ? 'incident' : 'demand'">
 {{ ticket.type === 1 ? 'Incident' : 'Demande' }}
 </span>
 </div>
 <h4 class="ticket-card-title">{{ ticket.name }}</h4>
 <div class="ticket-card-footer">
 <span class="ticket-status-dot" :class="'status-' + ticket.status"></span>
 <span class="ticket-date">{{ formatDate(ticket.date) }}</span>
 </div>
 </div>
 
 <div v-if="filteredTickets.length === 0" class="empty-search-state">
 Aucun ticket ne correspond à la recherche.
 </div>
 </div>
 </div>

 <div class="ticket-detail-view">
 <div v-if="selectedTicket" class="fiche-container">
 
 <div class="fiche-header">
 <div>
 <span class="fiche-meta-id">TICKET #{{ selectedTicket.id }}</span>
 <h2>{{ selectedTicket.name }}</h2>
 <p class="fiche-date-author">Créé le {{ formatDate(selectedTicket.date) }}</p>
 </div>
 <div class="fiche-badges">
 <span class="badge-status" :class="'status-bg-' + selectedTicket.status">
 {{ getStatusLabel(selectedTicket.status) }}
 </span>
 </div>
 </div>

 <div class="fiche-section">
 <h4 class="section-title">Description du problème</h4>
 <div class="fiche-content-box" v-html="selectedTicket.content"></div>
 </div>

 <div class="fiche-section">
 <h4 class="section-title">Équipements du Parc liés</h4>
 <div v-if="isLoadingDetails" class="loading-box-sm">Recherche des liaisons...</div>
 <div v-else-if="associatedItems.length === 0" class="empty-sub-section">
 Aucun matériel associé à ce ticket.
 </div>
 <div v-else class="items-grid">
 <div v-for="item in associatedItems" :key="item.id" class="associated-item-badge">
 <div class="item-meta">
 <strong class="item-name">{{ item.item_name }}</strong>
 <span class="item-type-label">{{ item.itemtype }} (ID: {{ item.items_id }})</span>
 </div>
 </div>
 </div>
 </div>

 <div class="fiche-section">
 <h4 class="section-title">Suivi Financier & Coûts (Fichier 3)</h4>
 <div v-if="isLoadingDetails" class="loading-box-sm">Calcul des coûts...</div>
 <div v-else-if="ticketCosts.length === 0" class="empty-sub-section">
 Aucune ligne financière imputée sur ce ticket.
 </div>
 <div v-else>
 <table class="fiche-table-costs">
 <thead>
 <tr>
 <th>Désignation</th>
 <th>Temps d'action</th>
 <th>Coût Temps</th>
 <th>Coût Fixe</th>
 <th style="text-align: right;">Total Ligne</th>
 </tr>
 </thead>
 <tbody>
 <tr v-for="cost in ticketCosts" :key="cost.id">
 <td>{{ cost.name || 'Frais d\'intervention' }}</td>
 <td>{{ formatDuration(cost.actiontime) }}</td>
 <td>{{ cost.cost_time }} €</td>
 <td>{{ cost.cost_fixed }} €</td>
 <td style="text-align: right; font-weight: bold;">
 {{ (parseFloat(cost.cost_time) + parseFloat(cost.cost_fixed)).toFixed(2) }} €
 </td>
 </tr>
 </tbody>
 <tfoot>
 <tr class="total-row">
 <td colspan="4">Montant Total à imputer :</td>
 <td style="text-align: right;">{{ totalTicketSum.toFixed(2) }} €</td>
 </tr>
 </tfoot>
 </table>
 </div>
 </div>

 </div>

 <div v-else class="empty-state">
 <h3>Aucun ticket sélectionné</h3>
 <p>Sélectionnez un ticket dans la colonne de gauche pour afficher sa fiche d'assistance complète et son historique financier.</p>
 </div>
 </div>
 </div>
 
 <div class="navigation-footer">
 <RouterLink :to="{ name: 'accueil' }">
 <button class="btn-secondary">Retour à l'accueil</button>
 </RouterLink>
 </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTicketsManager } from '@/composables/useTicketsManager'

const {
 isLoading,
 isLoadingDetails,
 tickets,
 selectedTicket,
 associatedItems,
 ticketCosts,
 totalTicketSum,
 loadTickets,
 selectTicket,
 formatDate,
 formatDuration,
 getStatusLabel
} = useTicketsManager()

// Variable locale pour stocker la chaîne de recherche
const searchQuery = ref('')

// Propriété calculée pour filtrer les tickets réactivement
const filteredTickets = computed(() => {
 const query = searchQuery.value.toLowerCase().trim()
 if (!query) return tickets.value

 return tickets.value.filter(ticket => {
 const matchesTitle = ticket.name ? ticket.name.toLowerCase().includes(query) : false
 const matchesId = ticket.id ? ticket.id.toString().includes(query.replace('#', '')) : false
 return matchesTitle || matchesId
 })
})

onMounted(() => {
 loadTickets()
})
</script>

<style scoped>
.tickets-manager { display: flex; height: calc(100vh - 90px); background-color: #f8f9fa; font-family: sans-serif; }
.tickets-sidebar { width: 350px; background: white; border-right: 1px solid #e9ecef; display: flex; flex-direction: column; }
.sidebar-header { padding: 20px; border-bottom: 1px solid #f1f3f5; display: flex; justify-content: space-between; align-items: center; }
.sidebar-header h3 { margin: 0; color: #2c3e50; font-size: 1.1rem; }
.btn-refresh-sm { background: #f1f3f5; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 0.85rem; color: #4f5f6f; }
.btn-refresh-sm:hover { background: #e9ecef; }

/* Styles de la nouvelle zone de recherche sidebar */
.sidebar-search { padding: 12px 15px; background-color: #fdfdfd; border-bottom: 1px solid #f1f3f5; }
.search-input { width: 100%; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; color: #1e293b; outline: none; box-sizing: border-box; }
.search-input:focus { border-color: #3498db; box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1); }
.empty-search-state { padding: 20px; text-align: center; color: #95a5a6; font-size: 0.9rem; }

.tickets-list { flex: 1; overflow-y: auto; padding: 15px; }
.ticket-item-card { background: #fdfdfd; border: 1px solid #e9ecef; border-radius: 6px; padding: 15px; margin-bottom: 12px; cursor: pointer; transition: all 0.2s; }
.ticket-item-card:hover { border-color: #3498db; background: #fafbfc; }
.ticket-item-card.active { border-color: #3498db; background: #eaf2f8; box-shadow: 0 2px 8px rgba(52,152,219,0.15); }
.ticket-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.ticket-id { font-weight: bold; color: #95a5a6; font-size: 0.85rem; }
.ticket-card-title { margin: 0 0 10px 0; color: #34495e; font-size: 0.95rem; line-height: 1.4; }
.ticket-card-footer { display: flex; align-items: center; gap: 8px; }
.ticket-date { font-size: 0.8rem; color: #95a5a6; }
.badge-type { font-size: 0.75rem; padding: 3px 8px; border-radius: 12px; font-weight: bold; }
.badge-type.incident { background: #fdedec; color: #e74c3c; }
.badge-type.demand { background: #eafaf1; color: #2ecc71; }
.ticket-status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.status-1 { background-color: #3498db; }
.status-2 { background-color: #e67e22; }
.status-5 { background-color: #2ecc71; }
.status-6 { background-color: #95a5a6; }

.ticket-detail-view { flex: 1; overflow-y: auto; padding: 30px; }
.fiche-container { background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.04); padding: 30px; max-width: 900px; margin: 0 auto; }
.fiche-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f3f5; padding-bottom: 20px; margin-bottom: 25px; }
.fiche-meta-id { font-size: 0.85rem; color: #3498db; font-weight: bold; letter-spacing: 1px; }
.fiche-header h2 { margin: 5px 0; color: #2c3e50; font-size: 1.6rem; }
.fiche-date-author { margin: 0; color: #95a5a6; font-size: 0.9rem; }
.badge-status { padding: 6px 14px; border-radius: 4px; font-weight: bold; font-size: 0.9rem; color: white; }
.status-bg-1 { background: #3498db; }
.status-bg-2 { background: #e67e22; }
.status-bg-5 { background: #2ecc71; }
.status-bg-6 { background: #95a5a6; }
.fiche-section { margin-bottom: 30px; }
.section-title { font-size: 1rem; color: #2c3e50; border-left: 4px solid #3498db; padding-left: 10px; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
.fiche-content-box { background: #f8f9fa; border: 1px solid #e9ecef; padding: 15px; border-radius: 6px; color: #4f5f6f; line-height: 1.6; }
.items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.associated-item-badge { display: flex; align-items: center; gap: 12px; background: #f4f7f9; border: 1px solid #dce5ec; padding: 10px 15px; border-radius: 6px; }
.item-meta { display: flex; flex-direction: column; }
.item-name { color: #2c3e50; font-size: 0.9rem; font-weight: bold; }
.item-type-label { font-size: 0.75rem; color: #7f8c8d; }
.fiche-table-costs { width: 100%; border-collapse: collapse; margin-top: 10px; }
.fiche-table-costs th { background: #f8f9fa; color: #7f8c8d; text-align: left; padding: 12px; font-size: 0.85rem; border-bottom: 2px solid #e9ecef; }
.fiche-table-costs td { padding: 12px; border-bottom: 1px solid #f1f3f5; color: #34495e; font-size: 0.9rem; }
.total-row { font-weight: bold; background: #fff9f9; color: #c0392b; font-size: 1rem; }
.total-row td { border-top: 2px solid #f9d5d5; padding: 15px 12px; }
.empty-state { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #7f8c8d; text-align: center; padding: 40px; }
.empty-sub-section { background: #fafafa; border: 1px dashed #e9ecef; padding: 15px; text-align: center; color: #95a5a6; border-radius: 4px; font-size: 0.9rem; }
.loading-box, .loading-box-sm { color: #7f8c8d; padding: 10px; text-align: center; font-size: 0.9rem; }

.navigation-footer { padding: 15px; background: #ffffff; border-top: 1px solid #e9ecef; }
.btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; }
.btn-secondary:hover { background-color: #6c757d; }
</style>