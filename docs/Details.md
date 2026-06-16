1. Le fichier à créer : AssetStatsDetails.vue
HTML

<template>
  <div class="container py-4">
    
    <div class="card shadow-sm border-0 mb-4 bg-dark text-white p-4 rounded-3">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <span class="badge bg-primary mb-2 text-uppercase tracking-wider">Vue Détaillée</span>
          <h2 class="fw-bold m-0">{{ categoryName }}</h2>
          <p class="text-muted m-0 mt-1 small text-light-50">Liste des interventions et répartition des lignes de coûts</p>
        </div>
        <button class="btn btn-outline-light btn-sm px-3" @click="goBack">
          ⬅️ Retour au rapport global
        </button>
      </div>
    </div>

    <div v-if="!loading && !errorMsg" class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 bg-body">
          <div class="text-secondary small text-uppercase fw-bold">Total GLPI</div>
          <div class="fs-4 fw-bold font-monospace mt-1 text-secondary">{{ summary.glpi.toFixed(2) }} €</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 bg-body">
          <div class="text-secondary small text-uppercase fw-bold text-success">Total Super Cost (SQLite)</div>
          <div class="fs-4 fw-bold font-monospace mt-1 text-success">{{ summary.sqlite.toFixed(2) }} €</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 bg-body">
          <div class="text-secondary small text-uppercase fw-bold text-danger">Total Réouverture</div>
          <div class="fs-4 fw-bold font-monospace mt-1 text-danger">{{ summary.reopen.toFixed(2) }} €</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm p-3 bg-dark text-white">
          <div class="text-light-50 small text-uppercase fw-bold">Coût Global Cumulé</div>
          <div class="fs-4 fw-bold font-monospace mt-1 text-warning">{{ summary.total.toFixed(2) }} €</div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="text-center my-5 py-5">
      <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status"></div>
      <p class="text-muted mt-3 fw-semibold">Extraction des lignes budgétaires détaillées...</p>
    </div>

    <div v-else-if="errorMsg" class="alert alert-danger shadow-sm border-0 d-flex align-items-center" role="alert">
      <span class="fs-4 me-2">⚠️</span>
      <div>{{ errorMsg }}</div>
    </div>

    <div v-else class="card shadow-sm border-0 overflow-hidden">
      <div class="table-responsive">
        <table class="table table-hover align-middle m-0">
          <thead class="table-light border-bottom">
            <tr>
              <th class="ps-4 py-3 text-secondary small text-uppercase fw-bold" style="width: 12%;">Ticket</th>
              <th class="py-3 text-secondary small text-uppercase fw-bold" style="width: 38%;">Sujet de l'intervention</th>
              <th class="py-3 text-secondary small text-uppercase text-center fw-bold" style="width: 12%;">ID Matériel</th>
              <th class="py-3 text-secondary small text-uppercase text-end fw-bold">Part GLPI</th>
              <th class="py-3 text-secondary small text-uppercase text-end text-success fw-bold">Part SQLite</th>
              <th class="py-3 text-secondary small text-uppercase text-end text-danger fw-bold">Part Réouverture</th>
              <th class="pe-4 py-3 text-dark fw-bold small text-uppercase text-end fw-bold">Sous-Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="ticketDetails.length === 0">
              <td colspan="7" class="text-center py-5 text-muted italic">
                ℹ️ Aucun ticket individuel n'est rattaché à cette catégorie.
              </td>
            </tr>
            
            <tr v-for="(row, idx) in ticketDetails" :key="idx">
              <td class="ps-4 py-3 font-monospace fw-bold text-secondary">
                #{{ row.ticketId }}
              </td>
              <td class="py-3 text-dark truncate-text" :title="row.ticketName">
                {{ row.ticketName }}
              </td>
              <td class="py-3 text-center">
                <span class="badge bg-light text-dark border font-monospace">ID: {{ row.itemId }}</span>
              </td>
              <td class="py-3 text-end text-muted font-monospace">
                {{ row.glpiCost.toFixed(2) }} €
              </td>
              <td class="py-3 text-end text-success font-monospace">
                {{ row.sqliteCost.toFixed(2) }} €
              </td>
              <td class="py-3 text-end text-danger font-monospace">
                {{ row.reopenCost.toFixed(2) }} €
              </td>
              <td class="pe-4 py-3 text-end fw-bold text-dark font-monospace">
                {{ row.totalCost.toFixed(2) }} €
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api'; 
import axios from 'axios'; 
import { dashboardService } from '@/services/dashboardService';

