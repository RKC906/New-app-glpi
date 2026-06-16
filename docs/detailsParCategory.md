Étape 1 : Modifier le Composable useAssetStats.js

Pour afficher des détails, il faut d'abord que votre composable collecte et conserve la liste des tickets individuels pour chaque catégorie, au lieu de simplement faire la somme brute.

Dans votre fichier src/composables/locales/useAssetStats.js, modifiez la logique de boucle pour y ajouter un tableau ticketsDetails :
JavaScript

// ... Dans la boucle de traitement de buildReport() ...

// Au moment de l'initialisation ou de l'accumulation dans tempMap :
if (tempMap.has(type)) {
  const cat = tempMap.get(type);
  cat.glpiCost += glpiShare;
  cat.sqliteCost += sqliteShare;
  cat.reopenCost += reopenShare; // si vous suivez aussi les réouvertures
  cat.ticketsCount += 1;
  cat.distinctItems.add(link.items_id);
  
  // ➕ AJOUT : On stocke le détail du ticket courant
  cat.ticketsDetails.push({
    ticketId: ticket.id,
    name: ticket.name,
    glpiShare: glpiShare,
    sqliteCost: sqliteShare,
    reopenCost: reopenShare,
    totalShare: glpiShare + sqliteShare + reopenShare
  });
} else {
  tempMap.set(type, {
    glpiCost: glpiShare,
    sqliteCost: sqliteShare,
    reopenCost: reopenShare,
    ticketsCount: 1,
    distinctItems: new Set([link.items_id]),
    // ➕ AJOUT : Initialisation du tableau de détails
    ticketsDetails: [{
      ticketId: ticket.id,
      name: ticket.name,
      glpiShare: glpiShare,
      sqliteCost: sqliteShare,
      reopenCost: reopenShare,
      totalShare: glpiShare + sqliteShare + reopenShare
    }]
  });
}

// ... Puis dans le formatage final (.map) retourné au Front ...
return {
  itemType: type,
  displayName: typeMapping[type] || `📦 ${type} (Autre)`,
  glpiCost: data.glpiCost,
  sqliteCost: data.sqliteCost,
  reopenCost: data.reopenCost,
  totalCost: data.glpiCost + data.sqliteCost + data.reopenCost,
  ticketsCount: data.ticketsCount,
  uniqueItemsCount: data.distinctItems.size,
  // ➕ TRANSMISSION AU FRONT :
  ticketsDetails: data.ticketsDetails 
};


Étape 2 : Mettre à jour AssetStats.vue (Complet)

Voici le code complet modifié de votre page de statistiques. J'ai ajouté :

    Une variable réactive expandedCategory pour savoir quelle ligne est cliquée.

    Un bouton de bascule 📂 / 📂 à côté du nom de la catégorie.

    Une ligne <tr> conditionnelle contenant un sous-tableau Bootstrap (table-sm bg-light) qui liste le détail de chaque ticket lié à la catégorie.

HTML

