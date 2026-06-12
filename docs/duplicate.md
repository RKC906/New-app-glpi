Étape 1 : Créer la fonction de duplication dans vos services (ticketService.js)

import api from '@/services/api' // Votre instance Axios

export const ticketService = {
  // ... vos autres fonctions (getTickets, etc.) ...

  async duplicateTicket(ticketId) {
    try {
      console.log(`⏳ Début de la duplication du ticket ID: ${ticketId}...`)

      // 1. Récupérer les détails du ticket d'origine depuis GLPI
      const { data: originalTicket } = await api.get(`/Ticket/${ticketId}`)

      // 2. Préparer les données pour le nouveau ticket
      const duplicatedInput = {
        input: {
          name: `[Copie] ${originalTicket.name}`, // Ajoute [Copie] pour les différencier, ou juste originalTicket.name
          content: originalTicket.content,
          type: originalTicket.type,
          status: originalTicket.status,
          priority: originalTicket.priority,
          // On conserve l'identifiant externe si besoin, ou on le laisse vide pour éviter les doublons stricts
          external_identifier: originalTicket.external_identifier ? `${originalTicket.external_identifier}-COPY` : null,
          id_search_option: originalTicket.id_search_option ? `${originalTicket.id_search_option}-COPY` : null,
        }
      }

      // 3. Créer le nouveau ticket dans GLPI
      const { data: newTicketRes } = await api.post('/Ticket', duplicatedInput)
      const newTicketId = newTicketRes.id
      console.log(`✅ Nouveau ticket créé avec l'ID GLPI: ${newTicketId}`)

      // 4. (Optionnel) Dupliquer les liaisons de matériels (Item_Ticket)
      try {
        // On récupère les matériels liés au ticket d'origine
        const { data: linkedItems } = await api.get(`/Ticket/${ticketId}/Item_Ticket`)
        
        if (linkedItems && linkedItems.length > 0) {
          console.log(`🔗 Copie de ${linkedItems.length} matériel(s) lié(s)...`)
          
          for (const link of linkedItems) {
            await api.post('/Item_Ticket', {
              input: {
                tickets_id: newTicketId,
                itemtype: link.itemtype,
                items_id: link.items_id
              }
            })
          }
          console.log(`✅ Tous les matériels ont été liés au nouveau ticket.`)
        }
      } catch (itemError) {
        // On met un warning mais on ne bloque pas si le ticket n'avait pas de matériels
        console.warn("⚠️ Pas de matériels liés ou erreur lors de la copie des liaisons :", itemError.message)
      }

      return newTicketId // On retourne l'ID du nouveau ticket dupliqué

    } catch (error) {
      console.error("❌ Erreur lors de la duplication du ticket :", error)
      throw error
    }
  }
}

Étape 2 : Ajouter le bouton de duplication dans votre composant Vue
<!-- Dans votre template, à côté de chaque ticket ou dans les actions d'un ticket -->
<button 
  @click="handleDuplicate(ticket.id)" 
  class="btn-duplicate" 
  title="Dupliquer ce ticket"
>
  📋 Dupliquer
</button>

Et dans votre section <script setup> :
import { ticketService } from '@/services/ticketService'
import { ref } from 'vue'

// Si vous avez une fonction pour recharger la liste des tickets après une action
const emit = defineEmits(['refresh']) 
// Ou si votre fonction de rafraîchissement est locale :
// const loadTickets = async () => { ... }

const isDuplicating = ref(false)

const handleDuplicate = async (ticketId) => {
  // Demander confirmation à l'utilisateur (optionnel mais sécurisant)
  if (!confirm("Voulez-vous vraiment dupliquer ce ticket ?")) return

  try {
    isDuplicating.value = true
    
    // Appel du service de duplication
    const newId = await ticketService.duplicateTicket(ticketId)
    
    alert(`Le ticket a été dupliqué avec succès ! (Nouvel ID : ${newId})`)
    
    // 🔄 Rafraîchir l'affichage (recharger les tickets du Kanban ou de la liste)
    // loadTickets() 
    // ou emit('refresh')
    
  } catch (error) {
    alert("Une erreur est survenue lors de la duplication du ticket.")
  } finally {
    isDuplicating.value = false
  }
}