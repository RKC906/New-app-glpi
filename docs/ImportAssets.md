<div class="mb-4 border p-3 rounded bg-light">
  <h5>Saisie manuelle d'un Équipement (Asset)</h5>
  <div class="row g-3">
    <div class="col-md-3">
      <label class="form-label small fw-bold">Type d'équipement</label>
      <select v-model="assetType" class="form-select">
        <option value="Computer">Ordinateur (Computer)</option>
        <option value="Monitor">Moniteur (Monitor)</option>
        <option value="Phone">Téléphone (Phone)</option>
        <option value="Printer">Imprimante (Printer)</option>
      </select>
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Nom / Réf</label>
      <input v-model="assetName" class="form-control" placeholder="ex: PC-ADM-005" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Modèle</label>
      <input v-model="assetModel" class="form-control" placeholder="ex: OptiPlex 7090" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Fabricant</label>
      <input v-model="assetManufacturer" class="form-control" placeholder="ex: Dell" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Emplacement</label>
      <input v-model="assetLocation" class="form-control" placeholder="ex: Bureau Direction" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Statut</label>
      <input v-model="assetStatus" class="form-control" placeholder="ex: OK / En stock" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">N° d'inventaire</label>
      <input v-model="assetInventory" class="form-control" placeholder="ex: INV-2026-01" />
    </div>

    <div class="col-md-3">
      <label class="form-label small fw-bold">Utilisateur / Contact</label>
      <input v-model="assetUser" class="form-control" placeholder="ex: Jean Dupont" />
    </div>

    <div class="col-12 text-end">
      <button @click="handleManualAssetClick" class="btn btn-success px-4">Créer l'équipement</button>
    </div>
  </div>
</div>

import { ref } from 'vue'
import { importService } from '@/services/importService'

// --- ÉTATS POUR LE FORMULAIRE ASSET ---
const assetType = ref('Computer') // Valeur par défaut
const assetName = ref('')
const assetModel = ref('')
const assetManufacturer = ref('')
const assetLocation = ref('')
const assetStatus = ref('')
const assetInventory = ref('')
const assetUser = ref('')

// Variable globale pour afficher le statut à l'écran
const result = ref('')

// --- HANDLER DE TRAITEMENT MANUEL ---
const handleManualAssetClick = async () => {
  // Validation minimale
  if (!assetName.value.trim()) {
    alert("Le nom de l'équipement est obligatoire.")
    return
  }

  result.value = "Création de l'équipement dans GLPI en cours..."

  try {
    // 📦 RECONSTITUTION DE L'OBJET : On imite exactement la structure d'une ligne de ton CSV
    const simulatedCsvRow = {
      Item_Type: assetType.value,
      Name: assetName.value.trim(),
      Model: assetModel.value.trim() || 'Generic Model',
      Manufacturer: assetManufacturer.value.trim() || 'Generic Manufacturer',
      Location: assetLocation.value.trim() || 'Non assigné',
      Status: assetStatus.value.trim() || 'Production',
      Inventory_Number: assetInventory.value.trim() || '',
      User: assetUser.value.trim() || ''
    }

    // Appel direct de ta fonction existante dans importService
    const createdAsset = await importService.importAssetRow(simulatedCsvRow)

    result.value = `🎉 Succès ! Équipement [${assetType.value}] "${assetName.value}" créé avec l'ID GLPI #${createdAsset.id}`

    // Réinitialisation des champs (sauf le type) après le succès
    assetName.value = ''
    assetModel.value = ''
    assetManufacturer.value = ''
    assetLocation.value = ''
    assetStatus.value = ''
    assetInventory.value = ''
    assetUser.value = ''

  } catch (error) {
    console.error("Erreur d'insertion manuelle :", error)
    result.value = `❌ Échec de la création : ${error.message || error}`
  }
}