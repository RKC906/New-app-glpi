<template>
  <div class="danger-zone">
    <h3>⚠️ Zone de Danger - Administration API Directe</h3>
    <p>Cette action videra l'intégralité des données de GLPI et SQLite.</p>
    
    <div class="reset-box">
      <button 
        @click="handleDirectGlpiReset" 
        :disabled="isResetting"
        class="btn-danger"
      >
        {{ isResetting ? 'Purge globale en cours...' : 'Lancer la purge complète' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'        // 👈 AJOUTEZ CETTE LIGNE ICI POUR FIXER L'ERREUR
import api from '@/services/api'  // 🔌 Instance Axios configurée pour GLPI (/api-glpi)
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isResetting = ref(false)

/**
 * 🎯 Fonction générique pour vider un endpoint GLPI
 */
const clearGlpiModule = async (endpoint) => {
  console.log(`⏳ Récupération des éléments pour : ${endpoint}...`)
  
  try {
    // 1. On liste les éléments existants
    const response = await api.get(`/${endpoint}`, {
      params: {
        'range': '0-9999' // Large plage pour tout attraper
      }
    })

    const items = response.data

    if (!Array.isArray(items) || items.length === 0) {
      console.log(`✨ Le module ${endpoint} est déjà vide.`)
      return
    }

    console.log(`🗑️ ${items.length} éléments trouvés dans ${endpoint}. Début de la suppression...`)

    // 2. On boucle et on purge définitivement
    for (const item of items) {
      await api.delete(`/${endpoint}/${item.id}`, {
        params: {
          'force_purge': true
        }
      })
      console.log(`✅ [${endpoint}] ID ${item.id} supprimé de la base.`)
    }
  } catch (error) {
    console.error(`⚠️ Impossible de nettoyer entièrement le module : ${endpoint}`, error)
  }
}

const handleDirectGlpiReset = async () => {
  if (!confirm("⚠️ ATTENTION : Cela va supprimer l'intégralité des données de GLPI ET réinitialiser COMPLÈTEMENT votre base SQLite locale (couleurs, traductions et coûts). Continuer ?")) {
    return;
  }

  isResetting.value = true

  const modulesToReset = [
    'TicketCost',
    'Item_Ticket', 
    'Ticket',
    'Computer',
    'Monitor',
    'Peripheral',
    'Phone'
  ]

  try {
    // 1. Purge ordonnée des modules GLPI
    for (const moduleName of modulesToReset) {
      await clearGlpiModule(moduleName)
    }

    // 2. Purge et reconstruction de la base locale SQLite via Express (port 3005)
    console.log("⏳ Destruction et reconstruction de la base SQLite...")
    await axios.post('http://localhost:3005/api/kanban/database/reset-all')
    console.log("✨ Base SQLite nettoyée et initialisée avec succès.")

    alert("🎉 La purge complète et ordonnée de GLPI et de SQLite est terminée !");
    
    // On recharge la page pour rafraîchir l'affichage global
    window.location.reload()

  } catch (error) {
    console.error("La suppression générale a échoué :", error)
    alert("Une erreur est survenue pendant la purge globale. Vérifiez les logs des serveurs.")
  } finally {
    isResetting.value = false
  }
}
</script>

<style scoped>
.danger-zone {
  margin: 20px 0;
  padding: 20px;
  border: 2px dashed #e74c3c;
  border-radius: 8px;
  background-color: #fdf2f2;
  font-family: sans-serif;
}
.danger-zone h3 { color: #c0392b; margin-top: 0; }
.reset-box { display: flex; gap: 15px; margin-top: 15px; }
.btn-danger {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}
.btn-danger:hover {
  background-color: #c0392b;
}
.btn-danger:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style>