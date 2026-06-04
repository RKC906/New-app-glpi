Approche 1 : La navigation directe avec <RouterLink> (Le plus simple)

<template>
  <RouterLink to="/computers/create">
    <button class="btn-primary">Ajouter un Ordinateur</button>
  </RouterLink>

  <RouterLink :to="{ name: 'computers' }">
    <button class="btn-secondary">Retour à la liste</button>
  </RouterLink>
</template>

<style scoped>
/* RouterLink génère une balise <a>, cette règle supprime le soulignement par défaut */
a { text-decoration: none; }
.btn-primary { padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
.btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
</style>

Approche 2 : La navigation par programmation avec router.push() (Le plus puissant)

<template>
  <button @click="saveAndNavigate" class="btn-success">
    Enregistrer et Quitter
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'

// 1. On récupère l'instance du routeur
const router = useRouter()

const saveAndNavigate = async () => {
  console.log("1. Traitement de données en cours...")
  // Exemple : await api.post(...)
  
  console.log("2. Traitement fini, redirection de l'utilisateur...")
  
  // 2. On pousse la nouvelle URL dans l'historique du navigateur
  router.push('/computers') 
  
  // Tu peux aussi utiliser le nom de la route :
  // router.push({ name: 'computers' })
}
</script>

<style scoped>
.btn-success { padding: 10px 20px; background-color: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>