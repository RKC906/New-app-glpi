<template>
  <div class="container py-5">
    <div class="card shadow-sm p-4">
      <h3 class="mb-4">Traitement des données</h3>

      <div class="mb-4">
        <h5>Saisie manuelle</h5>
        <div class="row g-2">
        <div class="col">
          <select v-model="selectedTicketId" class="form-select">
            <option value="" disabled>Sélectionner un ticket...</option>
            <option v-for="t in ticketList" :key="t.id" :value="t.id">
              #{{ t.id }} - {{ t.name }}
            </option>
          </select>
        </div>     
        <div>
             <select v-model="inputB" class="form-select">
            <option value="" disabled>Sélectionner un Mouvement</option>
            <option value="close">Close</option>
            <option value="open">Open</option>
            <option value="cancel">Cancel</option>
          </select>
        </div>     
            <div class="col"><input v-model="inputC" class="form-control" placeholder="Pourcentage/amount" /></div>
            <div class="col-auto">
            <button @click="handleManualClick" class="btn btn-primary">Traiter</button>
          </div>
        </div>
      </div>

      <hr />

      <div class="mb-4">
        <h5>Importation CSV</h5>
            <ImportMvt />
      </div>

      <div v-if="result" class="alert alert-info mt-3">
        <strong>Résultat :</strong> {{ result }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'
import { importService } from '@/services/importService'
import { kanbanCostService } from '@/services/locale/kanbanCostService';
import { dashboardService } from '@/services/dashboardService'
import ImportMvt from '@/components/import/ImportMvt.vue';

const inputA = ref('')
const inputB = ref('')
const inputC = ref('')
const result = ref('')
const ticketList = ref([]) 
const selectedTicketId = ref('')

const isImporting = ref(false)
const currentProgress = ref(0)
const totalRows = ref(0)

// --- LA SOURCE DE VÉRITÉ (Logique métier) ---
const processData = async (a, b, c) => {
  try {
    const ticketId = parseInt(a);
    const mvt = String(b).toLowerCase().trim();
    const amount = parseFloat(String(c).replace(',', '.').trim()) || 0;

    if (isNaN(ticketId)) throw new Error(`ID Ticket invalide pour : ${a}`);
    
    if (mvt === 'open') {
        // Envoie le pourcentage au backend
        await kanbanCostService.reopenTicketCost({
            ticketId: ticketId,
            ticket_id: ticketId,
            percentage: amount 
        });
        return `Succès : Réouverture à ${amount}% pour le ticket #${ticketId}`;
    }
    else if (mvt === 'close') {
        await kanbanCostService.saveTicketCost({
            ticket_id: ticketId,
            ticketId: ticketId,
            amount: amount,
            label: "Insertion via Import",
            date: new Date().toISOString()
        });
        return `Succès : Coût de ${amount}€ enregistré pour le ticket #${ticketId}`;
    }
    else if (mvt === 'cancel') {
        await kanbanCostService.cancelCost({
            ticketId: ticketId,
            ticket_id: ticketId
        });
        return `Succès : Annulation effectuée pour le ticket #${ticketId}`;
    }
    return "Mouvement inconnu";
  } catch (error) {
    console.error("Erreur import :", error);
    return `Erreur : ${error.message}`;
  }
};

onMounted(async () => {
  try {
    const data = await dashboardService.getTicketsList();
    ticketList.value = data;
  } catch (err) {
    console.error("Impossible de charger la liste des tickets", err);
  }
});

// Adapter le handleManualClick
const handleManualClick = async () => {
  if (!selectedTicketId.value) {
    alert("Veuillez choisir un ticket dans la liste.");
    return;
  }

  result.value = "Traitement en cours...";
  
  // Ici, selectedTicketId contient déjà le VRAI ID numérique
  const message = await processData(selectedTicketId.value, inputB.value, inputC.value);
  
  result.value = message;
  
  if (message.startsWith('Succès')) {
    selectedTicketId.value = '';
    inputB.value = '';
    inputC.value = '';
  }
};

// --- C. HANDLERS ---

// const handleFileImport = async (event) => {
//   const file = event.target.files[0];
//   if (!file) return;

//   const reader = new FileReader();
//   reader.onload = async (e) => {
//     // 1. Découper en lignes
//     const lines = e.target.result.split('\n');

//     // 2. Boucler sur les lignes (on commence à 1 pour ignorer le header)
//     for (let i = 1; i < lines.length; i++) {
//       const line = lines[i].trim();
//       if (!line) continue; // Ignorer les lignes vides

//       const parts = line.split(','); // [ticket, mvt, valeur]
      
//       const ticketId = parts[0];
//       const label = parts[1] || 'Sans label';
//       const amount = parts[2] || '0'; // Si pas de 3ème colonne, on met 0

//       // 3. Appel de la logique métier pour CHAQUE ligne
//       await processData(ticketId, label, amount);
//     }
    
//     result.value = "Importation terminée !";
//   };
//   reader.readAsText(file);
// };

// const handleFileUpload = (event) => {
//   const file = event.target.files[0]
//   if (!file) return

//   isImporting.value = true

//   Papa.parse(file, {
//     header: true,
//     skipEmptyLines: true,
//     complete: async (results) => {
//       const rows = results.data
//       totalRows.value = rows.length
//       currentProgress.value = 0
      
//       let errorCount = 0 // Compteur pour suivre les lignes en échec

//       // 🔄 On parcourt les lignes
//       for (const row of rows) {
//         try {
//           // Le try/catch interne protège la continuité de la boucle
//           await importService.ImportmvtTickets(row)
//         } catch (error) {
//           errorCount++
//           console.error(`❌ Erreur sur la ligne du ticket #${row.ticket} (${row.mvt}) :`, error.message || error)
//         } finally {
//           // On incrémente la barre de progression quoi qu'il arrive
//           currentProgress.value++
//         }
//       }

//       // 📢 Bilan de l'importation à l'utilisateur
//       isImporting.value = false
      
//       if (errorCount === 0) {
//         alert("🎉 Félicitations ! Tout le fichier mvt a été importé proprement dans SQLite !")
//       } else if (errorCount < totalRows.value) {
//         alert(`⚠️ Importation partielle terminée.\n\n${totalRows.value - errorCount} lignes importées avec succès.\n${errorCount} lignes ont échoué (consultez la console F12).`)
//       } else {
//         alert("❌ L'importation a complètement échoué. Toutes les lignes ont généré une erreur.")
//       }
//     }
//   })
// };
</script>