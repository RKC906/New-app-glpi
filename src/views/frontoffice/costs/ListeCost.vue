<template>
  <div class="container">
    <h2>Liste des SQLite</h2>

    <p v-if="isLoading && costs.length === 0">Chargement...</p>
    <p v-if="error" class="error">{{ error }}</p>

    <table v-else class="computer-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Ticket ID</th>
          <th>Amount</th>
          <th>Label</th>
          <th>Update</th>
        </tr>
      </thead>
      <tbody>       
        <tr v-for="cout in costs" :key="cout.id">
          <td>{{ cout.id }}</td>
          <td>{{ cout.ticket_id }}</td>
          <td>{{ cout.amount }}</td>
          <td>{{ cout.label }}</td>
          <td>
            <button @click="goToEdit(cout.id)" class="btn-edit">
                Modifier
            </button>
          </td>
        </tr>

      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCost} from '@/composables/locales/useCost'
const router = useRouter()

const { costs, isLoading, error, fetchCost } = useCost()


onMounted(() => {
  fetchCost()
})


// 3. Update bouton
const goToEdit = (id) => {
  router.push({ name: 'costedit', params: { id: id } })
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
.btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }

</style>