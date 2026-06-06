<template>
    <div>
    <RouterLink :to="{ name: 'home' }">
        <button class="btn-secondary">Retour a la liste</button>
    </RouterLink><
    </div>
  <div class="create-ticket-container">
    <h2>🎫 Ouvrir un Nouveau Ticket d'Assistance</h2>
    <p class="subtitle">Créez une intervention et associez-y un ou plusieurs équipements du parc informatique.</p>

    <form @submit.prevent="submitAndRedirect" class="ticket-grid-form">
      
      <div class="form-main-card">
        <div class="form-group">
          <label for="title">🎯 Titre de l'intervention</label>
          <input 
            id="title"
            v-model="ticketForm.name" 
            type="text" 
            placeholder="Ex: Écran noir au démarrage ou demande d'installation de logiciel"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="type">📌 Type</label>
            <select id="type" v-model="ticketForm.type">
              <option value="1">🔴 Incident (Panne / Dysfonctionnement)</option>
              <option value="2">🟢 Demande (Besoin / Service / Matériel)</option>
            </select>
          </div>

          <div class="form-group">
            <label for="priority">⚡ Priorité</label>
            <select id="priority" v-model="ticketForm.priority">
              <option value="1">Très Basse</option>
              <option value="2">Basse</option>
              <option value="3">Moyenne</option>
              <option value="4">Haute</option>
              <option value="5">Très Haute</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="content">📝 Description détaillée du problème</label>
          <textarea 
            id="content"
            v-model="ticketForm.content" 
            rows="8" 
            placeholder="Décrivez précisément les symptômes constatés ou la nature de votre demande..."
            required
          ></textarea>
        </div>

        <button type="submit" :disabled="isSubmitting" class="btn-submit-ticket">
          {{ isSubmitting ? 'Enregistrement GLPI en cours...' : '🚀 Enregistrer le Ticket' }}
        </button>
      </div>

      <div class="form-sidebar-card">
        <h3 class="section-title">🔌 Équipements du parc associés</h3>
        <p class="section-desc">Sélectionnez le ou les matériels concernés par ce ticket d'assistance.</p>

        <div class="asset-selector-box">
          <label>🔍 Rechercher et ajouter un élément</label>
          <select @change="e => { addAssetToTicket(e.target.value); e.target.value = ''; }" :disabled="isLoading">
            <option value="">-- Choisir un équipement à ajouter --</option>
            <option v-for="asset in availableAssets" :key="asset.itemtype + '-' + asset.id" :value="asset.id">
              {{ getItemIcon(asset.itemtype) }} {{ asset.name || 'Sans Nom' }} ({{ asset.itemtype }} #{{ asset.id }})
            </option>
          </select>
        </div>

        <div class="selected-assets-list">
          <h4>📦 Matériels rattachés ({{ selectedAssets.length }})</h4>
          
          <div v-if="selectedAssets.length === 0" class="empty-assets-pane">
            Aucun équipement associé pour le moment. Le ticket sera généré comme "Général".
          </div>

          <div v-else class="assets-scroll-zone">
            <div v-for="(asset, index) in selectedAssets" :key="'selected-' + index" class="asset-selected-row">
              <span class="asset-row-icon">{{ getItemIcon(asset.itemtype) }}</span>
              <div class="asset-row-info">
                <strong>{{ asset.name || 'Équipement sans nom' }}</strong>
                <span>{{ asset.itemtype }} (ID GLPI: #{{ asset.id }})</span>
              </div>
              <button type="button" @click="removeAssetFromTicket(index)" class="btn-remove-asset" title="Détacher">
                ❌
              </button>
            </div>
          </div>
        </div>
      </div>

    </form>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTickets } from '@/composables/useTickets'

const {
  isLoading,
  isSubmitting,
  availableAssets,
  ticketForm,
  selectedAssets,
  loadAvailableAssets,
  addAssetToTicket,
  removeAssetFromTicket,
  handleSubmitTicket,
  getItemIcon
} = useTickets()

/**
 * Soumet le formulaire et effectue une action si l'enregistrement réussit
 */
const submitAndRedirect = async () => {
  const success = await handleSubmitTicket()
  if (success) {
    // Optionnel : Tu peux rediriger l'utilisateur vers ta liste de tickets ici
    // router.push('/admin/tickets')
  }
}

// Récupération des matériels dès l'ouverture de la page pour alimenter le dropdown
onMounted(() => {
  loadAvailableAssets()
})
</script>

<style scoped>
.create-ticket-container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; background-color: #f8f9fa; min-height: 100vh; }
h2 { color: #2c3e50; margin: 0 0 5px 0; }
.subtitle { color: #7f8c8d; margin-bottom: 30px; font-size: 0.95rem; }

.ticket-grid-form { display: grid; grid-template-columns: 1fr 400px; gap: 30px; align-items: start; }

/* Formulaire principal (Gauche) */
.form-main-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); }
.form-row { display: flex; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; flex: 1; }
.form-group label { font-size: 0.9rem; font-weight: bold; color: #34495e; }
.form-group input, .form-group select, .form-group textarea { padding: 12px; border: 1px solid #dcdde1; border-radius: 6px; font-size: 0.95rem; color: #2f3640; outline: none; background-color: #fff; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #3498db; }

.btn-submit-ticket { width: 100%; background-color: #3498db; color: white; border: none; padding: 14px; border-radius: 6px; font-size: 1rem; font-weight: bold; cursor: pointer; transition: background 0.2s; margin-top: 10px; }
.btn-submit-ticket:hover { background-color: #2980b9; }
.btn-submit-ticket:disabled { background-color: #95a5a6; cursor: not-allowed; }

/* Sidebar d'association (Droite) */
.form-sidebar-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); border-top: 4px solid #2ecc71; }
.section-title { margin: 0 0 5px 0; font-size: 1.1rem; color: #2c3e50; }
.section-desc { font-size: 0.8rem; color: #95a5a6; margin-bottom: 20px; line-height: 1.4; }

.asset-selector-box { display: flex; flex-direction: column; gap: 6px; margin-bottom: 25px; }
.asset-selector-box label { font-size: 0.85rem; font-weight: bold; color: #7f8c8d; }
.asset-selector-box select { padding: 10px; border: 1px solid #dcdde1; border-radius: 6px; font-size: 0.9rem; background-color: #f9f9f9; width: 100%; }

/* Panier d'assets */
.selected-assets-list h4 { margin: 0 0 10px 0; font-size: 0.9rem; color: #34495e; text-transform: uppercase; letter-spacing: 0.5px; }
.empty-assets-pane { background: #fafafa; border: 1px dashed #dcdde1; padding: 20px; text-align: center; color: #95a5a6; border-radius: 6px; font-size: 0.85rem; }

.assets-scroll-zone { display: flex; flex-direction: column; gap: 10px; max-height: 320px; overflow-y: auto; }
.asset-selected-row { display: flex; align-items: center; gap: 12px; background: #f4f7f9; border: 1px solid #dce5ec; padding: 10px 12px; border-radius: 6px; }
.asset-row-icon { font-size: 1.4rem; }
.asset-row-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.asset-row-info strong { font-size: 0.85rem; color: #2c3e50; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.asset-row-info span { font-size: 0.75rem; color: #7f8c8d; }
.btn-remove-asset { background: none; border: none; cursor: pointer; padding: 5px; font-size: 0.8rem; filter: grayscale(1); }
.btn-remove-asset:hover { filter: grayscale(0); }

@media (max-width: 900px) {
  .ticket-grid-form { grid-template-columns: 1fr; }
}
</style>