<template>
 <div class="modal-backdrop" @click.self="$emit('close')">
 <div class="modal-container">
 
 <div class="modal-header">
 <div>
 <h3>Ouvrir un Nouveau Ticket d'Assistance</h3>
 <p class="subtitle">Créez une intervention et associez-y un ou plusieurs équipements du parc informatique.</p>
 </div>
 <button class="btn-close" @click="$emit('close')">×</button>
 </div>

 <form @submit.prevent="submitAndRedirect" class="ticket-grid-form">
 
 <div class="form-main-card">
 <div class="form-group">
 <label for="title">Titre de l'intervention</label>
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
 <label for="type">Type</label>
 <select id="type" v-model="ticketForm.type">
 <option value="1">Incident (Panne / Dysfonctionnement)</option>
 <option value="2">Demande (Besoin / Service / Matériel)</option>
 </select>
 </div>

 <div class="form-group">
 <label for="priority">Priorité</label>
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
 <label for="content">Description détaillée du problème</label>
 <textarea 
 id="content"
 v-model="ticketForm.content" 
 rows="6" 
 placeholder="Décrivez précisément les symptômes constatés ou la nature de votre demande..."
 required
 ></textarea>
 </div>
 </div>

 <div class="form-sidebar-card">
 <h3 class="sidebar-title">Équipements du parc associés</h3>
 <p class="sidebar-desc">Sélectionnez le ou les matériels concernés par ce ticket.</p>

 <div class="asset-selector-box">
 <label>Rechercher et ajouter un élément</label>
 <select @change="e => { addAssetToTicket(e.target.value); e.target.value = ''; }" :disabled="isLoading">
 <option value="">-- Choisir un équipement --</option>
 <option v-for="asset in availableAssets" :key="asset.itemtype + '-' + asset.id" :value="asset.id">
 {{ asset.name || 'Sans Nom' }} ({{ asset.itemtype }} #{{ asset.id }})
 </option>
 </select>
 </div>

 <div class="selected-assets-list">
 <h4>Matériels rattachés ({{ selectedAssets.length }})</h4>
 
 <div v-if="selectedAssets.length === 0" class="empty-assets-pane">
 Aucun équipement associé pour le moment.
 </div>

 <div v-else class="assets-scroll-zone">
 <div v-for="(asset, index) in selectedAssets" :key="'selected-' + index" class="asset-selected-row">
 <div class="asset-row-info">
 <strong>{{ asset.name || 'Équipement sans nom' }}</strong>
 <span>{{ asset.itemtype }} (ID: #{{ asset.id }})</span>
 </div>
 <button type="button" @click="removeAssetFromTicket(index)" class="btn-remove-asset" title="Détacher">
 Retirer
 </button>
 </div>
 </div>
 </div>
 </div>

 </form>

 <div class="modal-footer">
 <button type="button" class="btn-cancel" @click="$emit('close')">Annuler</button>
 <button type="submit" :disabled="isSubmitting" @click="submitAndRedirect" class="btn-submit-ticket">
 {{ isSubmitting ? 'Enregistrement GLPI...' : 'Enregistrer le Ticket' }}
 </button>
 </div>

 </div>
 </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTickets } from '@/composables/useTickets'

const emit = defineEmits(['close', 'success'])

const {
 isLoading,
 isSubmitting,
 availableAssets,
 ticketForm,
 selectedAssets,
 loadAvailableAssets,
 addAssetToTicket,
 removeAssetFromTicket,
 handleSubmitTicket
} = useTickets()

const submitAndRedirect = async () => {
 const success = await handleSubmitTicket()
 if (success) {
 emit('success')
 }
}

onMounted(() => {
 loadAvailableAssets()
})
</script>

<style scoped>
/* Fond semi-transparent assombri */
.modal-backdrop { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }

/* Conteneur principal */
.modal-container { background: #ffffff; width: 100%; max-width: 1050px; max-height: 90vh; border-radius: 12px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); display: flex; flex-direction: column; overflow: hidden; font-family: sans-serif; }

/* Header de la modale */
.modal-header { padding: 24px; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; }
.modal-header h3 { margin: 0; font-size: 1.3rem; color: #1e293b; font-weight: 700; }
.subtitle { margin: 4px 0 0 0; color: #64748b; font-size: 0.88rem; }
.btn-close { background: none; border: none; font-size: 1.8rem; color: #94a3b8; cursor: pointer; line-height: 1; }
.btn-close:hover { color: #475569; }

/* Grid interne */
.ticket-grid-form { display: grid; grid-template-columns: 1fr 340px; gap: 24px; padding: 24px; overflow-y: auto; flex: 1; background-color: #f8fafc; }

/* Formulaire principal (Gauche) */
.form-main-card { background: #ffffff; padding: 24px; border-radius: 8px; border: 1px solid #e2e8f0; }
.form-row { display: flex; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; flex: 1; }
.form-group label { font-size: 0.85rem; font-weight: 600; color: #34495e; }
.form-group input, .form-group select, .form-group textarea { padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; color: #1e293b; outline: none; background-color: #fff; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: #0ea5e9; box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.1); }

/* Sidebar d'association (Droite) */
.form-sidebar-card { background: #ffffff; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; border-top: 4px solid #10b981; }
.sidebar-title { margin: 0 0 4px 0; font-size: 1rem; color: #1e293b; font-weight: 700; }
.sidebar-desc { font-size: 0.8rem; color: #64748b; margin-bottom: 16px; line-height: 1.4; }

.asset-selector-box { display: flex; flex-direction: column; gap: 6px; margin-bottom: 20px; }
.asset-selector-box label { font-size: 0.8rem; font-weight: 600; color: #475569; }
.asset-selector-box select { padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; background-color: #f8fafc; width: 100%; }

/* Panier d'équipements */
.selected-assets-list h4 { margin: 0 0 10px 0; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; }
.empty-assets-pane { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 16px; text-align: center; color: #94a3b8; border-radius: 6px; font-size: 0.8rem; }

.assets-scroll-zone { display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto; }
.asset-selected-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; }
.asset-row-info { display: flex; flex-direction: column; min-width: 0; }
.asset-row-info strong { font-size: 0.8rem; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.asset-row-info span { font-size: 0.75rem; color: #64748b; }
.btn-remove-asset { background: none; border: none; color: #ef4444; font-size: 0.75rem; cursor: pointer; font-weight: 600; }
.btn-remove-asset:hover { text-decoration: underline; }

/* Modal Footer Action */
.modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: flex-end; gap: 12px; background: #ffffff; }
.btn-cancel { padding: 10px 16px; background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #e2e8f0; }

.btn-submit-ticket { background-color: #1e293b; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
.btn-submit-ticket:hover { background-color: #334155; }
.btn-submit-ticket:disabled { background-color: #94a3b8; cursor: not-allowed; }

@media (max-width: 850px) {
 .ticket-grid-form { grid-template-columns: 1fr; }
}
</style>