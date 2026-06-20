<div class="mb-4 border p-3 rounded bg-light">
  <h5>Saisie manuelle d'un Ticket</h5>
  <div class="row g-3">
    <div class="col-md-2">
      <label class="form-label small fw-bold">Réf Ticket (ID Externe)</label>
      <input v-model="ticketRef" class="form-control" placeholder="ex: 3 ou T-100" />
    </div>

    <div class="col-md-5">
      <label class="form-label small fw-bold">Titre (Sujet)</label>
      <input v-model="ticketTitle" class="form-control" placeholder="ex: Écran noir au démarrage" />
    </div>

    <div class="col-md-2">
      <label class="form-label small fw-bold">Type</label>
      <select v-model="ticketType" class="form-select">
        <option value="Incident">Incident</option>
        <option value="Demande">Demande (Request)</option>
      </select>
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Statut</label>
      <select v-model="ticketStatus" class="form-select">
        <option value="New">Nouveau (New)</option>
        <option value="In progress">En cours</option>
        <option value="In progress">Efa manao</option>
        <option value="vita">Résolu (Vita)</option>
        <option value="closed">Clos</option>
      </select>
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Date</label>
      <input v-model="ticketDate" type="date" class="form-control" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Heure</label>
      <input v-model="ticketTime" type="time" class="form-control" />
    </div>

    <div class="col-md-6">
      <label class="form-label small fw-bold">Priorité</label>
      <select v-model="ticketPriority" class="form-select">
        <option value="Medium">Medium</option>
        <option value="High">Haute</option>
      </select>
    </div>

    <div class="col-12">
      <label class="form-label small fw-bold">Description du problème</label>
      <textarea v-model="ticketDesc" class="form-control" rows="3" placeholder="Détails de l'incident..."></textarea>
    </div>

    <div class="col-12">
      <label class="form-label small fw-bold">Matériels à lier (Séparés par des virgules)</label>
      <input v-model="ticketItems" class="form-control" placeholder="ex: PC-ADM-001, MN-FORM-002" />
      <div class="form-text text-muted">Ces équipements seront automatiquement recherchés et liés au ticket dans GLPI.</div>
    </div>

    <div class="col-12 text-end">
      <button @click="handleManualTicketClick" class="btn btn-primary px-4">Créer le ticket</button>
    </div>
  </div>
</div>


import { ref } from 'vue'
import { importService } from '@/services/importService'

// Obtenir la date et l'heure actuelle par défaut pour le formulaire
const today = new Date().toISOString().split('T')[0]
const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5)

// --- ÉTATS POUR LE FORMULAIRE TICKET ---
const ticketRef = ref('')
const ticketTitle = ref('')
const ticketType = ref('Incident')
const ticketStatus = ref('New')
const ticketDate = ref(today)
const ticketTime = ref(nowTime)
const ticketPriority = ref('Medium')
const ticketDesc = ref('')
const ticketItems = ref('') // Reçoit "PC-ADM-001, MN-FORM-002"

const result = ref('') // Variable de retour pour afficher les alertes/succès

// --- HANDLER DE TRAITEMENT ---
const handleManualTicketClick = async () => {
  // Validations obligatoires
  if (!ticketRef.value.trim() || !ticketTitle.value.trim()) {
    alert("La référence et le titre du ticket sont obligatoires.")
    return
  }

  result.value = "Création du ticket dans GLPI..."

  try {
    // 🛠️ ATTENTION PIÈGE 1 : Conversion de la date AAAA-MM-JJ vers JJ/MM/AAAA pour coller au code du CSV
    const [year, month, day] = ticketDate.value.split('-')
    const formattedDateForService = `${day}/${month}/${year}`

    // 🛠️ ATTENTION PIÈGE 2 : Conversion de la chaîne de caractères brute en chaîne JSON valide
    // "PC-1, MN-2" -> ["PC-1", "MN-2"] -> '["PC-1","MN-2"]'
    const itemsArray = ticketItems.value
      ? ticketItems.value.split(',').map(item => item.trim()).filter(Boolean)
      : []
    const jsonItemsString = itemsArray.length > 0 ? JSON.stringify(itemsArray) : ''

    // 📦 RECONSTITUTION PARFAITE DE LA LIGNE CSV EXPECTED
    const simulatedTicketRow = {
      Ref_Ticket: ticketRef.value.trim(),
      Date: formattedDateForService,
      Heure: ticketTime.value,
      Type: ticketType.value,
      Titre: ticketTitle.value.trim(),
      Description: ticketDesc.value.trim() || 'Aucune description fournie.',
      Status: ticketStatus.value,
      Priority: ticketPriority.value,
      Items: jsonItemsString // Transmis sous forme de chaîne JSON brute
    }

    // Appel direct à ta fonction d'importation existante
    const createdTicket = await importService.importTicketRow(simulatedTicketRow)

    result.value = `✅ Ticket créé avec succès ! ID GLPI : #${createdTicket.id}`

    // Nettoyage du formulaire après réussite
    ticketRef.value = ''
    ticketTitle.value = ''
    ticketDesc.value = ''
    ticketItems.value = ''
    ticketDate.value = today
    ticketTime.value = nowTime

  } catch (error) {
    console.error("Erreur insertion ticket :", error)
    result.value = `❌ Échec lors de la création du ticket : ${error.message || error}`
  }
}