// Déclaration des Props au cas où vous l'utilisez hors-navigation (modale ou composant dynamique)
const props = defineProps({
  itemType: {
    type: String,
    default: null
  }
});

const route = useRoute();
const router = useRouter();

// États locaux réactifs
const ticketDetails = ref([]);
const loading = ref(true);
const errorMsg = ref(null);

// Déterminer le type sélectionné (depuis les Props ou l'URL du Router)
const selectedType = computed(() => {
  return props.itemType || route.params.type || '';
});

// Mapping linguistique identique à votre fichier de configuration global
const typeMapping = {
  Computer: '💻 Ordinateurs',
  Printer: '🖨️ Imprimantes',
  Monitor: '🖥️ Écrans / Moniteurs',
  NetworkEquipment: '🌐 Équipements Réseau',
  Peripheral: '🖱️ Périphériques (Souris, Claviers...)',
  Software: '💿 Logiciels / Licences',
  Phone: '📞 Téléphonie'
};

const categoryName = computed(() => {
  return typeMapping[selectedType.value] || `📦 ${selectedType.value} (Autre)`;
});

// Calcule le résumé financier global de la catégorie actuelle
const summary = computed(() => {
  return ticketDetails.value.reduce((acc, current) => {
    acc.glpi += current.glpiCost;
    acc.sqlite += current.sqliteCost;
    acc.reopen += current.reopenCost;
    acc.total += current.totalCost;
    return acc;
  }, { glpi: 0, sqlite: 0, reopen: 0, total: 0 });
});

// Extraction et isolation des tickets de la catégorie cible
const fetchDetailedReport = async () => {
  if (!selectedType.value) {
    errorMsg.value = "Aucun type de matériel spécifié.";
    loading.value = false;
    return;
  }

  loading.value = true;
  errorMsg.value = null;
  const rows = [];

  try {
    // 1. Charger l'historique complet SQLite local
    const localRes = await axios.get('http://localhost:3005/api/kanban/costs/all');
    const localCosts = localRes.data || [];
    const localCostsMap = new Map(
      localCosts.map(c => [String(c.ticket_id), Number(c.amount) || 0])
    );

    // 2. Récupérer la liste brute des tickets GLPI
    const allTickets = await dashboardService.getTicketsList();

    // 3. Analyse approfondie filtrée par catégorie
    for (const ticket of allTickets) {
      
      // Extraction des liaisons d'appareils de ce ticket
      const assetsRes = await api.get(`/Ticket/${ticket.id}/Item_Ticket`);
      const links = Array.isArray(assetsRes.data) ? assetsRes.data : [];
      
      // Filtrer immédiatement les liaisons correspondantes au type sélectionné
      const matchingLinks = links.filter(link => link.itemtype === selectedType.value);
      if (matchingLinks.length === 0) continue; // Si le ticket ne touche pas à cette catégorie, on l'ignore

      // Récupérer l'historique financier natif GLPI
      const costsRes = await api.get(`/Ticket/${ticket.id}/TicketCost`);
      const glpiCostsList = Array.isArray(costsRes.data) ? costsRes.data : [];
      
      // Calcul du montant total GLPI du ticket
      const ticketGlpiTotal = glpiCostsList.reduce((sum, c) => {
        const fixed = Number(c.cost_fixed) || 0;
        const material = Number(c.cost_material) || 0;
        const timeCost = ((Number(c.actiontime) || 0) * (Number(c.cost_time) || 0)) / 3600;
        return sum + fixed + material + timeCost;
      }, 0);

      // Calcul des surcoûts locaux SQLite et du taux de réouverture
      const ticketSqliteTotal = localCostsMap.get(String(ticket.id)) || 0;
      const reopenCount = Number(ticket.reopen_number) || 0; 
      const ticketReopenTotal = reopenCount > 0 ? (ticketGlpiTotal * 0.20) * reopenCount : 0;

      // Division par le nombre total d'équipements reliés au ticket (Règle du prorata)
      const totalLinkedItemsCount = links.length;
      const glpiShare = ticketGlpiTotal / totalLinkedItemsCount;
      const sqliteShare = ticketSqliteTotal / totalLinkedItemsCount;
      const reopenShare = ticketReopenTotal / totalLinkedItemsCount;

      // Ajouter une ligne pour chaque matériel de cette catégorie touché par ce ticket
      for (const link of matchingLinks) {
        rows.push({
          ticketId: ticket.id,
          ticketName: ticket.name || 'Sans titre / Objet non renseigné',
          itemId: link.items_id,
          glpiCost: glpiShare,
          sqliteCost: sqliteShare,
          reopenCost: reopenShare,
          totalCost: glpiShare + sqliteShare + reopenShare
        });
      }
    }

    // Tri du rapport du sous-coût le plus élevé au plus faible
    ticketDetails.value = rows.sort((a, b) => b.totalCost - a.totalCost);

  } catch (error) {
    console.error("❌ Erreur lors du calcul détaillé :", error);
    errorMsg.value = "Impossible de charger le détail financier pour cette catégorie.";
  } finally {
    loading.value = false;
  }
};

