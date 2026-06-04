<template>
  <div class="container">
    <h2>Liste des Ordinateurs GLPI</h2>

     <RouterLink to="/computers/create">
      <button class="btn-primary">Ajouter un Ordinateur</button>
    </RouterLink>
     <p><RouterLink to="/computerslocale">
      <button class="btn-primary">Liste Glpi + Locale</button>
    </RouterLink></p>
    
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
        <tr v-for="computer in computers" :key="computer.id">
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
import { onMounted } from 'vue'
import { useComputers } from '@/composables/useComputer'
import { useRouter } from 'vue-router'
const router = useRouter()

// 1. On extrait 'delComputer' en plus des autres outils
const { computers, isLoading, error, fetchComputers, delComputer } = useComputers()

onMounted(() => {
  fetchComputers()
})

// 2. La fonction liée au clic du bouton
const handleDelete = async (id, computerName) => {
  // Fenêtre de confirmation de sécurité
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

// 3. Update bouton
const goToEdit = (id) => {
  router.push({ name: 'computer-edit', params: { id: id } })
} 
</script>

<style scoped>
.container { padding: 20px; font-family: sans-serif; }
.computer-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
.computer-table th, .computer-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
.computer-table th { background-color: #f4f6f7; color: #34495e; }

/* Style du bouton supprimer rouge et propre */
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
.btn-delete:hover {
  background-color: #c0392b;
}
.btn-delete:disabled {
  background-color: #bdc3c7;
  cursor: not-allowed;
}
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