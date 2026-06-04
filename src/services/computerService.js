import api from './api'

export const computerService = {
  //Liste  
  getComputers() {
    return api.get('/Computer')
  },

  //Create
  createComputer(computerData) {
    return api.post('/Computer', {
      input: computerData
    })
  },

  //Delete
deleteComputer(computerId) {
 return api.delete(`/Computer/${computerId}`)
}
}