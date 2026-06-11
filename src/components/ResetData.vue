<template>
  <div class="danger-zone">
    <h3>⚠️ Zone de Danger - Administration API Directe</h3>
    <p>Cette action videra l'intégralité des données importées (Coûts, Tickets, Éléments du Parc Multi-modules) directement depuis ton navigateur.</p>
    
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
import api from '@/services/api' // 🔌 Instance Axios configurée
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
      // force_purge=true supprime sans passer par la corbeille GLPI
      await api.delete(`/${endpoint}/${item.id}`, {
        params: {
          'force_purge': true
        }
      })
      console.log(`✅ [${endpoint}] ID ${item.id} supprimé de la base.`)
    }
  } catch (error) {
    // On capture les erreurs pour éviter de bloquer la suite de la boucle des modules
    console.error(`⚠️ Impossible de nettoyer entièrement le module : ${endpoint}`, error)
  }
}

/**
 * 🚀 Fonction principale déclenchée par le bouton
 */
const handleDirectGlpiReset = async () => {
  // Vérification de sécurité de la session
  if (!authStore.isAuthenticated || !authStore.sessionToken) {
    alert("Erreur : Tu n'es pas authentifié à GLPI.")
    return
  }

  const firstCheck = confirm("🚨 ATTENTION ATTENTION ! Tu t'apprêtes à supprimer définitivement TOUTES les données importées des 3 fichiers (Coûts, Tickets, et l'intégralité du Parc Informatique). Continuer ?")
  if (!firstCheck) return

  const secondCheck = confirm("⚠️ DERNIER AVERTISSEMENT : Cette opération est irréversible et détruira les liaisons en base de données. Es-tu absolument sûr ?")
  if (!secondCheck) return

  isResetting.value = true

  // 📋 Liste ordonnée des modules à nettoyer (De la fin vers le début pour respecter l'intégrité de la BDD)
  const modulesToReset = [
    // 1. On supprime d'abord le Fichier 3 (Les coûts)
    'TicketCost',
    
    // 2. On rompt les liaisons matérielles-tickets du Fichier 2 avant de supprimer les tickets
    'Item_Ticket', 
    'Ticket',
    
    // 3. On nettoie TOUS les modules potentiels du Parc du Fichier 1 (S'adapte à ton Item_type)
    'Computer',
    'Monitor',
    'Peripheral',
    'Phone'
  ]

  try {
    // Exécution séquentielle du nettoyage
    for (const moduleName of modulesToReset) {
      await clearGlpiModule(moduleName)
    }

    alert("🎉 La purge complète et ordonnée de la base GLPI est terminée !");
    
    // On recharge la page pour rafraîchir l'affichage global
    window.location.reload()

  } catch (error) {
    console.error("La suppression générale a échoué :", error)
    alert("Une erreur est survenue pendant la purge globale. Vérifie tes privilèges admin GLPI.")
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