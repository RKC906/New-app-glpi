import api from './api'

export const computerService = {
  /**
   * Récupère uniquement les ordinateurs
   */
  getComputers(sessionToken) {
    return api.get('/Computer', {
      headers: {
        'Session-Token': sessionToken
      }
    })
  }
}