<template>
  <div class="container py-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-dark text-white p-4 rounded-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 class="fw-bold m-0">Rentabilité & Coûts par Catégories</h2>
          <p class="text-muted m-0 mt-1 small text-light-50">Analyse croisée des indicateurs financiers GLPI et des surcoûts locaux SQLite</p>
        </div>
        <button class="btn btn-outline-light btn-sm px-3" @click="refreshStats" :disabled="loading">
          🔄 {{ loading ? 'Recalcul en cours...' : 'Actualiser' }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5 py-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
      <p class="text-muted mt-3 fw-semibold">Calcul et ventilation de la balance financière des parcs...</p>
    </div>

    <div v-else-if="errorMsg" class="alert alert-danger shadow-sm border-0 d-flex align-items-center" role="alert">
      <span class="fs-4 me-2">⚠️</span>
      <div>{{ errorMsg }}</div>
    </div>

    <div v-else class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table align-middle m-0">
          <thead class="table-light border-bottom">
            <tr>
              <th class="ps-4 py-3 text-secondary small text-uppercase fw-bold">Catégorie de Matériel</th>
              <th class="py-3 text-secondary small text-uppercase text-end fw-bold">Coût GLPI</th>
              <th class="py-3 text-secondary small text-uppercase text-end text-success fw-bold">Super Cost (SQLite)</th>
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
            
            <template v-for="cat in categoriesReport" :key="cat.itemType">
              <tr 
                @click="toggleCategory(cat.itemType)" 
                class="main-row" 
                :class="{ 'is-expanded': expandedCategory === cat.itemType }"
                style="cursor: pointer;"
              >
                <td class="ps-4 py-3">
                  <div class="d-flex align-items-center gap-2">
                    <span class="toggle-icon">{{ expandedCategory === cat.itemType ? '📂' : '📁' }}</span>
                    <div>
                      <div class="fw-bold text-dark fs-6">{{ cat.displayName }}</div>
                      <div class="text-muted small-badge-container mt-1">
                        <span class="badge bg-light text-dark border me-1">{{ cat.uniqueItemsCount }} appareil(s)</span>
                        <span class="badge bg-primary-subtle text-primary border border-primary-subtle">{{ cat.ticketsCount }} ticket(s)</span>
                      </div>
                    </div>
                  </div>
                </td>

                <td class="py-3 text-end text-muted font-monospace">
                  {{ cat.glpiCost.toFixed(2) }} €
                </td>
                
                <td class="py-3 text-end text-success fw-semibold font-monospace">
                  {{ cat.sqliteCost.toFixed(2) }} €
                </td>

                <td class="py-3 text-end text-danger fw-semibold font-monospace">
                  {{ cat.reopenCost.toFixed(2) }} €
                </td>
                
                <td class="pe-4 py-3 text-end fw-bold text-dark font-monospace fs-5">
                  {{ cat.totalCost.toFixed(2) }} €
                </td>
              </tr>

              <tr v-if="expandedCategory === cat.itemType">
                <td colspan="5" class="bg-light p-0 border-start border-primary border-4">
                  <div class="p-3 shadow-inner">
                    <h6 class="fw-bold text-primary mb-3 text-uppercase small">
                      🔍 Justificatif des Coûts : {{ cat.displayName }}
                    </h6>
                    
                    <div class="table-responsive rounded border bg-white">
                      <table class="table table-sm table-striped m-0 align-middle" style="font-size: 0.88rem;">
                        <thead class="table-secondary text-secondary">
                          <tr>
                            <th class="ps-3 py-2">Ticket</th>
                            <th class="py-2 text-end">Part GLPI</th>
                            <th class="py-2 text-end text-success">Part SQLite</th>
                            <th class="py-2 text-end text-danger">Part Réouverture</th>
                            <th class="pe-3 py-2 text-end fw-bold">Total Prorata</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="ticket in cat.ticketsDetails" :key="ticket.ticketId">
                            <td class="ps-3 py-2">
                              <span class="badge bg-secondary me-2">#{{ ticket.ticketId }}</span>
                              <span class="fw-semibold text-dark">{{ ticket.name }}</span>
                            </td>
                            <td class="py-2 text-end text-muted font-monospace">
                              {{ ticket.glpiShare.toFixed(2) }} €
                            </td>
                            <td class="py-2 text-end text-success font-monospace">
                              {{ ticket.sqliteCost.toFixed(2) }} €
                            </td>
                            <td class="py-2 text-end text-danger font-monospace">
                              {{ (ticket.reopenCost || 0).toFixed(2) }} €
                            </td>
                            <td class="pe-3 py-2 text-end fw-bold font-monospace">
                              {{ (ticket.totalShare || (ticket.glpiShare + ticket.sqliteCost)).toFixed(2) }} €
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                  </div>
                </td>
              </tr>
            </template>
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

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useAssetStats } from '@/composables/locales/useAssetStats';

const { categoriesReport, loading, errorMsg, refreshStats } = useAssetStats();

// 📂 Gestion de la ligne dépliée (contient l'itemType courant ou null)
const expandedCategory = ref(null);

const toggleCategory = (itemType) => {
  if (expandedCategory.value === itemType) {
    expandedCategory.value = null; // Referme si on ré-appuie dessus
  } else {
    expandedCategory.value = itemType; // Ouvre la ligne cliquée
  }
};

// Calculs des totaux globaux
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

/* Effet visuel lors du survol et de la sélection de la ligne */
.main-row:hover {
  background-color: #f8fafc;
}
.main-row.is-expanded {
  background-color: #f1f5f9;
}

.toggle-icon {
  font-size: 1.2rem;
  transition: transform 0.2s;
}

thead th {
  font-size: 0.78rem !important;
  letter-spacing: 0.03em;
}

tfoot tr td {
  background-color: #f1f5f9 !important;
  font-weight: 700 !important;
}

.shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
}
</style>