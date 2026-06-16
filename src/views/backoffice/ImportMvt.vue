<template>
  <div class="import-box">
    <h3>Import Mvt</h3>
    <input type="file" accept=".csv" @change="handleFileUpload" :disabled="isImporting" />
    
    <div v-if="isImporting" class="progress">
      Importation en cours... ({{ currentProgress }} / {{ totalRows }})
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Papa from 'papaparse'
import { importService } from '@/services/importService'

const isImporting = ref(false)
const currentProgress = ref(0)
const totalRows = ref(0)

const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return

  isImporting.value = true

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: async (results) => {
      const rows = results.data
      totalRows.value = rows.length
      currentProgress.value = 0
      
      let errorCount = 0 // Compteur pour suivre les lignes en échec

      // 🔄 On parcourt les lignes
      for (const row of rows) {
        try {
          // Le try/catch interne protège la continuité de la boucle
          await importService.ImportmvtTickets(row)
        } catch (error) {
          errorCount++
          console.error(`❌ Erreur sur la ligne du ticket #${row.ticket} (${row.mvt}) :`, error.message || error)
        } finally {
          // On incrémente la barre de progression quoi qu'il arrive
          currentProgress.value++
        }
      }

      // 📢 Bilan de l'importation à l'utilisateur
      isImporting.value = false
      
      if (errorCount === 0) {
        alert("🎉 Félicitations ! Tout le fichier mvt a été importé proprement dans SQLite !")
      } else if (errorCount < totalRows.value) {
        alert(`⚠️ Importation partielle terminée.\n\n${totalRows.value - errorCount} lignes importées avec succès.\n${errorCount} lignes ont échoué (consultez la console F12).`)
      } else {
        alert("❌ L'importation a complètement échoué. Toutes les lignes ont généré une erreur.")
      }
    }
  })
}
</script>

<style scoped>
.import-box { padding: 20px; border: 1px solid #ccc; border-radius: 8px; background: white; margin-bottom: 20px; }
.progress { margin-top: 10px; color: #3498db; font-weight: bold; }
</style>