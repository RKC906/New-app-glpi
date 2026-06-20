import { ref, onMounted } from 'vue';
import api from '@/services/api'; 
import axios from 'axios'; 
import { dashboardService } from '@/services/dashboardService'; 

export function useAssetStats() {
  const categoriesReport = ref([]);
  const loading = ref(false);
  const errorMsg = ref(null);
  const costMod = ref(''); // Servira de filtre dynamique ('', '1', '2', '3', '4')

  const typeMapping = {
    Computer: 'Ordinateurs',
    Printer: 'Imprimantes',
    Monitor: 'Moniteurs',
    NetworkEquipment: 'Équipements Réseau',
    Peripheral: 'Périphériques (Souris, Claviers...)',
    Software: 'Logiciels / Licences',
    Phone: 'Téléphonie'
  };

  const buildReport = async () => {
    loading.value = true;
    errorMsg.value = null;
    const tempMap = new Map();

    try {
      // 1. Un seul appel API local suffit pour centraliser l'historique SQLite
      const localRes = await axios.get('http://localhost:3005/api/kanban/costs/all');
      const localCosts = localRes.data || [];
      const allTickets = await dashboardService.getTicketsList();

      for (const ticket of allTickets) {
        const assetsRes = await api.get(`/Ticket/${ticket.id}/Item_Ticket`);
        const links = Array.isArray(assetsRes.data) ? assetsRes.data : [];
        if (links.length === 0) continue; 

        const costsRes = await api.get(`/Ticket/${ticket.id}/TicketCost`);
        const glpiCostsList = Array.isArray(costsRes.data) ? costsRes.data : [];
        
        const ticketGlpiTotal = glpiCostsList.reduce((sum, c) => {
          const fixed = Number(c.cost_fixed) || 0;
          const material = Number(c.cost_material) || 0;
          const timeCost = ((Number(c.actiontime) || 0) * (Number(c.cost_time) || 0)) / 3600;
          return sum + fixed + material + timeCost;
        }, 0);

        // 2. Remplacement de const par LET pour permettre l'assignation légitime
        let ticketSqliteRegular = 0;
        let ticketSqliteReopen = 0;

        // On isole d'abord les lignes de coûts propres à CE ticket précis
        const ticketCosts = localCosts.filter(c => String(c.ticket_id) === String(ticket.id));

        // Calcul des coûts classiques (hors réouverture)
        ticketSqliteRegular = ticketCosts
          .filter(c => !(c.label || '').toLowerCase().includes('réouverture'))
          .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

        // Calcul des surcoûts de réouverture (avec filtrage intelligent du Mode si costMod est défini)
        ticketSqliteReopen = ticketCosts
          .filter(c => {
            const isReopen = (c.label || '').toLowerCase().includes('réouverture');
            // Si l'utilisateur filtre sur un mode (ex: '3'), on vérifie si le label SQLite généré contient "Mode 3"
            if (costMod.value && isReopen) {
              return (c.label || '').includes(`Mode ${costMod.value}`);
            }
            return isReopen;
          })
          .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

        const itemCount = links.length;
        const glpiShare = ticketGlpiTotal / itemCount;
        const sqliteShare = ticketSqliteRegular / itemCount;
        const reopenShare = ticketSqliteReopen / itemCount;

        for (const link of links) {
          const type = link.itemtype;
          if (tempMap.has(type)) {
            const cat = tempMap.get(type);
            cat.glpiCost += glpiShare;
            cat.sqliteCost += sqliteShare;
            cat.reopenCost += reopenShare;
            cat.ticketsCount += 1;
            cat.distinctItems.add(link.items_id);
          } else {
            tempMap.set(type, {
              glpiCost: glpiShare,
              sqliteCost: sqliteShare,
              reopenCost: reopenShare,
              ticketsCount: 1,
              distinctItems: new Set([link.items_id])
            });
          }
        }
      }

      categoriesReport.value = Array.from(tempMap.entries()).map(([type, data]) => ({
        itemType: type,
        displayName: typeMapping[type] || `📦 ${type} (Autre)`,
        glpiCost: data.glpiCost,
        sqliteCost: data.sqliteCost,
        reopenCost: data.reopenCost,
        totalCost: data.glpiCost + data.sqliteCost + data.reopenCost,
        ticketsCount: data.ticketsCount,
        uniqueItemsCount: data.distinctItems.size
      })).sort((a, b) => b.totalCost - a.totalCost);

    } catch (error) {
      console.error("❌ Erreur rapport :", error);
      errorMsg.value = "Une erreur est survenue lors du calcul de la balance financière.";
    } finally {
      loading.value = false;
    }
  };

  onMounted(buildReport);
  return { categoriesReport, loading, errorMsg, costMod, refreshStats: buildReport };
}