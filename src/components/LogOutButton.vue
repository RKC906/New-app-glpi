<template>
  <button @click="handleLogout" class="btn-logout">Déconnexion</button>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = () => {
  // 1. Demande confirmation à l'utilisateur
  const confirmLogout = confirm("Êtes-vous sûr de vouloir vous déconnecter du Backoffice ?")
  
  if (confirmLogout) {
    // 2. On appelle la fonction logout du store Pinia (qui vide le localStorage)
    authStore.logout()
    
    // 3. On redirige l'utilisateur vers la page d'accueil publique (Frontoffice)
    // Tu peux aussi mettre '/login' si tu préfères le renvoyer sur le formulaire
    router.push('/back') 
    
    console.log("🔒 Déconnexion réussie. Retour au Frontoffice.")
  }
}
</script>

<style scoped>
.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background-color: #e74c3c; /* Rouge danger */
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.95em;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
}

.btn-logout:hover {
  background-color: #c0392b; /* Rouge plus foncé au survol */
}

.btn-logout:active {
  transform: scale(0.98); /* Petit effet d'enfoncement au clic */
}

.icon {
  font-size: 1.1em;
}
</style>