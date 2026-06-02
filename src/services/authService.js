import api from './api'

export const authService = {
  /**
   * Ouvre une session GLPI et récupère le Session-Token
   * @param {string} userToken 
   */
  async initSession(userToken) {
    const response = await api.get('/initSession', {
      headers: {
        'Authorization': `user_token ${userToken}`
      }
    })
    return response.data.session_token
  },

  /**
   * Ferme proprement la session GLPI (Optionnel mais recommandé)
   * @param {string} sessionToken 
   */
  killSession(sessionToken) {
    return api.get('/killSession', {
      headers: {
        'Session-Token': sessionToken
      }
    })
  }
}