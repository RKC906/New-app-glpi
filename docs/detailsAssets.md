<template>
  <div class="navigation-links">
    <RouterLink :to="{ name: 'createticket' }">
        <button class="btn-secondary">Créer ticket</button>
    </RouterLink>
    <RouterLink :to="{ name: 'ticketkanban' }">
        <button class="btn-secondary">Voir le kanban</button>
    </RouterLink>
  </div>
    
  <div class="inventory-container">
    <div class="inventory-header">
      <h2>🔌 Inventaire Général du Parc Informatique</h2>
      <button @click="loadInventoryData" :disabled="isLoading" class="btn-refresh">
        {{ isLoading ? 'Rechargement...' : '🔄 Actualiser le parc' }}
      </button>
    </div>

    <div class="filters-bar">
      <div class="filter-group text-search">
        <label>🔍 Recherche libre</label>
        <input 
          v-model="searchFilters.text" 
          type="text" 
          placeholder="Nom, numéro d'inventaire, utilisateur..."
        />
      </div>

      <div class="filter-group">
        <label>Type d'élément</label>
        <select v-model="searchFilters.itemtype">
          <option value="">-- Tous les types --</option>
          <option value="Computer">Ordinateurs (Computers)</option>
          <option value="Monitor">Moniteurs (Monitors)</option>
          <option value="Printer">Imprimantes (Printers)</option>
          <option value="Peripheral">Périphériques (Peripherals)</option>
          <option value="Phone">Téléphones (Phones)</option>
        </select>
      </div>

      <div class="filter-group">
        <label>⚙️ État / Statut</label>
        <select v-model="searchFilters.stateId">
          <option value="">-- Tous les états --</option>
          <option v-for="state in availableStates" :key="state.id" :value="state.id">
            {{ state.name }}
          </option>
        </select>
      </div>
    </div>

    <div class="results-counter">
      ✨ <strong>{{ filteredAssets.length }}</strong> équipement(s) correspondant à vos critères de recherche.
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Synchronisation en direct avec l'API GLPI...</p>
    </div>

    <div v-else-if="filteredAssets.length === 0" class="empty-inventory">
      <h3>🚫 Aucun matériel trouvé</h3>
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
          <tr 
            v-for="asset in filteredAssets" 
            :key="asset.itemtype + '-' + asset.id"
            @click="openAssetDetails(asset)"
            class="clickable-row"
          >
            <td class="td-type">
              <span class="type-icon-badge" :title="asset.itemtype">
                {{ getItemIcon(asset.itemtype) }}
              </span>
            </td>
            <td><strong>{{ asset.name || 'Sans nom' }}</strong></td>
            <td class="text-muted">{{ asset.otherserial || '—' }}</td>
            <td>
              <span v-if="asset.contact" class="user-badge">👤 {{ asset.contact }}</span>
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

    <div v-if="showModal && selectedAsset" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <span class="modal-type-icon">{{ getItemIcon(selectedAsset.itemtype) }}</span> 
            Détails de l'équipement
          </h3>
          <button @click="closeModal" class="btn-close">&times;</button>
        </div>
        
        <div class="modal-body">
          <div class="info-grid">
            <div class="info-item full-width">
              <span class="info-label">Nom de l'élément</span>
              <span class="info-value name-highlight">{{ selectedAsset.name || 'Sans nom' }}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Type de matériel</span>
              <span class="info-value text-capitalize">{{ selectedAsset.itemtype }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">ID GLPI</span>
              <span class="info-value text-id">#{{ selectedAsset.id }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Numéro d'Inventaire</span>
              <span class="info-value">{{ selectedAsset.otherserial || '—' }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Numéro de Série (Serial)</span>
              <span class="info-value">{{ selectedAsset.serial || '—' }}</span>
            </div>

            <div class="info-item">
              <span class="info-label">Utilisateur / Contact</span>
              <span class="info-value">
                <span v-if="selectedAsset.contact" class="user-badge">👤 {{ selectedAsset.contact }}</span>
                <span v-else>Aucun</span>
              </span>
            </td>

            <div class="info-item">
              <span class="info-label">Statut opérationnel</span>
              <span class="info-value">
                <span class="status-badge">{{ getStateLabel(selectedAsset.states_id) }}</span>
              </span>
            </div>

            <div v-if="selectedAsset.comment" class="info-item full-width">
              <span class="info-label">Commentaires / Notes</span>
              <p class="info-comment">{{ selectedAsset.comment }}</p>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModal" class="btn-modal-close">Fermer</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useListeMateriel } from '@/composables/useListeMateriel'
import { RouterLink } from 'vue-router'

const {
  isLoading,
  searchFilters,
  availableStates,
  filteredAssets,
  loadInventoryData,
  getItemIcon,
  getStateLabel
} = useListeMateriel()

// 🌟 États pour la gestion de la boîte modale
const showModal = ref(false)
const selectedAsset = ref(null)

// Ouvrir la modale avec l'asset ciblé
const openAssetDetails = (asset) => {
  selectedAsset.value = asset
  showModal.value = true
}

// Fermer la modale
const closeModal = () => {
  showModal.value = false
  selectedAsset.value = null
}

onMounted(() => {
  loadInventoryData()
})
</script>

<style scoped>
/* Vos styles d'origine */
.navigation-links { display: flex; gap: 10px; margin: 20px 30px 0 30px; }
.btn-secondary { background: #4b5563; color: white; border: none; padding: 8px 14px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-secondary:hover { background: #374151; }

.inventory-container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; background-color: #f8f9fa; min-height: 100vh; }
.inventory-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
.inventory-header h2 { color: #2c3e50; margin: 0; font-size: 1.4rem; }

.btn-refresh { background-color: #2ecc71; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-refresh:hover { background-color: #27ae60; }
.btn-refresh:disabled { background-color: #95a5a6; }

.filters-bar { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.03); display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 15px; }
.filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 200px; }
.filter-group.text-search { flex: 2; }
.filter-group label { font-size: 0.85rem; font-weight: bold; color: #7f8c8d; text-transform: uppercase; }
.filter-group input, .filter-group select { padding: 10px; border: 1px solid #dcdde1; border-radius: 6px; color: #2f3640; font-size: 0.95rem; outline: none; }
.filter-group input:focus, .filter-group select:focus { border-color: #3498db; }

.results-counter { font-size: 0.9rem; color: #7f8c8d; margin-bottom: 20px; padding-left: 5px; }

.table-wrapper { background: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); overflow: hidden; }
.inventory-table { width: 100%; border-collapse: collapse; text-align: left; }
.inventory-table th { background: #f1f2f6; padding: 15px; color: #7f8c8d; font-size: 0.85rem; text-transform: uppercase; border-bottom: 2px solid #e1b12c05; }
.inventory-table td { padding: 15px; border-bottom: 1px solid #f1f2f6; color: #353b48; font-size: 0.95rem; }

/* Styles pour l'interactivité des lignes */
.clickable-row { cursor: pointer; transition: background-color 0.15s ease; }
.clickable-row:hover { background-color: #f1f5f9 !important; }

.td-type { width: 60px; text-align: center; }
.type-icon-badge { font-size: 1.3rem; background: #f1f2f6; padding: 6px 10px; border-radius: 6px; }
.user-badge { background: #eaf2f8; color: #2980b9; padding: 4px 10px; border-radius: 4px; font-size: 0.85rem; font-weight: 500; }
.status-badge { background: #f5f6fa; border: 1px solid #dcdde1; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; color: #718093; }
.text-id { font-family: monospace; color: #95a5a6; font-weight: bold; }
.text-muted { color: #a4b0be; }
.text-capitalize { text-transform: capitalize; }

.loading-state { text-align: center; padding: 40px 0; color: #7f8c8d; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px auto; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.empty-inventory { background: white; text-align: center; padding: 50px; border-radius: 8px; color: #7f8c8d; }

/* 🌟 STYLES COMPLÉMENTAIRES POUR LA FENÊTRE MODALE */
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 20px; }
.modal-content { background: white; width: 100%; max-width: 650px; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); display: flex; flex-direction: column; overflow: hidden; animation: scaleUp 0.2s ease-out; }
@keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.modal-header { padding: 20px 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; background-color: #f8fafc; }
.modal-header h3 { margin: 0; font-size: 1.25rem; color: #1e293b; display: flex; align-items: center; gap: 10px; }
.modal-type-icon { background: #e2e8f0; padding: 4px 8px; border-radius: 6px; }
.btn-close { background: none; border: none; font-size: 1.75rem; color: #94a3b8; cursor: pointer; line-height: 1; }
.btn-close:hover { color: #475569; }

.modal-body { padding: 24px; overflow-y: auto; max-height: 70vh; }
.info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.info-item { display: flex; flex-direction: column; gap: 6px; }
.info-item.full-width { grid-column: span 2; }
.info-label { font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.info-value { font-size: 1rem; color: #334155; font-weight: 500; }
.name-highlight { font-size: 1.3rem; font-weight: 700; color: #0f172a; }

.info-comment { margin: 0; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem; color: #475569; line-height: 1.5; white-space: pre-line; }

.modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; background-color: #f8fafc; }
.btn-modal-close { padding: 10px 20px; background-color: #1e293b; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; transition: background-color 0.15s; }
.btn-modal-close:hover { background-color: #334155; }
</style>