const goBack = () => {
  router.push({ name: 'AssetStats' }); // Ajustez le nom de la route selon votre router index.js
};

onMounted(() => {
  fetchDetailedReport();
});
</script>

<style scoped>
.italic { font-style: italic; }
.font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
.text-light-50 { color: rgba(255, 255, 255, 0.6) !important; }
.badge { font-size: 0.72rem; padding: 4px 8px; font-weight: 500; }
.tracking-wider { letter-spacing: 0.05em; }

thead th {
  font-size: 0.78rem !important;
  letter-spacing: 0.03em;
  background-color: #f8fafc !important;
}

.truncate-text {
  max-width: 320px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

2. Comment l'activer sur AssetStats.vue ?

Pour déclencher l'ouverture de cette page au clic sur une ligne de votre tableau principal, effectuez ces deux modifications simples dans votre fichier AssetStats.vue actuel :
Étape A : Rendre la ligne cliquable graphiquement

Sur la balise <tr> du corps du tableau (<tbody>), ajoutez la directive @click et appliquez un style de curseur :
HTML

<tr 
  v-for="cat in categoriesReport" 
  :key="cat.itemType" 
  @click="goToDetails(cat.itemType)"
  style="cursor: pointer;"
  title="Cliquez pour voir le détail des interventions"
>

Étape B : Ajouter la fonction de redirection dans le <script setup>

Importez le routeur de Vue et écrivez la méthode goToDetails :
JavaScript

// Dans le <script setup> de votre AssetStats.vue
import { useRouter } from 'vue-router';

const router = useRouter();

const goToDetails = (type) => {
  router.push({ name: 'AssetStatsDetails', params: { type } });
};

(N'oubliez pas d'ajouter la route correspondante { path: '/stats/details/:type', name: 'AssetStatsDetails', component: AssetStatsDetails } dans votre fichier de configuration des routes index.js ou router.js).


Modals : 


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
              <th class="py-3 text-secondary small text-uppercase text-end text-success fw-bold">Super Cost (SQLite)</th>
              <th class="py-3 text-secondary small text-uppercase text-end text-danger fw-bold">Coût Réouverture</th>
              <th class="pe-4 py-3 text-dark fw-bold small text-uppercase text-end fw-bold">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="categoriesReport.length === 0">
              <td colspan="5" class="text-center py-5 text-muted italic">
                ℹ️ Aucune donnée financière n'a pu être collectée. Renseignez des coûts ou liez des matériels aux tickets.
              </td>
            </tr>
            
            <tr 
              v-for="cat in categoriesReport" 
              :key="cat.itemType"
              @click="openDetailsModal(cat)"
              style="cursor: pointer;"
              title="Cliquez pour voir le détail détaillé de cette catégorie"
            >
              <td class="ps-4 py-3">
                <div class="fw-bold text-dark fs-6">{{ cat.displayName }}</div>
                <div class="text-muted small-badge-container mt-1">
                  <span class="badge bg-light text-dark border me-1">{{ cat.uniqueItemsCount }} appareil(s)</span>
                  <span class="badge bg-primary-subtle text-primary border border-primary-subtle">{{ cat.ticketsCount }} ticket(s)</span>
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
            <small class="text-light-50 font-monospace">Analyse détaillée des affectations</small>
          </div>
          <button @click="closeModal" class="btn-close-custom">&times;</button>
        </div>

        <div class="details-modal-body p-4">
          
          <div v-if="modalLoading" class="text-center my-4 py-4">
            <div class="spinner-border text-primary" role="status"></div>
            <p class="text-muted mt-2 small fw-semibold">Calcul des parts au prorata pour chaque matériel...</p>
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
                <tr v-if="modalDetails.length === 0">
                  <td colspan="7" class="text-center py-4 text-muted italic">Aucun détail disponible.</td>
                </tr>
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

          <div v-if="!modalLoading && selectedCategory" class="row g-2 mt-3 text-center">
            <div class="col border-end">
              <div class="text-muted small">GLPI</div>
              <strong class="font-monospace">{{ selectedCategory.glpiCost.toFixed(2) }} €</strong>
            </div>
            <div class="col border-end text-success">
              <div class="small">SQLite</div>
              <strong class="font-monospace">{{ selectedCategory.sqliteCost.toFixed(2) }} €</strong>
            </div>
            <div class="col border-end text-danger">
              <div class="small">Réouverture</div>
              <strong class="font-monospace">{{ selectedCategory.reopenCost.toFixed(2) }} €</strong>
            </div>
            <div class="col bg-light rounded py-1">
              <div class="text-dark small fw-bold">Total Cumulé</div>
              <strong class="font-monospace fs-5 text-dark">{{ selectedCategory.totalCost.toFixed(2) }} €</strong>
            </div>
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
import api from '@/services/api'; // Axios GLPI
import axios from 'axios'; // Axios Express local
import { dashboardService } from '@/services/dashboardService';

// Récupération de l'état réactif global depuis votre composable existant
const { categoriesReport, loading, errorMsg, refreshStats } = useAssetStats();

// 1. États réactifs dédiés à la fenêtre modale
const showModal = ref(false);
const modalLoading = ref(false);
const selectedCategory = ref(null);
const modalDetails = ref([]);

// 2. Fonction d'interception et de traitement lors du clic
const openDetailsModal = async (category) => {
  selectedCategory.value = category;
  showModal.value = true;
  modalLoading.value = true;
  modalDetails.value = [];

  try {
    // A. Récupérer les coûts locaux SQLite
    const localRes = await axios.get('http://localhost:3005/api/kanban/costs/all');
    const localCosts = localRes.data || [];
    const localCostsMap = new Map(localCosts.map(c => [String(c.ticket_id), Number(c.amount) || 0]));

    // B. Récupérer les tickets GLPI
    const allTickets = await dashboardService.getTicketsList();
    const rows = [];

    // C. Re-parcourir et filtrer uniquement pour la catégorie sur laquelle on a cliqué
    for (const ticket of allTickets) {
      const assetsRes = await api.get(`/Ticket/${ticket.id}/Item_Ticket`);
      const links = Array.isArray(assetsRes.data) ? assetsRes.data : [];
      
      // Filtre exclusif sur la catégorie sélectionnée
      const matchingLinks = links.filter(link => link.itemtype === category.itemType);
      if (matchingLinks.length === 0) continue;

      const costsRes = await api.get(`/Ticket/${ticket.id}/TicketCost`);
      const glpiCostsList = Array.isArray(costsRes.data) ? costsRes.data : [];
      
      const ticketGlpiTotal = glpiCostsList.reduce((sum, c) => {
        const fixed = Number(c.cost_fixed) || 0;
        const material = Number(c.cost_material) || 0;
        const timeCost = ((Number(c.actiontime) || 0) * (Number(c.cost_time) || 0)) / 3600;
        return sum + fixed + material + timeCost;
      }, 0);

      const ticketSqliteTotal = localCostsMap.get(String(ticket.id)) || 0;
      const reopenCount = Number(ticket.reopen_number) || 0; 
      const ticketReopenTotal = reopenCount > 0 ? (ticketGlpiTotal * 0.20) * reopenCount : 0;

      const totalLinkedItemsCount = links.length;
      const glpiShare = ticketGlpiTotal / totalLinkedItemsCount;
      const sqliteShare = ticketSqliteTotal / totalLinkedItemsCount;
      const reopenShare = ticketReopenTotal / totalLinkedItemsCount;

      // Ajouter une entrée pour chaque matériel concerné
      for (const link of matchingLinks) {
        rows.push({
          ticketId: ticket.id,
          ticketName: ticket.name || 'Sans titre / non renseigné',
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
    console.error("❌ Erreur lors du chargement des détails de la modal :", error);
  } finally {
    modalLoading.value = false;
  }
};

const closeModal = () => {
  showModal.value = false;
  selectedCategory.value = null;
  modalDetails.value = [];
};

// 🔢 Calculs dynamiques des totaux pour le pied de page général
const totalGlpi = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.glpiCost || 0), 0));
const totalSqlite = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.sqliteCost || 0), 0));
const totalReopen = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.reopenCost || 0), 0));
const totalGlobal = computed(() => categoriesReport.value.reduce((sum, cat) => sum + (cat.totalCost || 0), 0));
</script>

