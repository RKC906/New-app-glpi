<template>
  <div class="form-container">
    <h2>Ajouter un nouvel Ordinateur</h2>

    <RouterLink :to="{ name: 'computers' }">
    <button class="btn-secondary">Retour à la liste</button>
    </RouterLink>
    
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="name">Nom de l'ordinateur *</label>
        <input 
          v-model="formData.name" 
          type="text" 
          id="name" 
          required 
          placeholder="ex: PC-PROD-01"
        />
      </div>

      <div class="actions">
        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Création en cours...' : 'Enregistrer dans GLPI' }}
        </button>
      </div>

      <p v-if="error" class="error-msg">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useComputers } from '@/composables/useComputer'
import { useRouter } from 'vue-router'

const { addComputer, isLoading, error } = useComputers()
const router = useRouter()

// Structure de données calquée sur ce qu'attend le schéma de l'API GLPI
const formData = ref({
  name: ''
})

const handleSubmit = async () => {
  try {
    await addComputer(formData.value)
    alert("Ordinateur ajouté avec succès dans GLPI !")
    // Redirection vers la liste des ordinateurs après le succès
    router.push('/back/computers')
  } catch (err) {
    // L'erreur est déjà gérée dans le composable
  }
}
</script>

<style scoped>
.form-container { max-width: 500px; margin: 40px auto; padding: 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
h2 { color: #2c3e50; margin-bottom: 20px; }
.form-group { margin-bottom: 15px; display: flex; flex-direction: column; }
label { font-weight: bold; margin-bottom: 5px; color: #34495e; font-size: 0.9em; }
input, textarea { padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 100%; }
input:focus, textarea:focus { border-color: #3498db; outline: none; }
button { padding: 12px; background: #2ecc71; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%; }
button:disabled { background: #bdc3c7; cursor: not-allowed; }
.error-msg { color: #e74c3c; margin-top: 10px; text-align: center; font-weight: bold; }
.btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
</style>