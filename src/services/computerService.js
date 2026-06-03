import api from './api'

export const computerService = {
  getComputers() {
    return api.get('/Computer')
  }
}