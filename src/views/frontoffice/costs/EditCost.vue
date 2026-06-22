<template>
  <div class="form-container">
    <h2>Modifier l'Ordinateur (ID: {{ formData.id }})(labe: {{ formData.label }})</h2>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Amount *</label>
        <input v-model="formData.amount" type="number" id="name" required />
      </div>

      <div class="actions">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Mise à jour...' : 'Enregistrer les modifications' }}
        </button>
        <button type="button" @click="cancel" class="btn-cancel">Annuler</button>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useCost } from '@/composables/locales/useCost'
import { useRouter, useRoute } from 'vue-router'

const { editCost, costs, isLoading, error } = useCost()
const router = useRouter()
const route = useRoute() // Pour récupérer l'ID depuis l'URL si besoin

// Structure du formulaire (Doit impérativement contenir 'id')
const formData = ref({
  id: null,
  amount: 0,
  label: ''
})

onMounted(() => {
  const Id = Number(route.params.id) // Exemple: /computers/edit/42
  
  formData.value.label = label
  formData.value.id = Id
  formData.value.amount = "Ancien Couts"
})

const handleSubmit = async () => {
  try {
    // On envoie l'objet entier (qui contient l'id, le name, le serial, etc.)
    await editCost(formData.value)
    alert("Ordinateur modifié avec succès dans GLPI !")
    router.push('/front/listecout') // Retour à la liste
  } catch (err) {
    // Erreur gérée par le composable
  }
}

const cancel = () => {
  router.push('/front/listecout')
}
</script>

<style scoped>
.form-container { max-width: 500px; margin: 40px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.form-group { margin-bottom: 15px; display: flex; flex-direction: column; }
label { font-weight: bold; margin-bottom: 5px; color: #34495e; }
input, textarea { padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
.actions { display: flex; gap: 10px; margin-top: 20px; }
button { padding: 12px; background: #3498db; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; flex: 1; }
.btn-cancel { background: #e74c3c; }
button:disabled { background: #bdc3c7; cursor: not-allowed; }
.error-msg { color: #e74c3c; text-align: center; margin-top: 10px; }
</style>