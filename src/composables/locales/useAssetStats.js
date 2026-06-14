import { ref, onMounted } from 'vue';
import axios from 'axios';
import { dashboardService } from '@/services/dashboardService';

export function useAssetStats() {
  const categoriesReport = ref([]);
  const loading = ref(false);
  const errorMsg = ref(null);

  const typeMapping = {
    Computer: '💻 Ordinateurs',
    Printer: '🖨️ Imprimantes',
    Monitor: '🖥️ Écrans / Moniteurs',
    NetworkEquipment: '🌐 Équipements Réseau',
    Peripheral: '🖱️ Périphériques (Souris, Claviers...)',
    Software: '💿 Logiciels / Licences',
    Phone: '📞 Téléphonie'
  };

  const buildReport = async () => {
    loading.value = true;
    errorMsg.value = null;
    const tempMap = new Map();

    try {
      // 1. Récupération de TOUS les coûts SQLite locaux (avec leurs labels)
      const localRes = await axios.get('http://localhost:3005/api/kanban/costs/all');
      const localCosts = localRes.data || [];

      // 2. Récupérer la liste des tickets GLPI
      const allTickets = await dashboardService.getTicketsList();

      // 3. Parcours complet des tickets pour ventiler
      for (const ticket of allTickets) {
        const links = ticket._items || ticket.linked_hardware || [];

        // 🛠️ On filtre toutes les lignes de coûts SQLite appartenant à CE ticket précis
        const ticketLocalRows = localCosts.filter(c => String(c.ticket_id) === String(ticket.id));

        // Séparateurs de coûts cumulés pour ce ticket
        let totalSqliteMaintenance = 0;
        let totalSqliteReouverture = 0;

        ticketLocalRows.forEach(row => {
          if (row.label === 'Réouverture') {
            totalSqliteReouverture += Number(row.amount) || 0;
          } else {
            totalSqliteMaintenance += Number(row.amount) || 0;
          }
        });

        // Calcul de la part GLPI (TicketCost natif)
        let totalGlpi = 0;
        if (ticket._costs && Array.isArray(ticket._costs)) {
          totalGlpi = ticket._costs.reduce((sum, c) => sum + (parseFloat(c.cost_time) || 0) + (parseFloat(c.cost_fixed) || 0), 0);
        }

        if (links.length > 0) {
          // Division équitable s'il y a plusieurs matériels sur le ticket
          const glpiShare = totalGlpi / links.length;
          const sqliteMaintShare = totalSqliteMaintenance / links.length;
          const sqliteReopenShare = totalSqliteReouverture / links.length;

          for (const link of links) {
            const type = link.itemtype;

            if (tempMap.has(type)) {
              const cat = tempMap.get(type);
              cat.glpiCost += glpiShare;
              cat.sqliteCost += sqliteMaintShare;
              cat.reopenCost += sqliteReopenShare; // 🛠️ Ajout
              cat.ticketsCount += 1;
              cat.distinctItems.add(link.items_id);
            } else {
              tempMap.set(type, {
                glpiCost: glpiShare,
                sqliteCost: sqliteMaintShare,
                reopenCost: sqliteReopenShare, // 🛠️ Initialisation
                ticketsCount: 1,
                distinctItems: new Set([link.items_id])
              });
            }
          }
        } else {
          // Fallback : Main d’œuvre / Sans Asset
          const type = 'Main d’œuvre / Sans Asset';
          if (tempMap.has(type)) {
            const cat = tempMap.get(type);
            cat.glpiCost += totalGlpi;
            cat.sqliteCost += totalSqliteMaintenance;
            cat.reopenCost += totalSqliteReouverture;
            cat.ticketsCount += 1;
          } else {
            tempMap.set(type, {
              glpiCost: totalGlpi,
              sqliteCost: totalSqliteMaintenance,
              reopenCost: totalSqliteReouverture,
              ticketsCount: 1,
              distinctItems: new Set()
            });
          }
        }
      }

      // 4. Conversion et formatage final avec prise en compte du coût de réouverture
      categoriesReport.value = Array.from(tempMap.entries()).map(([type, data]) => ({
        itemType: type,
        displayName: typeMapping[type] || `📦 ${type}`,
        glpiCost: data.glpiCost,
        sqliteCost: data.sqliteCost,
        reopenCost: data.reopenCost, // 🛠️ Injecté dans l'objet final
        totalCost: data.glpiCost + data.sqliteCost + data.reopenCost, // Somme globale
        ticketsCount: data.ticketsCount,
        uniqueItemsCount: data.distinctItems.size
      })).sort((a, b) => b.totalCost - a.totalCost);

    } catch (error) {
      console.error("❌ Erreur lors de la génération du rapport :", error);
      errorMsg.value = "Une erreur est survenue lors du calcul de la balance financière.";
    } finally {
      loading.value = false;
    }
  };

  const refreshStats = () => buildReport();

  onMounted(buildReport);

  return { categoriesReport, loading, errorMsg, refreshStats };
}
