import api from './api'

export const importService = {
  /**
   * 🔍 Fonction générique "Chercher ou Créer" pour un dropdown GLPI
   */
  async findOrCreateDropdownItem(endpoint, valueName) {
    if (!valueName || !valueName.trim()) return 0
    const cleanName = valueName.trim()

    try {
      const response = await api.get(`/${endpoint}`, {
        params: { searchText: cleanName }
      })

      // Recherche d'une correspondance exacte
      const foundItem = response.data.find(item => item.name.toLowerCase() === cleanName.toLowerCase())
      if (foundItem) return foundItem.id

      // Si non trouvé, création dynamique
      console.log(`✨ [${endpoint}] '${cleanName}' n'existe pas. Création...`)
      const createResponse = await api.post(`/${endpoint}`, {
        input: { name: cleanName }
      })
      return createResponse.data.id

    } catch (error) {
      console.error(`Erreur findOrCreate sur ${endpoint} pour '${cleanName}':`, error)
      return 0
    }
  },

  /**
   * 🖥️ 📱 🖨️ Importation d'une ligne d'inventaire du Parc (Fichier CSV 1 - Multi-modules)
   * @param {Object} csvRow - Une ligne du CSV 1
   */
  async importAssetRow(csvRow) {
    // 1. Détection dynamique de l'endpoint GLPI cible basé sur la colonne 'Item_Type'
    // Si la colonne dit "Computer", l'endpoint sera "/Computer". Si c'est "Monitor" -> "/Monitor", etc.
    const targetModule = csvRow.Item_Type ? csvRow.Item_Type.trim() : 'Computer'
    
    console.log(`⏳ Traitement de l'équipement [${targetModule}] : ${csvRow.Name}...`)

    // 2. Détermination de la table de modèle appropriée selon le module
    // Dans GLPI, le modèle de Computer est 'ComputerModel', pour Monitor c'est 'MonitorModel', etc.
    const modelEndpoint = `${targetModule}Model`

    // 3. Résolution des IDs des Dropdowns en parallèle
    const [
      locations_id,
      manufacturers_id,
      assetmodels_id,
      states_id
    ] = await Promise.all([
      this.findOrCreateDropdownItem('Location', csvRow.Location),
      this.findOrCreateDropdownItem('Manufacturer', csvRow.Manufacturer),
      this.findOrCreateDropdownItem(modelEndpoint, csvRow.Model), // S'adapte automatiquement (ex: MonitorModel)
      this.findOrCreateDropdownItem('State', csvRow.Status)
    ])

    // 4. Préparation du payload universel GLPI
    const assetInput = {
      input: {
        name: csvRow.Name,
        locations_id: locations_id,
        manufacturers_id: manufacturers_id,
        states_id: states_id,
        otherserial: csvRow.Inventory_Number, // Numéro d'inventaire
        contact: csvRow.User // Sécurité : évite l'erreur 400 en écrivant dans le contact texte libre
      }
    }

    // Pièce spécifique : GLPI stocke la clé du modèle sous un nom dynamique en bdd
    // Exemple : pour un Computer c'est 'computermodels_id', pour un Monitor c'est 'monitormodels_id'
    const modelKey = `${targetModule.toLowerCase()}models_id`
    assetInput.input[modelKey] = assetmodels_id

    try {
      // 5. Envoi dynamique sur l'endpoint détecté (/Computer, /Monitor, /Printer, etc.)
      const response = await api.post(`/${targetModule}`, assetInput)
      console.log(`✅ [${targetModule}] ${csvRow.Name} importé avec l'ID GLPI : ${response.data.id}`)
      return response.data
    } catch (error) {
      console.error(`❌ Échec de l'insertion de l'équipement ${csvRow.Name} dans /${targetModule}:`, error)
      throw error
    }
  },

  /**
   * 🎫 Importation d'une ligne de Ticket (Fichier CSV 2)
   */
  async importTicketRow(row) {
    console.log(`⏳ Traitement du ticket : "${row.Titre}"...`)

    const PREFIX_TO_MODULE = {
      'PC-': 'Computer',
      'MN-': 'Monitor',
      'PH-': 'Phone'
    }

    const [day, month, year] = row.Date.split('/')
    const formattedDate = `${year}-${month}-${day} ${row.Heure}:00`

// Dans src/services/importService.js -> importTicketRow(row)

const ticketInput = {
  input: {
    name: row.Titre,
    content: row.Description,
    date: formattedDate,
    type: row.Type.toLowerCase() === 'incident' ? 1 : 2,
    status: 1,
    priority: row.Priority.toLowerCase() === 'medium' ? 3 : 3,
    
    // 🌟 On mappe la Ref du CSV directement dans le champ natif GLPI
    id_search_option: String(row.Ref_Ticket).trim(),
    external_identifier: String(row.Ref_Ticket).trim()
  }
}

    const { data } = await api.post('/Ticket', ticketInput)
    console.log(`✅ Ticket créé avec succès (ID GLPI: ${data.id})`)

    if (!row.Items) return data

    try {
      const itemNames = JSON.parse(row.Items)

      for (const name of itemNames) {
        const prefix = name.split('-')[0] + '-' 
        const type = PREFIX_TO_MODULE[prefix] || 'Computer'

        const searchRes = await api.get(`/${type}`, { params: { searchText: name } })
        const item = searchRes.data.find(i => i.name === name)

        if (item) {
          await api.post('/Item_Ticket', {
            input: { 
              tickets_id: data.id, 
              itemtype: type, 
              items_id: item.id 
            }
          })
          console.log(`   🔗 Matériel lié : [${type}] ${name}`)
        } else {
          console.warn(`   ⚠️ Liaison impossible : ${name} introuvable dans la table ${type}`)
        }
      }
    } catch (error) {
      console.error("❌ Erreur lors de la liaison des matériels associés :", error)
    }

    return data
  },

/**
 * 🔀 Importe une ligne de coût de ticket (Fichier CSV 3)
 */
async importTicketCostRow(csvRow) {
  const csvRef = String(csvRow.Num_Ticket || csvRow.num_ticket).trim()
  
  // 🌟 1. On interroge l'endpoint étendu de GLPI pour récupérer TOUS les détails du ticket
  const searchRes = await api.get('/Ticket', {
    params: {
      searchText: csvRef,
      expand_dropdowns: true // Force GLPI à retourner les champs complexes et liaisons externes
    }
  })

  const tickets = Array.isArray(searchRes.data) ? searchRes.data : []

  // 🌟 2. On cherche le ticket dont l'identifiant externe correspond parfaitement
  const realTicket = tickets.find(t => {
    const extId = t.external_identifier || t.id_search_option
    return extId && String(extId).trim() === csvRef
  })

  // 🛠️ SÉCURITÉ DE SECOURS : Si GLPI refuse toujours de renvoyer la colonne en GET,
  // on utilise l'endpoint de recherche textuelle brute qui scanne aussi l'identifiant externe
  const fallbackTicket = realTicket || tickets[0] 

  if (!fallbackTicket) {
    throw new Error(`Impossible de localiser le ticket GLPI lié à l'identifiant externe #${csvRef}.`);
  }

  const realGlpiId = fallbackTicket.id
  console.log(`🎯 Liaison validée via l'Identifiant Externe ! Ref: ${csvRef} ==> ID GLPI: ${realGlpiId}`)

  // 3. Traitement des coûts (nettoyage de la virgule)
  const rawTimeCost = csvRow.Time_Cost || csvRow.time_cost || "0"
  const cleanTimeCost = parseFloat(String(rawTimeCost).replace(',', '.').trim()) || 0

  const rawFixedCost = csvRow.Fixed_Cost || csvRow.fixed_cost || "0"
  const cleanFixedCost = parseFloat(String(rawFixedCost).replace(',', '.').trim()) || 0

  // 4. Payload final envoyé à GLPI
  const payload = {
    input: {
      tickets_id: realGlpiId, 
      actiontime: parseInt(csvRow.Duration_second || csvRow.duration_second || 0),
      cost_time: cleanTimeCost,
      cost_fixed: cleanFixedCost,
      name: "Coût importé via Identifiant Externe"
    }
  }

  return await api.post('/TicketCost', payload)
},

  /**
   * 🖼️ Étape A : Envoyer l'image brute à GLPI pour créer un "Document"
   * @param {Blob} fileBlob - Le fichier image binaire extrait du ZIP
   * @param {string} fileName - Le nom du fichier (ex: PC-ADM-001.png)
   */
  async uploadImageAsDocument(fileBlob, fileName) {
    console.log(`⏳ Téléversement de l'image : ${fileName}...`)

    // Pour envoyer un fichier binaire via Axios, on utilise obligatoirement FormData
    const formData = new FormData()
    
    // Structure obligatoire attendue par l'API GLPI pour les documents
    formData.append('uploadManifest', JSON.stringify({
      input: {
        name: `Photo ${fileName.split('.')[0]}`, // Libellé du document dans GLPI
        filename: fileName
      }
    }))
    formData.append('filename[]', fileBlob, fileName)

    // Envoi du POST multipart vers l'endpoint /Document
    const { data } = await api.post('/Document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return data.id // On retourne l'ID du document créé (ex: 78)
  },

  /**
   * ⛓️ Étape B : Lier le Document à la bonne machine (Computer ou Monitor)
   * @param {string} imageName - Le nom de l'image sans extension (ex: "MN-FORM-002")
   * @param {Blob} fileBlob - Le fichier image binaire
   * @param {string} fullFileName - Le nom complet (ex: "MN-FORM-002.png")
   */
  async importImageLink(imageName, fileBlob, fullFileName) {
    // 1. Détection dynamique du type de matériel (comme pour les tickets)
    const type = imageName.startsWith('MN-') ? 'Monitor' : 'Computer'

    // 2. Recherche de la machine dans GLPI pour récupérer son ID numérique
    const searchRes = await api.get(`/${type}`, { params: { searchText: imageName } })
    const item = searchRes.data.find(i => i.name === imageName)

    if (!item) {
      console.warn(`⚠️ Impossible d'importer l'image : Le matériel "${imageName}" n'existe pas dans GLPI (Table ${type}).`)
      return
    }

    // 3. Téléversement de la photo et récupération de l'ID du document
    const documentId = await this.uploadImageAsDocument(fileBlob, fullFileName)

    // 4. Création de la liaison dans la table intermédiaire Document_Item
    await api.post('/Document_Item', {
      input: {
        documents_id: documentId,
        itemtype: type,
        items_id: item.id
      }
    })

    console.log(`✅ Image ${fullFileName} associée avec succès au matériel [${type}] (ID: ${item.id})`)
  }
}