<style scoped>
.italic { font-style: italic; }
.font-monospace { font-family: SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace !important; }
.text-light-50 { color: rgba(255, 255, 255, 0.6) !important; }
.small-badge-container { display: flex; gap: 4px; }
.badge { font-size: 0.72rem; padding: 3px 6px; font-weight: 500; }

.table-hover tbody tr:hover {
  background-color: #f8fafc;
}

thead th {
  font-size: 0.78rem !important;
  letter-spacing: 0.03em;
}

tfoot tr td {
  background-color: #f1f5f9 !important;
  font-weight: 700 !important;
}

/* 🎨 STYLE GRAPHIQUE DE LA MODAL INLINE */
.details-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background-color: rgba(15, 23, 42, 0.55); backdrop-filter: blur(4px);
  display: flex; justify-content: center; align-items: center; z-index: 1060;
}

.details-modal-container {
  background: white; border-radius: 12px; width: 92%; max-width: 850px;
  max-height: 85vh; display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: modalScaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.details-modal-body {
  overflow-y: auto; flex: 1;
}

.max-modal-table-height {
  max-height: 400px; overflow-y: auto;
}

.sticky-top-thead th {
  position: sticky; top: 0; z-index: 5; background-color: #f8fafc !important;
  box-shadow: inset 0 -1px 0 #e2e8f0;
}

.btn-close-custom {
  background: none; border: none; color: white; font-size: 1.8rem;
  line-height: 1; cursor: pointer; transition: opacity 0.2s; opacity: 0.7;
}
.btn-close-custom:hover { opacity: 1; }

.truncate-text {
  max-width: 240px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

@keyframes modalScaleUp {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>