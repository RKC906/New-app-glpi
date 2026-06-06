<template>
  <div class="import-box">
    <h3>📥 Importation du Fichier 1 (Computers)</h3>
    <input type="file" accept=".csv" @change="handleFileUpload" :disabled="isImporting" />
    
    <div v-if="isImporting" class="progress">
      Importation en cours... ({{ currentProgress }} / {{ totalRows }})
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Papa from 'papaparse' // 💡 Pense à faire : npm install papaparse
import { importService } from '@/services/importService'

const isImporting = ref(false)
const currentProgress = ref(0)
const totalRows = ref(0)

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  isImporting.value = true

  // Parse du fichier CSV
  Papa.parse(file, {
    header: true, // Transforme la première ligne en clés d'objet (Name, Status, etc.)
    skipEmptyLines: true,
    complete: async (results) => {
      const rows = results.data
      totalRows.value = rows.length
      currentProgress.value = 0

      try {
        // On boucle sur chaque ligne du CSV pour l'envoyer à notre service
        for (const row of rows) {
          await importService.importAssetRow(row)
          currentProgress.value++
        }
        alert("🎉 Félicitations ! Tout le fichier 1 a été importé proprement dans GLPI !")
      } catch (error) {
        console.error("L'importation a échoué :", error)
        alert("Une erreur est survenue pendant l'importation.")
      } finally {
        isImporting.value = false
      }
    }
  })
}
</script>

<style scoped>
.import-box { padding: 20px; border: 1px solid #ccc; border-radius: 8px; background: white; margin-bottom: 20px; }
.progress { margin-top: 10px; color: #3498db; font-weight: bold; }
</style>