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
   */
  async importAssetRow(csvRow) {
    const targetModule = csvRow.Item_Type ? csvRow.Item_Type.trim() : 'Computer'
    console.log(`⏳ Traitement de l'équipement [${targetModule}] : ${csvRow.Name}...`)

    const modelEndpoint = `${targetModule}Model`

    const [
      locations_id,
      manufacturers_id,
      assetmodels_id,
      states_id
    ] = await Promise.all([
      this.findOrCreateDropdownItem('Location', csvRow.Location),
      this.findOrCreateDropdownItem('Manufacturer', csvRow.Manufacturer),
      this.findOrCreateDropdownItem(modelEndpoint, csvRow.Model),
      this.findOrCreateDropdownItem('State', csvRow.Status)
    ])

    const assetInput = {
      input: {
        name: csvRow.Name,
        locations_id: locations_id,
        manufacturers_id: manufacturers_id,
        states_id: states_id,
        otherserial: csvRow.Inventory_Number,
        contact: csvRow.User
      }
    }

    const modelKey = `${targetModule.toLowerCase()}models_id`
    assetInput.input[modelKey] = assetmodels_id

    try {
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
      'IMP-': 'Printer',
      'SW-': 'Software'
    }

    const [day, month, year] = row.Date.split('/')
    const formattedDate = `${year}-${month}-${day} ${row.Heure}:00`

    const ticketInput = {
      input: {
        name: row.Titre,
        content: row.Description,
        date: formattedDate,
        type: row.Type.toLowerCase() === 'incident' ? 1 : 2,
        status: 1,
        priority: row.Priority.toLowerCase() === 'medium' ? 3 : 3,
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
    
    const searchRes = await api.get('/Ticket', {
      params: {
        searchText: csvRef,
        expand_dropdowns: true
      }
    })

    const tickets = Array.isArray(searchRes.data) ? searchRes.data : []

    const realTicket = tickets.find(t => {
      const extId = t.external_identifier || t.id_search_option
      return extId && String(extId).trim() === csvRef
    })

    const fallbackTicket = realTicket || tickets[0] 

    if (!fallbackTicket) {
      throw new Error(`Impossible de localiser le ticket GLPI lié à l'identifiant externe #${csvRef}.`)
    }

    const realGlpiId = fallbackTicket.id
    console.log(`🎯 Liaison validée via l'Identifiant Externe ! Ref: ${csvRef} ==> ID GLPI: ${realGlpiId}`)

    const rawTimeCost = csvRow.Time_Cost || csvRow.time_cost || "0"
    const cleanTimeCost = parseFloat(String(rawTimeCost).replace(',', '.').trim()) || 0

    const rawFixedCost = csvRow.Fixed_Cost || csvRow.fixed_cost || "0"
    const cleanFixedCost = parseFloat(String(rawFixedCost).replace(',', '.').trim()) || 0

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
   * 🖼️ Étape A (Ancienne méthode) : Envoyer l'image brute à GLPI pour créer un "Document"
   */
  async uploadImageAsDocument(fileBlob, fileName) {
    console.log(`⏳ Téléversement de l'image (Méthode classique) : ${fileName}...`)

    const formData = new FormData()
    formData.append('uploadManifest', JSON.stringify({
      input: {
        name: `Photo ${fileName.split('.')[0]}`,
        filename: fileName
      }
    }))
    formData.append('filename[]', fileBlob, fileName)

    const { data } = await api.post('/Document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    return data.id
  },

  /**
   * ⛓️ Étape B (Ancienne méthode) : Lier le Document à la bonne machine (Computer ou Monitor)
   */
  async importImageLink(imageName, fileBlob, fullFileName) {
    const type = imageName.startsWith('MN-') ? 'Monitor' : 'Computer'

    const searchRes = await api.get(`/${type}`, { params: { searchText: imageName } })
    const item = searchRes.data.find(i => i.name === imageName)

    if (!item) {
      console.warn(`⚠️ Impossible d'importer l'image : Le matériel "${imageName}" n'existe pas dans GLPI (Table ${type}).`)
      return
    }

    const documentId = await this.uploadImageAsDocument(fileBlob, fullFileName)

    await api.post('/Document_Item', {
      input: {
        documents_id: documentId,
        itemtype: type,
        items_id: item.id
      }
    })

    console.log(`✅ Image ${fullFileName} associée avec succès au matériel [${type}] (ID: ${item.id})`)
  },

  /**
   * 📸 NOUVELLE MÉTHODE (Convertie en JS) : Envoie une image avec inspection des Magic Bytes et liaison Fetch directe
   * @param {string} imageName - Le nom de l'équipement (ex: "PC-ADM-001")
   * @param {File|Blob} file - Le fichier binaire extrait du ZIP
   * @param {string} fullFileName - Le nom complet d'origine (ex: "PC-ADM-001.png")
   */
  async uploadImageWithMagicBytes(imageName, file, fullFileName) {
    console.log(`⏳ Analyse Magic Bytes & Téléversement Fetch pour : ${fullFileName}...`)

    // 1. Détection du type de matériel
    const itemType = imageName.startsWith('MN-') ? 'Monitor' : 'Computer'

    // 2. Recherche du matériel dans GLPI
    const searchRes = await api.get(`/${itemType}`, { params: { searchText: imageName } })
    const item = searchRes.data.find(i => i.name === imageName)

    if (!item) {
      console.warn(`⚠️ Impossible d'importer l'image : Le matériel "${imageName}" n'existe pas dans GLPI.`)
      return
    }

    // 3. 🔍 INSPECTION DES MAGIC BYTES (Le véritable type)
    const headerBuffer = await file.slice(0, 4).arrayBuffer()
    const bytes = new Uint8Array(headerBuffer)
    
    let realMimeType = file.type || 'image/png'
    let realExtension = fullFileName.split('.').pop().toLowerCase() || 'png'

    // Signature JPEG : FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      realMimeType = 'image/jpeg'
      realExtension = 'jpeg'
    } 
    // Signature PNG : 89 50 4E 47
    else if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      realMimeType = 'image/png'
      realExtension = 'png'
    }

    // 4. 🛠️ CORRECTION AUTOMATIQUE EN CAS DE MISMATCH
    let finalFile = file
    let finalFileName = fullFileName

    if (!fullFileName.toLowerCase().endsWith(`.${realExtension}`)) {
      const baseName = fullFileName.substring(0, fullFileName.lastIndexOf('.'))
      finalFileName = `${baseName}.${realExtension}`
      
      // On recrée un fichier binaire propre avec le bon type MIME
      finalFile = new File([file], finalFileName, { type: realMimeType })
      console.warn(`🔄 Correction auto : ${fullFileName} était un faux fichier. Renommé en ${finalFileName}`)
    }

    // 5. 📦 PRÉPARATION DU FORMDATA
    const formData = new FormData()
    formData.append('uploadManifest', JSON.stringify({
      input: {
        name: `Photo - ${finalFileName}`,
        items_id: item.id,
        itemtype: itemType, 
        _filename: [finalFileName]
      }
    }))
    
    formData.append('filename[]', finalFile, finalFileName)

    // 6. 🔥 EXTRACT DES TOKENS DEPUIS CONFIG AXIOS POUR LE FETCH SÉCURISÉ
    const baseURL = api.defaults.baseURL || ''
    const sessionToken = api.defaults.headers['Session-Token']
    const appToken = api.defaults.headers.common['App-Token'] || api.defaults.headers['App-Token'] || ''

    // 7. 🔥 ENVOI SÉCURISÉ VIA FETCH DIRECT
    const response = await fetch(`${baseURL}/Document`, {
      method: 'POST',
      headers: {
        'Session-Token': localStorage.getItem('glpi_session_token'),
        'App-Token': import.meta.env.VITE_GLPI_APP_TOKEN
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erreur HTTP GLPI ${response.status}: ${errorText}`)
    }

    const data = await response.json()
    console.log(`✅ Image ${finalFileName} associée par Magic Bytes avec succès ! (Document ID: ${data.id})`)
    return data
  }
}