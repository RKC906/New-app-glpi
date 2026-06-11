<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-container">
      
      <div class="modal-header">
        <div>
          <span class="fiche-meta-id">TICKET #{{ selectedTicket?.id }}</span>
          <h2>{{ selectedTicket?.name }}</h2>
          <p class="fiche-date-author">Créé le {{ formatDate(selectedTicket?.date) }}</p>
        </div>
        <div class="header-right">
          <span class="badge-status" :class="'status-bg-' + selectedTicket?.status">
            {{ getStatusLabel(selectedTicket?.status) }}
          </span>
          <button class="btn-close" @click="$emit('close')">×</button>
        </div>
      </div>

      <div class="modal-body">
        
        <div class="fiche-section">
          <h4 class="section-title">Description du problème</h4>
          <div class="fiche-content-box" v-html="selectedTicket?.content"></div>
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
          <h4 class="section-title">Suivi Financier et Coûts</h4>
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

      <div class="modal-footer">
        <button class="btn-primary-close" @click="$emit('close')">Fermer la fiche</button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { useTicketsManager } from '@/composables/useTicketsManager'

defineEmits(['close'])

const {
  isLoadingDetails,
  selectedTicket,
  associatedItems,
  ticketCosts,
  totalTicketSum,
  formatDate,
  formatDuration,
  getStatusLabel
} = useTicketsManager()
</script>

<style scoped>
/* Fond de la modale */
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }

/* Conteneur de la fiche */
.modal-container { background: #ffffff; width: 100%; max-width: 900px; max-height: 85vh; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); display: flex; flex-direction: column; overflow: hidden; font-family: sans-serif; }

/* En-tête */
.modal-header { padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
.fiche-meta-id { font-size: 0.8rem; color: #0ea5e9; font-weight: 700; letter-spacing: 0.5px; }
.modal-header h2 { margin: 4px 0; color: #1e293b; font-size: 1.4rem; font-weight: 700; }
.fiche-date-author { margin: 0; color: #64748b; font-size: 0.85rem; }

.header-right { display: flex; align-items: center; gap: 16px; }
.badge-status { padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; color: #ffffff; }
.status-bg-1 { background: #0ea5e9; }
.status-bg-2 { background: #f59e0b; }
.status-bg-5 { background: #10b981; }
.status-bg-6 { background: #94a3b8; }

.btn-close { background: none; border: none; font-size: 1.8rem; color: #94a3b8; cursor: pointer; line-height: 1; }
.btn-close:hover { color: #475569; }

/* Zone de contenu défilante */
.modal-body { padding: 24px; overflow-y: auto; flex: 1; background-color: #f8fafc; display: flex; flex-direction: column; gap: 24px; }

/* Sections */
.fiche-section { background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
.section-title { font-size: 0.9rem; color: #1e293b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0; border-left: 4px solid #1e293b; padding-left: 8px; }
.fiche-content-box { color: #334155; line-height: 1.6; font-size: 0.95rem; }

/* Grille Matériels */
.items-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.associated-item-badge { display: flex; align-items: center; background: #f1f5f9; border: 1px solid #e2e8f0; padding: 10px 14px; border-radius: 6px; }
.item-meta { display: flex; flex-direction: column; }
.item-name { color: #1e293b; font-size: 0.85rem; font-weight: 700; }
.item-type-label { font-size: 0.75rem; color: #64748b; margin-top: 2px; }

/* Tableau des Coûts */
.fiche-table-costs { width: 100%; border-collapse: collapse; margin-top: 4px; }
.fiche-table-costs th { background: #f8fafc; color: #475569; text-align: left; padding: 10px; font-size: 0.8rem; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
.fiche-table-costs td { padding: 10px; border-bottom: 1px solid #f1f5f9; color: #334155; font-size: 0.85rem; }
.total-row { font-weight: 700; background: #fef2f2; color: #991b1b; }
.total-row td { border-top: 2px solid #fee2e2; padding: 12px 10px; font-size: 0.9rem; }

.empty-sub-section { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; text-align: center; color: #94a3b8; border-radius: 6px; font-size: 0.85rem; }
.loading-box-sm { color: #64748b; padding: 10px; text-align: center; font-size: 0.85rem; }

/* Footer */
.modal-footer { padding: 14px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; background: #ffffff; }
.btn-primary-close { padding: 8px 16px; background-color: #1e293b; color: #ffffff; border: none; border-radius: 6px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-primary-close:hover { background-color: #334155; }
</style>