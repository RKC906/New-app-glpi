<template>
  <div class="container py-4">

    <div class="card shadow-sm border-0 mb-4 bg-dark text-white p-4 rounded-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 class="fw-bold m-0">Rentabilité & Coûts par Catégories</h2>\n        </div>
          <button class="btn btn-outline-light btn-sm px-3" @click="refreshStats" :disabled="loading">\n            🔄 {{ loading ? 'Recalcul...' : 'Actualiser' }}\n          </button>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5 py-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;"></div>
      <p class="text-muted mt-3">Calcul et ventilation de la balance financière des parcs...</p>
    </div>

    <div v-else-if=\"errorMsg\" class="alert alert-danger shadow-sm border-0">
      ⚠️ {{ errorMsg }}
    </div>

    <div v-else class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle m-0">
          <thead class="table-light border-bottom">
            <tr>
              <th class="ps-4 py-3 text-secondary small text-uppercase">Catégorie de Matériel</th>
              <th class="py-3 text-secondary small text-uppercase text-end">Coût GLPI (€)</th>
              <th class="py-3 text-secondary small text-uppercase text-end">Coût Maintenance (€)</th>

              <th class="py-3 text-secondary small text-uppercase text-end" style="color: #d97706;">Coût Réouverture (€)</th>

              <th class="pe-4 py-3 text-secondary small text-uppercase text-end">Total Général (€)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categoriesReport.length === 0">
              <td colspan="5" class="text-center py-4 text-muted italic">
                Aucun coût enregistré pour le moment.
              </td>
            </tr>
            <tr v-for="cat in categoriesReport" :key="cat.itemType">
              <td class="ps-4 py-3">
                <div class="fw-bold text-dark fs-6">{{ cat.displayName }}</div>
              </td>

              <td class="py-3 text-end text-muted font-monospace">{{ cat.glpiCost.toFixed(2) }} €</td>
              <td class="py-3 text-end text-success fw-semibold font-monospace">{{ cat.sqliteCost.toFixed(2) }} €</td>

              <td class="py-3 text-end fw-semibold font-monospace" style="color: #d97706;">
                {{ (cat.reopenCost || 0).toFixed(2) }} €
              </td>

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
