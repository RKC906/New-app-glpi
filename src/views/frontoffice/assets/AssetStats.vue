<template>
  <div class="container py-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-dark text-white p-4 rounded-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 class="fw-bold m-0">Rentabilité & Coûts par Catégories</h2>
          <p class="text-muted m-0 mt-1 small text-light-50">Analyse croisée des indicateurs financiers GLPI et des surcoûts locaux SQLite</p>
        </div>
        <button class="btn btn-outline-light btn-sm px-3" @click="refreshStats" :disabled="loading">
          🔄 {{ loading ? 'Recalcul...' : 'Actualiser' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5 py-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
      <p class="text-muted mt-3">Calcul et ventilation de la balance financière des parcs...</p>
    </div>

    <div v-else-if="errorMsg" class="alert alert-danger shadow-sm border-0">
      ⚠️ {{ errorMsg }}
    </div>

    <div v-else class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle m-0" >
          <thead class="table-light border-bottom">
            <tr>
              <th class="ps-4 py-3 text-secondary small text-uppercase fw-bold">Catégorie de Matériel</th>
              <th class="py-3 text-secondary small text-uppercase text-end fw-bold">Coût GLPI</th>
              <th class="py-3 text-secondary small text-uppercase text-end text-success fw-bold">Coût Résolution (SQLite)</th>
              <th class="py-3 text-secondary small text-uppercase text-end text-danger fw-bold">Coût Réouverture</th>
              <th class="pe-4 py-3 text-dark fw-bold small text-uppercase text-end fw-bold">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categoriesReport.length === 0">
              <td colspan="5" class="text-center py-5 text-muted italic">
                ℹ️ Aucune donnée financière n'a pu être collectée.
              </td>
            </tr>
            
            <tr 
              v-for="cat in categoriesReport" 
              :key="cat.itemType"
              @click="openDetailsModal(cat)"
              style="cursor: pointer;"
              title="Cliquez pour voir le détail de cette catégorie"
            >
              <td class="ps-4 py-3">
                <div class="fw-bold text-dark fs-6">{{ cat.displayName }}</div>
                <div class="text-muted small-badge-container mt-1">
                  <span class="badge bg-light text-dark border me-1">{{ cat.uniqueItemsCount }} appareil(s)</span>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle">{{ cat.ticketsCount }} ticket(s)</span>
                </div>
              </td>
              <td class="py-3 text-end text-muted font-monospace">{{ cat.glpiCost.toFixed(2) }} €</td>
              <td class="py-3 text-end text-success fw-semibold font-monospace">{{ cat.sqliteCost.toFixed(2) }} €</td>
              <td class="py-3 text-end text-danger fw-semibold font-monospace">{{ cat.reopenCost.toFixed(2) }} €</td>
              <td class="pe-4 py-3 text-end fw-bold text-dark font-monospace fs-5">{{ cat.totalCost.toFixed(2) }} €</td>
            </tr>
          </tbody>

          <tfoot v-if="categoriesReport.length > 0" class="table-light fw-bold border-top border-3 border-secondary">
            <tr>
              <td class="ps-4 py-3 text-uppercase text-secondary small fw-bold">Total Général</td>
              <td class="py-3 text-end font-monospace text-muted">{{ totalGlpi.toFixed(2) }} €</td>
              <td class="py-3 text-end font-monospace text-success">{{ totalSqlite.toFixed(2) }} €</td>
              <td class="py-3 text-end font-monospace text-danger">{{ totalReopen.toFixed(2) }} €</td>
              <td class="pe-4 py-3 text-end font-monospace text-dark fs-4 text-decoration-underline">{{ totalGlobal.toFixed(2) }} €</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="details-modal-overlay" @click.self="closeModal">
      <div class="details-modal-container">
        <div class="details-modal-header bg-dark text-white d-flex justify-content-between align-items-center p-3">
          <div>
            <h4 class="m-0 fw-bold">{{ selectedCategory?.displayName }}</h4>
            <small class="text-light-50 font-monospace">Analyse détaillée par ticket</small>
          </div>
          <button @click="closeModal" class="btn-close-custom">&times;</button>
        </div>

        <div class="details-modal-body p-4">
          <div v-if="modalLoading" class="text-center my-4 py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2 small fw-semibold">Calcul en cours...</p>
          </div>

          <div v-else class="table-responsive border rounded bg-white max-modal-table-height">
            <table class="table table-sm table-hover align-middle m-0">
              <thead class="table-light sticky-top-thead">
                <tr>
                  <th class="ps-3 py-2 text-secondary small fw-bold">Ticket</th>
                  <th class="py-2 text-secondary small fw-bold">Sujet</th>
                  <th class="py-2 text-secondary small text-center fw-bold">ID Matériel</th>
                  <th class="py-2 text-secondary small text-end fw-bold">Part GLPI</th>
                  <th class="py-2 text-secondary small text-end text-success fw-bold">Part SQLite</th>
                  <th class="py-2 text-secondary small text-end text-danger fw-bold">Part Réouverture</th>
                  <th class="pe-3 py-2 text-dark text-end fw-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in modalDetails" :key="idx">
                  <td class="ps-3 font-monospace fw-bold text-secondary">#{{ row.ticketId }}</td>
                  <td class="truncate-text text-dark" :title="row.ticketName">{{ row.ticketName }}</td>
                  <td class="text-center"><span class="badge bg-light text-dark border">ID: {{ row.itemId }}</span></td>
                  <td class="text-end font-monospace text-muted">{{ row.glpiCost.toFixed(2) }} €</td>
                  <td class="text-end font-monospace text-success">{{ row.sqliteCost.toFixed(2) }} €</td>
                  <td class="text-end font-monospace text-danger">{{ row.reopenCost.toFixed(2) }} €</td>
                  <td class="pe-3 text-end font-monospace fw-bold text-dark">{{ row.totalCost.toFixed(2) }} €</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="details-modal-footer bg-light p-3 border-top d-flex justify-content-end">
          <button @click="closeModal" class="btn btn-secondary btn-sm px-4 fw-bold">Fermer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAssetStats } from '@/composables/locales/useAssetStats';
import api from '@/services/api'; 
import axios from 'axios'; 
import { dashboardService } from '@/services/dashboardService';

const { categoriesReport, loading, errorMsg, refreshStats } = useAssetStats();

const showModal = ref(false);
const modalLoading = ref(false);
const selectedCategory = ref(null);
const modalDetails = ref([]);

const openDetailsModal = async (category) => {
  selectedCategory.value = category;
  showModal.value = true;
  modalLoading.value = true;
  modalDetails.value = [];

  try {
    const localRes = await axios.get('http://localhost:3005/api/kanban/costs/all');
    const localCosts = localRes.data || [];
    
    // FILTRAGE ROBUSTE : On utilise toLowerCase pour éviter les erreurs de casse
    const getCosts = (ticketId) => {
      const costs = localCosts.filter(c => String(c.ticket_id) === String(ticketId));
      return {
        regular: costs.filter(c => !(c.label || '').toLowerCase().includes('réouverture'))
                      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0),
        reopen: costs.filter(c => (c.label || '').toLowerCase().includes('réouverture'))
                     .reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
      };
    };

    const allTickets = await dashboardService.getTicketsList();
    const rows = [];

    for (const ticket of allTickets) {
      const assetsRes = await api.get(`/Ticket/${ticket.id}/Item_Ticket`);
      const links = Array.isArray(assetsRes.data) ? assetsRes.data : [];
      const matchingLinks = links.filter(link => link.itemtype === category.itemType);
      if (matchingLinks.length === 0) continue;

      const costsRes = await api.get(`/Ticket/${ticket.id}/TicketCost`);
      const glpiCostsList = Array.isArray(costsRes.data) ? costsRes.data : [];
      
      const ticketGlpiTotal = glpiCostsList.reduce((sum, c) => 
        sum + (Number(c.cost_fixed) || 0) + (Number(c.cost_material) || 0) + (((Number(c.actiontime) || 0) * (Number(c.cost_time) || 0)) / 3600), 0
      );
      
      const ticketData = getCosts(ticket.id);
      const itemCount = links.length || 1;

      const glpiShare = ticketGlpiTotal / itemCount;
      const sqliteShare = ticketData.regular / itemCount;
      const reopenShare = ticketData.reopen / itemCount;

      for (const link of matchingLinks) {
        rows.push({
          ticketId: ticket.id,
          ticketName: ticket.name || 'Sans titre',
          itemId: link.items_id,
          glpiCost: glpiShare,
          sqliteCost: sqliteShare,
          reopenCost: reopenShare,
          totalCost: glpiShare + sqliteShare + reopenShare
        });
      }
    }
    modalDetails.value = rows.sort((a, b) => b.totalCost - a.totalCost);
  } catch (error) {
    console.error("❌ Erreur détail modal :", error);
  } finally {
    modalLoading.value = false;
  }
};

