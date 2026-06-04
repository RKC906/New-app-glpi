<template>
  <div class="container">
    <h2>Liste des Ordinateurs GLPI</h2>

    <div class="actions-bar">
      <RouterLink to="/computers/create">
        <button class="btn-primary">Ajouter un Ordinateur</button>
      </RouterLink>

      <div class="search-box">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Rechercher par nom ou ID..." 
          class="search-input"
        />
      </div>
    </div>
    
    <p v-if="isLoading && computers.length === 0">Chargement...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <table v-else class="computer-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Nom</th>
          <th>Update</th>
          <th>Delete</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredComputers.length === 0">
          <td colspan="4" class="no-result">Aucun ordinateur ne correspond à votre recherche.</td>
        </tr>
        
        <tr v-for="computer in filteredComputers" :key="computer.id">
          <td>{{ computer.id }}</td>
          <td><strong>{{ computer.name }}</strong></td>
          <td>
            <button @click="goToEdit(computer.id)" class="btn-edit">
                Modifier
            </button>
          </td>
          <td>
            <button 
              @click="handleDelete(computer.id, computer.name)" 
              class="btn-delete"
              :disabled="isLoading"
            >
              Supprimer
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
// 💡 Ajout de 'ref' et 'computed'
import { onMounted, ref, computed } from 'vue'
import { useComputers } from '@/composables/useComputer'
import { useRouter } from 'vue-router'
const router = useRouter()

const { computers, isLoading, error, fetchComputers, delComputer } = useComputers()

// 📝 Variable réactive pour stocker la saisie de l'utilisateur
const searchQuery = ref('')

onMounted(() => {
  fetchComputers()
})

// ✨ Propriété calculée pour filtrer la liste dynamiquement
const filteredComputers = computed(() => {
  // Si la barre de recherche est vide, on renvoie la liste complète
  if (!searchQuery.value.trim()) {
    return computers.value
  }

  const query = searchQuery.value.toLowerCase().trim()

  return computers.value.filter(computer => {
    const matchName = computer.name ? computer.name.toLowerCase().includes(query) : false
    const matchId = computer.id ? computer.id.toString().includes(query) : false
    
    // On garde l'ordinateur si le nom OU l'id contient la recherche
    return matchName || matchId
  })
})

const handleDelete = async (id, computerName) => {
  const confirmation = confirm(`Êtes-vous sûr de vouloir supprimer l'ordinateur "${computerName}" ?`)
  
  if (confirmation) {
    try {
      await delComputer(id)
      alert("L'ordinateur a bien été envoyé à la corbeille GLPI !")
    } catch (err) {
      alert("Impossible de supprimer cet élément.")
    }
  }
}

const goToEdit = (id) => {
  router.push({ name: 'computer-edit', params: { id: id } })
} 
</script>

<style scoped>
.container { padding: 20px; font-family: sans-serif; }

/* Nouveau style pour aligner le bouton et la recherche */
.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
}

.search-input {
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 250px;
  font-size: 0.95em;
}
.search-input:focus {
  border-color: #3498db;
  outline: none;
}

.no-result {
  text-align: center;
  color: #7f8c8d;
  font-style: italic;
  padding: 20px !important;
}

.computer-table { width: 100%; border-collapse: collapse; }
.computer-table th, .computer-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
.computer-table th { background-color: #f4f6f7; color: #34495e; }

.btn-delete {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}
.btn-delete:hover { background-color: #c0392b; }
.btn-delete:disabled { background-color: #bdc3c7; cursor: not-allowed; }
.error { color: #e74c3c; font-weight: bold; }
.btn-primary { padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
.btn-edit {
  background-color: #3618db;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  margin-right: 8px;
}
.btn-edit:hover { background-color: #2980b9; }
</style>