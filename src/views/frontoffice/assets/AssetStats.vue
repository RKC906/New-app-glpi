<template>
  <div class="container py-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-dark text-white p-4 rounded-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 class="fw-bold m-0">Rentabilité & Coûts par Catégories</h2>
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
              <th class="ps-4 py-3 text-secondary small text-uppercase">Catégorie de Matériel</th>
              <th class="py-3 text-secondary small text-uppercase text-center">Matériels Touchés</th>
              <th class="py-3 text-secondary small text-uppercase text-center">Volume Tickets</th>
              <th class="py-3 text-secondary small text-uppercase text-end">Total GLPI</th>
              <th class="py-3 text-secondary small text-uppercase text-end text-success">Total Kanban (SQLite)</th>
              <th class="pe-4 py-3 text-dark fw-bold small text-uppercase text-end">Dépense Cumulée</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categoriesReport.length === 0">
              <td colspan="6" class="text-center py-5 text-muted italic">
                ℹ️ Aucune donnée financière n'a pu être collectée. Renseignez des coûts ou liez des matériels.
              </td>
            </tr>
            <tr v-for="cat in categoriesReport" :key="cat.itemType">
              <td class="ps-4 py-3">
                <div class="fw-bold text-dark fs-6">{{ cat.displayName }}</div>
              </td>
              
              <td class="py-3 text-center">
                <span class="badge bg-light text-dark border px-2.5 py-1">
                  {{ cat.uniqueItemsCount }} {{ cat.uniqueItemsCount > 1 ? 'appareils' : 'appareil' }}
                </span>
              </td>

              <td class="py-3 text-center">
                <span class="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill px-2.5">
                  {{ cat.ticketsCount }} {{ cat.ticketsCount > 1 ? 'tickets' : 'ticket' }}
                </span>
              </td>

              <td class="py-3 text-end text-muted font-monospace">{{ cat.glpiCost.toFixed(2) }} €</td>
              <td class="py-3 text-end text-success fw-semibold font-monospace">{{ cat.sqliteCost.toFixed(2) }} €</td>
              
              <td class="pe-4 py-3 text-end fw-bold text-dark font-monospace fs-5">
                {{ cat.totalCost.toFixed(2) }} €
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { useAssetStats } from '@/composables/locales/useAssetStats';

const { categoriesReport, loading, errorMsg, refreshStats } = useAssetStats();
</script>

<style scoped>
.italic { font-style: italic; }
.font-monospace { font-family: monospace; }
</style>