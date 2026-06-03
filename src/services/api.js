import axios from 'axios'
import { useAuthStore } from '@/stores/auth' // On garde l'import ici

const APP_TOKEN = import.meta.env.VITE_GLPI_APP_TOKEN

const api = axios.create({
  baseURL: '/api-glpi',
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use((config) => {
  config.params = config.params || {}
  config.params['app_token'] = APP_TOKEN
  
  // 💡 C'EST ICI QU'IL FAUT LE METTRE ! 
  // L'appel se fera au moment de la requête, pas au chargement du fichier.
  const authStore = useAuthStore() 
  
  if (authStore.sessionToken) {
    config.headers['Session-Token'] = authStore.sessionToken
  }
  
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api