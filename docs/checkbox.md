1. Côté Interface : Le composant Vue (ex: ImportManager.vue)
Dans le template de votre page d'importation, ajoutez la case à cocher juste à côté de votre bouton d'importation de fichier.

<template>
  <div class="import-container">
    <h3>Importation des Tickets</h3>
    
    <div class="option-row">
      <label class="checkbox-label">
        <input 
          type="checkbox" 
          v-model="skipItemsImport" 
          class="modern-checkbox"
        />
        <span>Ne pas importer ni lier les matériels (Items)</span>
      </label>
    </div>

    <button @click="startImport" :disabled="isImporting">
      {{ isImporting ? 'Importation...' : 'Lancer l'importation' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { importService } from '@/services/importService'

const isImporting = ref(false)

// 🌟 Variable réactive : vaut 'true' si cochée, 'false' sinon
const skipItemsImport = ref(false)

const startImport = async () => {
  try {
    isImporting.value = true
    
    // Exemple : supposons que vous bouclez sur les lignes de votre CSV
    for (const row of csvRows.value) {
      // 🚀 On passe la variable 'skipItemsImport' en deuxième paramètre
      await importService.importTicketRow(row, skipItemsImport.value)
    }
    
    alert('Importation terminée !')
  } catch (error) {
    alert('Erreur lors de l\'importation')
  } finally {
    isImporting.value = false
  }
}
</script>

<style scoped>
.option-row {
  margin-bottom: 20px;
}
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  color: #334155;
}
.modern-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>

2. Côté Logique : Le Service d'Importation (importService.js)

Modifiez la signature de votre fonction importTicketRow pour accepter ce nouveau paramètre (que nous appellerons skipItems). Il suffit ensuite de bloquer le script à l'aide d'un if avant que la section qui parse et lie les éléments ne s'exécute.

// 🌟 On ajoute le paramètre 'skipItems' à la fonction
async importTicketRow(row, skipItems = false) {
    console.log(`⏳ Traitement du ticket : "${row.Titre}"...`)

    const PREFIX_TO_MODULE = {
      'COM-': 'Computer',
      'MON-': 'Monitor',
      'PHO-': 'Phone'
    }

    const [day, month, year] = row.Date.split('/')
    const formattedDate = `${year}-${month}-${day} ${row.Heure}:00`

    const ticketInput = {
      input: {
        name: row.Titre,
        content: row.Description,
        date: formattedDate,
        type: row.Type.toLowerCase() === 'incident' ? 1 : 2,
        status: 1, // Ou votre logique de mapping dynamique
        priority: row.Priority.toLowerCase() === 'medium' ? 3 : 3,
        id_search_option: String(row.Ref_Ticket).trim(),
        external_identifier: String(row.Ref_Ticket).trim()
      }
    }

    // Création du ticket de base dans GLPI
    const { data } = await api.post('/Ticket', ticketInput)
    console.log(`✅ Ticket créé avec succès (ID GLPI: ${data.id})`)

    // 🚀 CONDITION BLOCK : Si la checkbox était cochée, on s'arrête ICI 
    // Le ticket est créé, mais on n'exécute PAS la recherche et la liaison des matériels.
    if (skipItems) {
      console.log(`⏭️ Option cochée : Liaison des matériels ignorée pour ce ticket.`)
      return data
    }

    // Si la case n'est pas cochée, le code continue normalement en dessous :
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
}

