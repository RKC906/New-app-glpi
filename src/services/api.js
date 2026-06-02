import axios from 'axios'

// On récupère le token de l'environnement
const APP_TOKEN = import.meta.env.VITE_GLPI_APP_TOKEN

const api = axios.create({
  baseURL: '/api-glpi', // Le proxy de Vite interceptera ceci
  headers: {
    'Content-Type': 'application/json'
  }
})

// Un "Interceptor" Axios magique : il va intercepter TOUTES les requêtes sortantes
// de cette instance pour leur greffer automatiquement le app_token dans l'URL.
api.interceptors.request.use((config) => {
  // On s'assure que l'objet params existe
  config.params = config.params || {}
  
  // On injecte le token de manière totalement transparente
  config.params['app_token'] = APP_TOKEN
  
  return config
}, (error) => {
  return Promise.reject(error)
})

export default api