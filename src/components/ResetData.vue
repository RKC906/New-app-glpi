<template>
  <div class="danger-zone">
    <h3>⚠️ Zone de Danger - Administration API Directe</h3>
    <p>Cette action videra les modules GLPI sélectionnés (Computers, Peripherals, Softwares) directement depuis ton navigateur.</p>
    
    <div class="reset-box">
      <button 
        @click="handleDirectGlpiReset" 
        :disabled="isResetting"
        class="btn-danger"
      >
        {{ isResetting ? 'Purge en cours...' : 'Lancer la purge GLPI' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api' // 🔌 On utilise ton instance Axios configurée
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const isResetting = ref(false)

// 🎯 Fonction générique pour vider un endpoint GLPI
const clearGlpiModule = async (endpoint) => {
  console.log(`⏳ Récupération des éléments pour : ${endpoint}...`)
  
  // 1. On liste les éléments existants (grâce à api.js, le Session-Token et l'app_token sont ajoutés tout seuls !)
  const response = await api.get(`/${endpoint}`, {
    params: {
      'range': '0-9999' // On demande une large plage pour tout attraper
    }
  })

  const items = response.data

  if (!Array.isArray(items) || items.length === 0) {
    console.log(`✨ Le module ${endpoint} est déjà vide.`)
    return
  }

  console.log(`🗑️ ${items.length} éléments trouvés dans ${endpoint}. Début de la suppression...`)

  // 2. On boucle et on purge
  for (const item of items) {
    // force_purge=true supprime définitivement sans passer par la corbeille GLPI
    await api.delete(`/${endpoint}/${item.id}`, {
      params: {
        'force_purge': true
      }
    })
    console.log(`✅ [${endpoint}] ID ${item.id} supprimé.`);
  }
}

// 🚀 Fonction principale déclenchée par le bouton
const handleDirectGlpiReset = async () => {
  // Vérification de sécurité de la session
  if (!authStore.isAuthenticated || !authStore.sessionToken) {
    alert("Erreur : Tu n'es pas authentifié à GLPI.")
    return
  }

  const firstCheck = confirm("ATTENTION ! Tu t'apprêtes à supprimer définitivement TOUT le parc informatique de GLPI. Es-tu sûr ?")
  if (!firstCheck) return

  isResetting.value = true

  // Liste des endpoints de l'API GLPI à nettoyer (respecte bien les majuscules de l'API GLPI)
  const modulesToReset = ['Computer', 'Peripheral', 'Software']

  try {
    // On boucle sur nos modules un par un
    for (const moduleName of modulesToReset) {
      await clearGlpiModule(moduleName)
    }

    alert("La purge complète via l'API GLPI est terminée !");
    
    // On recharge l'application pour rafraîchir tous les tableaux à l'écran
    window.location.reload()

  } catch (error) {
    console.error("La suppression a échoué :", error)
    alert("Une erreur est survenue. Vérifie tes droits GLPI ou la console de ton navigateur (CORS).")
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
}
.btn-danger:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}
</style>