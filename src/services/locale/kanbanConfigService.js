import axios from 'axios'

const expressApi = axios.create({
  baseURL: 'http://localhost:3005/api'
})

export const kanbanConfigService = {
  async fetchConfig() {
    const { data } = await expressApi.get('/kanban/config')
    return data || { colors: [], translations: [] }
  },

  // On passe la langue active lors de la sauvegarde
  async saveConfig(colors, currentLang) {
    const payload = {
      colors: Object.keys(colors).map(id => ({ id_status: parseInt(id), color: colors[id] })),
      currentLang: currentLang
    }
    const { data } = await expressApi.post('/kanban/config', payload)
    return data
  }
}