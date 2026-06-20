<div class="mb-4 border p-3 rounded bg-light">
  <h5>Saisie manuelle d'un Coût de Ticket</h5>
  <div class="row g-3">
    <div class="col-md-3">
      <label class="form-label small fw-bold">Numéro / Réf du Ticket</label>
      <input v-model="costTicketRef" class="form-control" placeholder="ex: 1 ou T-100" />
      <div class="form-text text-muted">Doit correspondre à l'ID externe utilisé à la création.</div>
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Durée de l'action (en minutes)</label>
      <input v-model.number="costDurationMinutes" type="number" class="form-control" placeholder="ex: 45" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Coût horaire / temps (€)</label>
      <input v-model="costTime" class="form-control" placeholder="ex: 25.50" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Coût fixe (€)</label>
      <input v-model="costFixed" class="form-control" placeholder="ex: 120" />
    </div>

    <div class="col-12 text-end">
      <button @click="handleManualCostClick" class="btn btn-warning px-4 fw-bold">Enregistrer le coût</button>
    </div>
  </div>
</div>

import { ref } from 'vue'
import { importService } from '@/services/importService'

// --- ÉTATS POUR LE FORMULAIRE DE COÛT ---
const costTicketRef = ref('')
const costDurationMinutes = ref('')
const costTime = ref('0')
const costFixed = ref('0')

const result = ref('') // Utilise ton état de notification existant

// --- HANDLER DE TRAITEMENT MANUEL DES COÛTS ---
const handleManualCostClick = async () => {
  // Validations de sécurité de base
  if (!costTicketRef.value.trim()) {
    alert("La référence du ticket est obligatoire pour appliquer un coût.")
    return
  }

  result.value = "Recherche du ticket GLPI et calcul du coût..."

  try {
    // 🛠️ Conversion des minutes saisies en secondes pour correspondre au CSV/GLPI
    const minutes = parseFloat(costDurationMinutes.value) || 0
    const durationInSeconds = Math.round(minutes * 60)

    // 📦 RECONSTITUTION DE LA LIGNE CSV ATTENDUE PAR importTicketCostRow
    const simulatedCostRow = {
      Num_Ticket: costTicketRef.value.trim(),
      Duration_second: durationInSeconds,
      Time_Cost: String(costTime.value).trim(),
      Fixed_Cost: String(costFixed.value).trim()
    }

    // Appel direct de ton service existant
    await importService.importTicketCostRow(simulatedCostRow)

    result.value = `🎯 Coût associé avec succès au ticket ayant l'identifiant externe #${costTicketRef.value} !`

    // Réinitialisation du formulaire
    costTicketRef.value = ''
    costDurationMinutes.value = ''
    costTime.value = '0'
    costFixed.value = '0'

  } catch (error) {
    console.error("Erreur insertion coût manuel :", error)
    result.value = `❌ Échec du traitement du coût : ${error.message || error}`
  }
}