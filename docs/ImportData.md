Cas 1 : La nouvelle colonne est un texte libre ou un numéro (Champ direct)
async importComputerRow(csvRow) {
  // ... (le reste de tes résolutions d'IDs reste identique)

  const computerInput = {
    input: {
      name: csvRow.Name,
      locations_id: locations_id,
      manufacturers_id: manufacturers_id,
      computermodels_id: computermodels_id,
      states_id: states_id,
      users_id: users_id,
      otherserial: csvRow.Inventory_Number,
      
      // 🆕 Ajout direct sans passer par un dropdown :
      serial: csvRow.Serial_Number, 
      comment: csvRow.Comment
    }
  }

  const response = await api.post('/Computer', computerInput)
  return response.data
}

Cas 2 : La nouvelle colonne est un nouveau menu déroulant (Dropdown)
async importComputerRow(csvRow) {
  console.log(`⏳ Traitement de la machine : ${csvRow.Name}...`)

  // 🆕 On ajoute les nouvelles variables dans le tableau pour récupérer leurs IDs
  const [
    locations_id,
    manufacturers_id,
    computermodels_id,
    states_id,
    users_id,
    operatingsystems_id // 🆕 1. Nouvelle variable d'ID
  ] = await Promise.all([
    this.findOrCreateDropdownItem('Location', csvRow.Location),
    this.findOrCreateDropdownItem('Manufacturer', csvRow.Manufacturer),
    this.findOrCreateDropdownItem('ComputerModel', csvRow.Model),
    this.findOrCreateDropdownItem('State', csvRow.Status),
    this.findOrCreateDropdownItem('User', csvRow.User),
    this.findOrCreateDropdownItem('OperatingSystem', csvRow.OS) // 🆕 2. On appelle l'endpoint GLPI 'OperatingSystem'
  ])

  const computerInput = {
    input: {
      name: csvRow.Name,
      locations_id: locations_id,
      manufacturers_id: manufacturers_id,
      computermodels_id: computermodels_id,
      states_id: states_id,
      users_id: users_id,
      otherserial: csvRow.Inventory_Number,
      
      // 🆕 3. On injecte l'ID fraîchement trouvé ou créé
      operatingsystems_id: operatingsystems_id 
    }
  }

  const response = await api.post('/Computer', computerInput)
  return response.data
}
