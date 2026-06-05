<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Connexion Administration</h2>
      <p class="subtitle">Entrez vos identifiants pour accéder au Backoffice</p>

      <form @submit.prevent="handleLogin">

        <div class="form-group">
          <label for="password">Mot de passe</label>
          <input id="password" v-model="password" type="password" required :disabled="isLoading"/>
        </div>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

        <button type="submit" :disabled="isLoading" class="btn-login">
          {{ isLoading ? 'Vérification...' : 'Se connecter' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const password = ref('mdp1234')
const isLoading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    // Appelle la fonction de vérification en dur
    await authStore.loginWithCredentials(password.value.trim())
    router.push('/back/accueil')
  } catch (error) {
    errorMessage.value = error.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container { display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f5f7fa; }
.login-card { background: white; padding: 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); width: 100%; max-width: 400px; }
h2 { margin-top: 0; color: #2c3e50; text-align: center; }
.subtitle { color: #7f8c8d; font-size: 0.9em; text-align: center; margin-bottom: 30px; }
.form-group { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
label { font-weight: bold; color: #34495e; font-size: 0.9em; }
input { padding: 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 1em; }
.btn-login { width: 100%; padding: 12px; background-color: #3498db; color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; }
.btn-login:disabled { background-color: #bdc3c7; }
.error-message { color: #e74c3c; font-size: 0.9em; margin-bottom: 15px; font-weight: bold; text-align: center; }
</style>