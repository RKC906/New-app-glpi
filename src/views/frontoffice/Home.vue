<template>
 <div>
 <RouterLink :to="{ name: 'createticket' }">
 <button class="btn-secondary">creer ticket</button>
 </RouterLink><
 </div>
 <div>
 <RouterLink :to="{ name: 'ticketkanban' }">
 <button class="btn-secondary">Voir le kanban</button>
 </RouterLink>
 </div>
 
 <div class="inventory-container">
 <div class="inventory-header">
 <h2> Inventaire Général du Parc Informatique</h2>
 <button @click="loadInventoryData" :disabled="isLoading" class="btn-refresh">
 {{ isLoading ? 'Rechargement...' : ' Actualiser le parc' }}
 </button>
 </div>

 <div class="filters-bar">
 <div class="filter-group text-search">
 <label> Recherche libre</label>
 <input 
 v-model="searchFilters.text" 
 type="text" 
 placeholder="Nom, numéro d'inventaire, utilisateur..."
 />
 </div>

 <div class="filter-group">
 <label> Type d'élément</label>
 <select v-model="searchFilters.itemtype">
 <option value="">-- Tous les types --</option>
 <option value="Computer"> Ordinateurs (Computers)</option>
 <option value="Monitor"> Moniteurs (Monitors)</option>
 <option value="Printer"> Imprimantes (Printers)</option>
 <option value="Peripheral"> Périphériques (Peripherals)</option>
 </select>
 </div>

 <div class="filter-group">
 <label> État / Statut</label>
 <select v-model="searchFilters.stateId">
 <option value="">-- Tous les états --</option>
 <v-for v-for="state in availableStates" :key="state.id" :value="state.id">
 {{ state.name }}
 </v-for>
 </select>
 </div>
 </div>

 <div class="results-counter">
 <strong>{{ filteredAssets.length }}</strong> équipement(s) correspondant à vos critères de recherche.
 </div>

 <div v-if="isLoading" class="loading-state">
 <div class="spinner"></div>
 <p>Synchronisation en direct avec l'API GLPI...</p>
 </div>

 <div v-else-if="filteredAssets.length === 0" class="empty-inventory">
 <h3> Aucun matériel trouvé</h3>
 <p>Modifiez vos filtres ou vérifiez que vos fichiers d'imports ont bien été injectés.</p>
 </div>

 <div v-else class="table-wrapper">
 <table class="inventory-table">
 <thead>
 <tr>
 <th>Type</th>
 <th>Nom de l'équipement</th>
 <th>Numéro d'Inventaire</th>
 <th>Utilisateur / Contact</th>
 <th>État GLPI</th>
 <th>ID GLPI</th>
 </tr>
 </thead>
 <tbody>
 <tr v-for="asset in filteredAssets" :key="asset.itemtype + '-' + asset.id">
 <td class="td-type">
 <span class="type-icon-badge" :title="asset.itemtype">
 {{ getItemIcon(asset.itemtype) }}
 </span>
 </td>
 <td><strong>{{ asset.name || 'Sans nom' }}</strong></td>
 <td class="text-muted">{{ asset.otherserial || '—' }}</td>
 <td>
 <span v-if="asset.contact" class="user-badge"> {{ asset.contact }}</span>
 <span v-else class="text-muted">—</span>
 </td>
 <td>
 <span class="status-badge">
 {{ getStateLabel(asset.states_id) }}
 </span>
 </td>
 <td class="text-id">#{{ asset.id }}</td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useListeMateriel } from '@/composables/useListeMateriel'
import { RouterLink } from 'vue-router'

// Extraction de la configuration déportée du composable
const {
 isLoading,
 searchFilters,
 availableStates,
 filteredAssets,
 loadInventoryData,
 getItemIcon,
 getStateLabel
} = useListeMateriel()

// Chargement automatique du parc à l'affichage de l'écran
onMounted(() => {
 loadInventoryData()
})
</script>

<style scoped>
.inventory-container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; background-color: #f8f9fa; min-height: 100vh; }
.inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.inventory-header h2 { color: #2c3e50; margin: 0; font-size: 1.4rem; }

.btn-refresh { background-color: #2ecc71; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-refresh:hover { background-color: #27ae60; }
.btn-refresh:disabled { background-color: #95a5a6; }

/* STYLISATION BARRE DE RECHERCHE */
.filters-bar { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px; }
.filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; }
.filter-group.text-search { flex: 2; }
.filter-group label { font-size: 0.85rem; font-weight: bold; color: #7f8c8d; text-transform: uppercase; }
.filter-group input, .filter-group select { padding: 10px; border: 1px solid #dcdde1; border-radius: 6px; color: #2f3640; font-size: 0.95rem; background-color: #fbcfff4; outline: none; }
.filter-group input:focus, .filter-group select:focus { border-color: #3498db; }

.results-counter { font-size: 0.9rem; color: #7f8c8d; margin-bottom: 20px; padding-left: 5px; }

/* TABLEAU D'INVENTAIRE */
.table-wrapper { background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden; }
.inventory-table { width: 100%; border-collapse: collapse; text-align: left; }
.inventory-table th { background: #f1f2f6; padding: 15px; color: #7f8c8d; font-size: 0.85rem; text-transform: uppercase; border-bottom: 2px solid #e1b12c05; }
.inventory-table td { padding: 15px; border-bottom: 1px solid #f1f2f6; color: #353b48; font-size: 0.95rem; }
.inventory-table tbody tr:hover { background-color: #f8f9fa; }

.td-type { width: 60px; text-align: center; }
.type-icon-badge { font-size: 1.3rem; background: #f1f2f6; padding: 6px 10px; border-radius: 6px; }
.user-badge { background: #eaf2f8; color: #2980b9; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 500; }
.status-badge { background: #f5f6fa; border: 1px solid #dcdde1; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; color: #718093; }
.text-id { font-family: monospace; color: #95a5a6; font-weight: bold; }
.text-muted { color: #a4b0be; }

/* ÉTATS CHARGEMENT & VIDE */
.loading-state { text-align: center; padding: 5px 0; color: #7f8c8d; }
.empty-inventory { background: white; text-align: center; padding: 50px; border-radius: 8px; color: #7f8c8d; }
</style>