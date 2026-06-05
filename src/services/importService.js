import api from './api'



export const importService = {
  /**
   * 🔍 Fonction générique "Chercher ou Créer" pour un dropdown GLPI
   * @param {string} endpoint - L'endpoint GLPI (ex: 'Manufacturer', 'Location')
   * @param {string} valueName - Le texte recherché (ex: 'Dell', 'Administration')
   * @returns {Promise<number>} - L'ID de l'élément trouvé ou créé
   */
  async findOrCreateDropdownItem(endpoint, valueName) {
    if (!valueName || !valueName.trim()) return 0; // Si le champ est vide dans le CSV

    const cleanName = valueName.trim()

    try {
      // 1. On cherche si l'élément existe déjà
      const response = await api.get(`/${endpoint}`, {
        params: {
          searchText: cleanName
        }
      })

      // GLPI renvoie un tableau. On cherche une correspondance exacte
      const foundItem = response.data.find(item => item.name.toLowerCase() === cleanName.toLowerCase())

      if (foundItem) {
        return foundItem.id // 🎉 Trouvé ! On retourne l'ID existant
      }

      // 2. Si non trouvé, on le crée dans le dropdown de GLPI
      console.log(`✨ [${endpoint}] '${cleanName}' n'existe pas. Création...`)
      const createResponse = await api.post(`/${endpoint}`, {
        input: {
          name: cleanName
        }
      })

      return createResponse.data.id // 🚀 Retourne le nouvel ID créé par GLPI

    } catch (error) {
      console.error(`Erreur findOrCreate sur ${endpoint} pour '${cleanName}':`, error)
      return 0 // En cas d'erreur, on retourne 0 (valeur vide dans GLPI)
    }
  },

  /**
   * 🖥️ Importation d'une ligne de Computer (Fichier CSV 1)
   * @param {Object} csvRow - Un objet représentant une ligne du CSV
   */
  async importComputerRow(csvRow) {
    console.log(`⏳ Traitement de la machine : ${csvRow.Name}...`)

    // 1. On convertit tous les textes du CSV en IDs GLPI en parallèle
    const [
      locations_id,
      manufacturers_id,
      computermodels_id,
      states_id,
      users_id
    ] = await Promise.all([
      this.findOrCreateDropdownItem('Location', csvRow.Location),
      this.findOrCreateDropdownItem('Manufacturer', csvRow.Manufacturer),
      this.findOrCreateDropdownItem('ComputerModel', csvRow.Model),
      this.findOrCreateDropdownItem('State', csvRow.Status),
      this.findOrCreateDropdownItem('User', csvRow.User)
    ])

    // 2. On prépare l'objet final attendu par l'API GLPI
    const computerInput = {
      input: {
        name: csvRow.Name,
        locations_id: locations_id,
        manufacturers_id: manufacturers_id,
        computermodels_id: computermodels_id,
        states_id: states_id,
        users_id: users_id,
        otherserial: csvRow.Inventory_Number // On mappe le numéro d'inventaire ici
      }
    }

    // 3. Envoi final à la table des ordinateurs
    const response = await api.post('/Computer', computerInput)
    console.log(`✅ Machine ${csvRow.Name} importée avec succès avec l'ID GLPI : ${response.data.id}`)
    return response.data
  },


    /**
   * 🎫 Importation d'une ligne de Ticket (Fichier CSV 2)
   * @param {Object} row - Ligne du CSV issue de PapaParse
   */
  async importTicketRow(row) {
    console.log(`⏳ Traitement du ticket : "${row.Titre}"...`)

    // 1. Reformatage de la date FR (DD/MM/YYYY) vers le format GLPI (YYYY-MM-DD HH:MM:SS)
    const [day, month, year] = row.Date.split('/')
    const formattedDate = `${year}-${month}-${day} ${row.Heure}:00`

    // 2. Préparation de l'objet Ticket principal
    const ticketInput = {
      input: {
        name: row.Titre,
        content: row.Description,
        date: formattedDate,
        type: row.Type.toLowerCase() === 'incident' ? 1 : 2, // 1 = Incident, 2 = Demande
        status: 1,   // 1 = Nouveau (Default GLPI)
        priority: 3  // 3 = Moyenne / Medium
      }
    }

    // 3. Création du Ticket dans GLPI
    const { data } = await api.post('/Ticket', ticketInput)
    const newTicketId = data.id
    console.log(`✅ Ticket créé avec succès (ID GLPI: ${newTicketId})`)

    // 4. Si aucun matériel n'est associé, on s'arrête là
    if (!row.Items) return data

    try {
      // Extraction et transformation de la chaîne JSON du CSV en vrai tableau JS
      const itemNames = JSON.parse(row.Items)

      for (const name of itemNames) {
        // Détection du préfixe (ex: extrait "PC-" depuis "PC-ADM-001")
        const prefix = name.split('-')[0] + '-' 
        const type = PREFIX_TO_MODULE[prefix] || 'Computer' // 'Computer' par défaut si inconnu

        // 🔍 Recherche de l'ID de l'élément dans GLPI
        const searchRes = await api.get(`/${type}`, { params: { searchText: name } })
        const item = searchRes.data.find(i => i.name === name)

        if (item) {
          // ⛓️ Création de la liaison dans la table intermédiaire Item_Ticket
          await api.post('/Item_Ticket', {
            input: { 
              tickets_id: newTicketId, 
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
   * 💰 Importation d'une ligne de Coût de Ticket (Fichier CSV 3)
   */
  async importTicketCostRow(row) {
    console.log(`⏳ Ajout de coût pour le Ticket Numéro : ${row.Num_Ticket}...`)

    // 1. Nettoyage et formatage des données numériques
    const cleanTimeCost = row.Time_Cost ? parseFloat(row.Time_Cost.toString().replace(',', '.')) : 0
    const cleanFixedCost = row.Fixed_Cost ? parseFloat(row.Fixed_Cost) : 0

    const costInput = {
      input: {
        tickets_id: parseInt(row.Num_Ticket), // Liaison au ticket parent
        actiontime: parseInt(row.Duration_second) || 0, // Temps en secondes
        cost_time: cleanTimeCost,
        cost_fixed: cleanFixedCost,
        name: `Coût importé automatiquement` // Petit libellé optionnel requis par GLPI
      }
    }

    // 2. Envoi à l'API GLPI sur l'endpoint TicketCost
    const { data } = await api.post('/TicketCost', costInput)
    console.log(`✅ Ligne de coût ajoutée avec succès (ID Coût GLPI: ${data.id})`)
    
    return data
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