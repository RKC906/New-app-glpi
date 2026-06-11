<template>
 <div class="form-container">
 <h2>Modifier l'Ordinateur (ID: {{ formData.id }})</h2>

 <form @submit.prevent="handleSubmit">
 <div class="form-group">
 <label for="name">Nom de l'ordinateur *</label>
 <input v-model="formData.name" type="text" id="name" required />
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
import { useComputers } from '@/composables/useComputer'
import { useRouter, useRoute } from 'vue-router'

const { editComputer, computers, isLoading, error } = useComputers()
const router = useRouter()
const route = useRoute() // Pour récupérer l'ID depuis l'URL si besoin

// Structure du formulaire (Doit impérativement contenir 'id')
const formData = ref({
 id: null,
 name: ''
})

onMounted(() => {
 // Mode Récupération : En production, tu chargerais les données actuelles de l'ordinateur
 // Soit depuis ton tableau local, soit via un GET /Computer/id
 const computerId = Number(route.params.id) // Exemple: /computers/edit/42
 
 // Simulation de pré-remplissage pour l'exemple
 formData.value.id = computerId
 formData.value.name = "PC-PROD-01 (Ancien Nom)"
})

const handleSubmit = async () => {
 try {
 // On envoie l'objet entier (qui contient l'id, le name, le serial, etc.)
 await editComputer(formData.value)
 alert("Ordinateur modifié avec succès dans GLPI !")
 router.push('/back/computers') // Retour à la liste
 } catch (err) {
 // Erreur gérée par le composable
 }
}

const cancel = () => {
 router.push('/back/computers')
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