const closeModal = () => { showModal.value = false; };

const totalGlpi = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.glpiCost || 0), 0));
const totalSqlite = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.sqliteCost || 0), 0));
const totalReopen = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.reopenCost || 0), 0));
const totalGlobal = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.totalCost || 0), 0));
</script>

<style scoped>
.italic { font-style: italic; }
.font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, monospace !important; }
.text-light-50 { color: rgba(255, 255, 255, 0.6) !important; }
.small-badge-container { display: flex; gap: 4px; }
.badge { font-size: 0.72rem; padding: 3px 6px; font-weight: 500; }
.table-hover tbody tr:hover { background-color: #f8fafc; }
thead th { font-size: 0.78rem !important; letter-spacing: 0.03em; }
tfoot tr td { background-color: #f1f5f9 !important; font-weight: 700 !important; }

.details-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(15, 23, 42, 0.45); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 1060;
}
.details-modal-container {
  background: white; border-radius: 12px; width: 92%; max-width: 900px;
  max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
.details-modal-body { overflow-y: auto; flex: 1; }
.max-modal-table-height { max-height: 380px; overflow-y: auto; }
.sticky-top-thead th { position: sticky; top: 0; z-index: 5; background-color: #f8fafc !important; }
.btn-close-custom { background: none; border: none; color: white; font-size: 1.8rem; cursor: pointer; }
.truncate-text { max-width: 260px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>