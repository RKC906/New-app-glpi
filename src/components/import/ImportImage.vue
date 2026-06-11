<template>
 <div class="import-container">
 <div class="import-card">
 <div class="card-header">
 <span class="icon"></span>
 <h3>Importation du Fichier ZIP - Photos du Parc</h3>
 </div>
 
 <p class="description">
 Sélectionnez le fichier <strong>.zip</strong> contenant les photos de vos équipements. 
 Le système associera automatiquement chaque image (ex: <code>PC-ADM-001.png</code>) à l'ordinateur ou moniteur correspondant déjà présent dans GLPI.
 </p>

 <div class="file-zone" :class="{ 'disabled': isImporting }">
 <input 
 type="file" 
 id="zip-file" 
 accept=".zip" 
 @change="handleZipUpload" 
 :disabled="isImporting" 
 />
 <label for="zip-file" class="file-label">
 {{ isImporting ? 'Désarchivage...' : 'Choisir le fichier .zip' }}
 </label>
 </div>

 <div v-if="isImporting" class="progress-section">
 <div class="progress-text">
 Images importées : <strong>{{ currentProgress }}</strong> / <strong>{{ totalRows }}</strong>
 </div>
 <div class="progress-bar-container">
 <div class="progress-bar" :style="{ width: progressPercentage + '%' }"></div>
 </div>
 </div>

 <div v-if="importSuccess" class="success-message">
 Félicitations ! Toutes les photos valides du fichier ZIP ont été liées à vos matériels GLPI !
 </div>
 </div>
 </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import JSZip from 'jszip' // Importation de la bibliothèque de gestion de ZIP
import { importService } from '@/services/importService'

const isImporting = ref(false)
const importSuccess = ref(false)
const currentProgress = ref(0)
const totalRows = ref(0)

const progressPercentage = computed(() => {
 return totalRows.value === 0 ? 0 : Math.round((currentProgress.value / totalRows.value) * 100)
})

const handleZipUpload = async (event) => {
 const file = event.target.files[0]
 if (!file) return

 isImporting.value = true
 importSuccess.value = false
 totalRows.value = 0
 currentProgress.value = 0

 try {
 const jsub = new JSZip()
 // 1. Lecture et chargement du fichier ZIP complet
 const zipContent = await jsub.loadAsync(file)
 
 // 2. On filtre pour ne garder que les fichiers images (on ignore les dossiers cachés comme __MACOSX)
 const imageFiles = Object.values(zipContent.files).filter(zipEntry => {
 return !zipEntry.dir && zipEntry.name.match(/\.(png|jpg|jpeg|gif)$/i) && !zipEntry.name.startsWith('__')
 })

 totalRows.value = imageFiles.length

 if (totalRows.value === 0) {
 alert("Le fichier ZIP ne contient aucune image valide (.png, .jpg).")
 isImporting.value = false
 return
 }

 // 3. Traitement séquentiel de chaque image présente dans le ZIP
 for (const zipEntry of imageFiles) {
 // Extraction du fichier au format binaire (Blob)
 const fileBlob = await zipEntry.async('blob')
 
 // On sépare le nom et le chemin (ex: "photos/PC-ADM-001.png" -> "PC-ADM-001.png")
 const fullFileName = zipEntry.name.split('/').pop()
 // On retire l'extension pour n'avoir que le nom du matériel (ex: "PC-ADM-001")
 const imageName = fullFileName.substring(0, fullFileName.lastIndexOf('.'))

 // Appel de notre service pour injecter et lier l'image
 await importService.importImageLink(imageName, fileBlob, fullFileName)
 
 currentProgress.value++
 }

 importSuccess.value = true
 } catch (error) {
 console.error("Erreur lors du traitement du fichier ZIP :", error)
 alert("Impossible de lire le fichier ZIP. Assurez-vous qu'il n'est pas corrompu.")
 } finally {
 isImporting.value = false
 event.target.value = '' // Reset de l'input
 }
}
</script>

<style scoped>
.import-container { padding: 30px; max-width: 700px; margin: 0 auto; }
.import-card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
.card-header h3 { margin: 0; color: #2c3e50; font-size: 1.4rem; }
.icon { font-size: 1.6rem; }
.description { color: #7f8c8d; font-size: 0.95rem; line-height: 1.5; margin-bottom: 25px; }
.file-zone { border: 2px dashed #9b59b6; padding: 30px; text-align: center; border-radius: 6px; background-color: #faf8fc; }
.file-zone.disabled { border-color: #bdc3c7; background-color: #f2f2f2; }
input[type="file"] { display: none; }
.file-label { display: inline-block; padding: 12px 24px; background-color: #9b59b6; color: white; font-weight: bold; border-radius: 4px; cursor: pointer; }
.file-label:hover { background-color: #8e44ad; }
.progress-section { margin-top: 25px; }
.progress-text { font-size: 0.9rem; color: #34495e; margin-bottom: 8px; }
.progress-bar-container { width: 100%; height: 12px; background-color: #ecf0f1; border-radius: 6px; overflow: hidden; }
.progress-bar { height: 100%; background-color: #9b59b6; width: 0%; transition: width 0.2s ease; }
.success-message { margin-top: 25px; padding: 15px; background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; border-radius: 4px; text-align: center; }
</style>