<template>
 <div class="import-container">
 <div class="import-card">
 <div class="card-header">
 <span class="icon"></span>
 <h3>Importation du Fichier 3 - Coûts & Facturation</h3>
 </div>
 
 <p class="description">
 Téléversez le fichier CSV contenant les coûts fixes et temporels des interventions. Ces données seront directement rattachées à l'historique financier de vos tickets GLPI.
 </p>

 <div class="file-zone" :class="{ 'disabled': isImporting }">
 <input 
 type="file" 
 id="csv-cost-file" 
 accept=".csv" 
 @change="handleFileUpload" 
 :disabled="isImporting" 
 />
 <label for="csv-cost-file" class="file-label">
 {{ isImporting ? 'Importation en cours...' : 'Choisir le fichier des coûts' }}
 </label>
 </div>

 <div v-if="isImporting" class="progress-section">
 <div class="progress-text">
 Lignes traitées : <strong>{{ currentProgress }}</strong> / <strong>{{ totalRows }}</strong>
 </div>
 <div class="progress-bar-container">
 <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
 </div>
 </div>

 <div v-if="importSuccess" class="success-message">
 Tous les coûts ont été associés et injectés avec succès dans GLPI !
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Papa from 'papaparse'
import { importService } from '@/services/importService'

const isImporting = ref(false)
const importSuccess = ref(false)
const currentProgress = ref(0)
const totalRows = ref(0)

const progressPercentage = computed(() => {
 return totalRows.value === 0 ? 0 : Math.round((currentProgress.value / totalRows.value) * 100)
})

const handleFileUpload = (event) => {
 const file = event.target.files[0]
 if (!file) return

 isImporting.value = true
 importSuccess.value = false
 totalRows.value = 0
 currentProgress.value = 0

 Papa.parse(file, {
 header: true,
 skipEmptyLines: true,
 complete: async (results) => {
 const rows = results.data
 totalRows.value = rows.length

 try {
 for (const row of rows) {
 await importService.importTicketCostRow(row)
 currentProgress.value++
 }
 importSuccess.value = true
 } catch (error) {
 console.error(error)
 alert("Erreur lors de l'intégration des coûts. Vérifiez la console.")
 } finally {
 isImporting.value = false
 event.target.value = ''
 }
 }
 })
}
</script>

<style scoped>
.import-container { padding: 30px; max-width: 700px; margin: 0 auto; }
.import-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
.card-header h3 { margin: 0; color: #2c3e50; font-size: 1.4rem; }
.icon { font-size: 1.6rem; }
.description { color: #7f8c8d; font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px; }
.file-zone { border: 2px dashed #e74c3c; padding: 30px; text-align: center; border-radius: 6px; background-color: #fffdfd; }
.file-zone.disabled { border-color: #bdc3c7; background-color: #f2f2f2; }
input[type="file"] { display: none; }
.file-label { display: inline-block; padding: 12px 24px; background-color: #e74c3c; color: white; font-weight: bold; border-radius: 4px; cursor: pointer; }
.file-label:hover { background-color: #c0392b; }
.progress-section { margin-top: 25px; }
.progress-text { font-size: 0.9rem; color: #34495e; margin-bottom: 8px; }
.progress-bar-container { width: 100%; height: 12px; background-color: #ecf0f1; border-radius: 6px; overflow: hidden; }
.progress-bar { height: 100%; background-color: #e74c3c; width: 0%; transition: width 0.2s ease; }
.success-message { margin-top: 25px; padding: 15px; background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px; text-align: center; }
</style>