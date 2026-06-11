<template>
 <div class="import-container">
 <div class="import-card">
 <div class="card-header">
 <span class="icon"></span>
 <h3>Importation du Fichier 2 - Tickets & Incidents</h3>
 </div>
 
 <p class="description">
 Sélectionnez le fichier CSV contenant les tickets d'assistance. Le système créera les tickets et associera automatiquement les ordinateurs ou moniteurs correspondants.
 </p>

 <div class="file-zone" :class="{ 'disabled': isImporting }">
 <input 
 type="file" 
 id="csv-file" 
 accept=".csv" 
 @change="handleFileUpload" 
 :disabled="isImporting" 
 />
 <label for="csv-file" class="file-label">
 {{ isImporting ? 'Importation en cours...' : 'Choisir un fichier CSV' }}
 </label>
 </div>

 <div v-if="isImporting" class="progress-section">
 <div class="progress-text">
 Traitement : <strong>{{ currentProgress }}</strong> sur <strong>{{ totalRows }}</strong> tickets
 </div>
 <div class="progress-bar-container">
 <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
 </div>
 </div>

 <div v-if="importSuccess" class="success-message">
 L'importation s'est terminée avec succès ! {{ totalRows }} tickets ont été injectés dans GLPI.
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

// Calcul dynamique du pourcentage de la barre de progression
const progressPercentage = computed(() => {
 if (totalRows.value === 0) return 0
 return Math.round((currentProgress.value / totalRows.value) * 100)
})

const handleFileUpload = (event) => {
 const file = event.target.files[0]
 if (!file) return

 // Réinitialisation des états
 isImporting.value = true
 importSuccess.value = false
 totalRows.value = 0
 currentProgress.value = 0

 // Utilisation de PapaParse pour lire le fichier CSV
 Papa.parse(file, {
 header: true, // Transforme la ligne d'en-tête du CSV en clés d'objets JavaScript
 skipEmptyLines: true, // Ignore les lignes vides accidentelles
 complete: async (results) => {
 const rows = results.data
 totalRows.value = rows.length

 try {
 // Boucle séquentielle (ligne par ligne) pour respecter l'ordre et ne pas saturer l'API
 for (const row of rows) {
 await importService.importTicketRow(row)
 currentProgress.value++
 }
 importSuccess.value = true
 } catch (error) {
 console.error("L'importation générale a échoué :", error)
 alert("Une erreur est survenue pendant l'importation. Regardez la console réseau.")
 } finally {
 isImporting.value = false
 // On vide l'input file pour permettre de rechoisir le même fichier si besoin
 event.target.value = ''
 }
 }
 })
}
</script>

<style scoped>
.import-container {
 padding: 30px;
 max-width: 700px;
 margin: 0 auto;
}

.import-card {
 background: white;
 padding: 30px;
 border-radius: 8px;
 box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.card-header {
 display: flex;
 align-items: center;
 gap: 12px;
 margin-bottom: 15px;
}

.card-header h3 {
 margin: 0;
 color: #2c3e50;
 font-size: 1.4rem;
}

.icon {
 font-size: 1.6rem;
}

.description {
 color: #7f8c8d;
 font-size: 0.95rem;
 line-height: 1.5;
 margin-bottom: 25px;
}

.file-zone {
 border: 2px dashed #3498db;
 padding: 30px;
 text-align: center;
 border-radius: 6px;
 background-color: #f8fbfe;
 transition: background 0.2s;
}

.file-zone.disabled {
 border-color: #bdc3c7;
 background-color: #f2f2f2;
 cursor: not-allowed;
}

input[type="file"] {
 display: none; /* Cache l'input moche par défaut */
}

.file-label {
 display: inline-block;
 padding: 12px 24px;
 background-color: #3498db;
 color: white;
 font-weight: bold;
 border-radius: 4px;
 cursor: pointer;
 transition: background 0.2s;
}

.file-label:hover {
 background-color: #2980b9;
}

.file-zone.disabled .file-label {
 background-color: #95a5a6;
 cursor: not-allowed;
}

/* Barre de progression */
.progress-section {
 margin-top: 25px;
}

.progress-text {
 font-size: 0.9rem;
 color: #34495e;
 margin-bottom: 8px;
}

.progress-bar-container {
 width: 100%;
 height: 12px;
 background-color: #ecf0f1;
 border-radius: 6px;
 overflow: hidden;
}

.progress-bar {
 height: 100%;
 background-color: #2ecc71; /* Vert progression */
 width: 0%;
 transition: width 0.2s ease;
}

/* Message de succès */
.success-message {
 margin-top: 25px;
 padding: 15px;
 background-color: #d4edda;
 color: #155724;
 border: 1px solid #c3e6cb;
 border-radius: 4px;
 font-weight: 500;
 text-align: center;
}
</style>