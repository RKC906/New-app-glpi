<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 1. Import des deux composables
import { useComputers } from '@/composables/useComputer'       // GLPI
import { useLocalComputers } from '@/composables/locales/useLocalComputers' // SQLite

const router = useRouter()

// 2. Extraction + Renommage pour GLPI
const { 
  computers: glpiComputers, 
  isLoading: isGlpiLoading, 
  error: glpiError, 
  fetchComputers: fetchGlpiComputers,
  delComputer: delGlpiComputer
} = useComputers()

// 3. Extraction pour le Local (déjà nommées proprement)
const { 
  localComputers, 
  isLocalLoading, 
  localError, 
  fetchLocalComputers, 
  delLocalComputer 
} = useLocalComputers()

// 4. Une seule variable pour la barre de recherche globale
const searchQuery = ref('')

// 5. Chargement en parallèle au montage de la page
onMounted(() => {
  fetchGlpiComputers()  // Appel API GLPI
  fetchLocalComputers() // Appel API Express/SQLite
})

// ========================================================
// OPTION A : Filtre pour deux tableaux séparés (Côte à côte)
// ========================================================
const filteredGlpi = computed(() => {
  if (!searchQuery.value.trim()) return glpiComputers.value
  const query = searchQuery.value.toLowerCase().trim()
  return glpiComputers.value.filter(c => c.name?.toLowerCase().includes(query))
})

const filteredLocal = computed(() => {
  if (!searchQuery.value.trim()) return localComputers.value
  const query = searchQuery.value.toLowerCase().trim()
  return localComputers.value.filter(c => c.name?.toLowerCase().includes(query))
})

// ========================================================
// OPTION B : Fusionner les deux listes dans un seul tableau
// ========================================================
const allComputersCombined = computed(() => {
  // On ajoute une étiquette 'source' pour savoir d'où vient le PC dans le tableau
  const glpiMapped = glpiComputers.value.map(c => ({ ...c, source: 'GLPI' }))
  const localMapped = localComputers.value.map(c => ({ ...c, source: 'SQLite' }))
  
  const combined = [...glpiMapped, ...localMapped]
  
  if (!searchQuery.value.trim()) return combined
  const query = searchQuery.value.toLowerCase().trim()
  return combined.filter(c => c.name?.toLowerCase().includes(query))
})
</script>
<template>
  <div class="container">
    <h2>Gestion des Ordinateurs</h2>
        <RouterLink :to="{ name: 'computers' }">
        <button class="btn-secondary">Retour à la liste</button>
      </RouterLink>
    <div class="search-box">
      <input 
        v-model="searchQuery" 
        type="text" 
        placeholder="Rechercher partout (GLPI & Local)..." 
        class="search-input"
      />
    </div>

    <div class="tables-layout">
      
      <div class="table-section">
        <h3>Serveur GLPI Officiel</h3>
        <p v-if="isGlpiLoading">Chargement GLPI...</p>
        <p v-if="glpiError" class="error">{{ glpiError }}</p>
        
        <table v-else class="computer-table">
          <thead>
            <tr><th>ID</th><th>Nom</th></tr>
          </thead>
          <tbody>
            <tr v-for="pc in filteredGlpi" :key="'glpi-'+pc.id">
              <td>{{ pc.id }}</td>
              <td><span class="badge glpi">GLPI</span> {{ pc.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-section">
        <h3>Base SQLite Locale</h3>
        <p v-if="isLocalLoading">Chargement SQLite...</p>
        <p v-if="localError" class="error">{{ localError }}</p>
        
        <table v-else class="computer-table">
          <thead>
            <tr><th>ID</th><th>Nom</th></tr>
          </thead>
          <tbody>
            <tr v-for="pc in filteredLocal" :key="'local-'+pc.id">
              <td>{{ pc.id }}</td>
              <td><span class="badge local">Local</span> {{ pc.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
</template>
<style scoped>
.container { padding: 20px; font-family: sans-serif; }
.search-box { margin-bottom: 25px; }
.search-input { padding: 10px; width: 300px; border-radius: 4px; border: 1px solid #ccc; }

/* Grille pour mettre les tableaux côte à côte */
.tables-layout {
  display: flex;
  gap: 30px;
  width: 100%;
}
.table-section {
  flex: 1; /* Donne la même largeur aux deux blocs */
  background: #fcfcfc;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.computer-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
.computer-table th, .computer-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
.computer-table th { background-color: #f4f6f7; }

/* Petits badges de couleur pour le style */
.badge { padding: 3px 6px; border-radius: 3px; font-size: 0.8em; font-weight: bold; color: white; }
.badge.glpi { background-color: #3498db; }
.badge.local { background-color: #2ecc71; }
.error { color: #e74c3c; }
.btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
</style>