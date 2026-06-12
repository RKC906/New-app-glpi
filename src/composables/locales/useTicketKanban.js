import { ref, reactive, watch, onMounted } from 'vue';
import { useTicketsManager } from '@/composables/useTicketsManager';
import { kanbanConfigService } from '@/services/locale/kanbanConfigService';
import { kanbanCostService } from '@/services/locale/kanbanCostService';

export function useTicketKanban() {
  const { tickets, isLoading, loadTickets, updateTicketStatus, selectTicket } = useTicketsManager();

  // États des Fenêtres Modales
  const showCreateModal = ref(false);
  const showDetailModal = ref(false);
  const showCostModal = ref(false);
  const showCancelModal = ref(false);
  const searchQuery = ref('');

  // États locaux temporaires lors d'une interception de résolution (Statut 5)
  const costInputAmount = ref(null);
  const costInputName = ref('Frais de résolution / Maintenance');
  const pendingMoveEvent = ref(null);
  const pendingTicket = ref(null);

  // Structure des colonnes par défaut du tableau
  const columnsConfig = ref([
    { id: 1, title: 'Nouveau', color: '#0ea5e9', bg: '#f0f9ff', textColor: '#0369a1', badgeBg: 'rgba(14, 165, 233, 0.15)' },
    { id: 2, title: 'En Cours', color: '#f59e0b', bg: '#fffaf0', textColor: '#b45309', badgeBg: 'rgba(245, 158, 11, 0.15)' },
    { id: 5, title: 'Résolu', color: '#10b981', bg: '#f0fdf4', textColor: '#15803d', badgeBg: 'rgba(16, 185, 129, 0.15)' }
  ]);

  // Listes réactives contenant les cartes réparties par colonne
  const boardLists = reactive({ 1: [], 2: [], 5: [] });

  /**
   * Recharge l'ensemble du tableau : Tickets GLPI + Configuration SQLite (Langue et Couleurs)
   */
  const refreshBoard = async () => {
    loadTickets();
    await loadCustomKanbanConfig();
  };

  /**
   * Lit et applique la configuration de style et de langue stockée dans SQLite
   */
  const loadCustomKanbanConfig = async () => {
    try {
      const config = await kanbanConfigService.fetchConfig();
      const activeLang = (config.currentLang || 'fr').toLowerCase().trim();

      columnsConfig.value = columnsConfig.value.map(column => {
        const customColor = config.colors.find(c => c.id_status === column.id);
        const customTrans = config.translations.find(t => {
          const tLang = (t.langue || '').toLowerCase().trim();
          return t.id_status === column.id && tLang === activeLang;
        });

        return {
          ...column,
          bg: customColor ? customColor.color : column.bg,
          title: customTrans ? customTrans.translation : column.title
        };
      });
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres SQLite:', error);
    }
  };

  /**
   * Filtre et répartit les tickets dans leurs colonnes Kanban respectives
   */
  const dispatchTicketsToBoard = () => {
    const filtered = tickets.value.filter(t => {
      const query = searchQuery.value.toLowerCase().trim();
      if (!query) return true;
      
      const matchesTitle = t.name ? t.name.toLowerCase().includes(query) : false;
      const matchesId = t.id ? t.id.toString().includes(query.replace('#', '')) : false;
      
      return matchesTitle || matchesId;
    });

    boardLists[1] = filtered.filter(t => parseInt(t.status) === 1);
    boardLists[2] = filtered.filter(t => parseInt(t.status) === 2 || parseInt(t.status) === 3);
    boardLists[5] = filtered.filter(t => parseInt(t.status) === 5 || parseInt(t.status) === 6);
  };

  // Synchronise la répartition dès que la liste GLPI ou la recherche changent
  watch([tickets, searchQuery], dispatchTicketsToBoard, { deep: true });

  /**
   * Intercepte ou exécute le déplacement d'une carte d'un statut à un autre
   */
  const handleCardMove = async (event, targetStatusId) => {
    if (!event.added) return;
    const targetTicket = event.added.element;

    // Interception si déplacement vers la colonne Résolu (ID 5)
    if (targetStatusId === 5) {
      pendingTicket.value = targetTicket;
      pendingMoveEvent.value = event;
      costInputAmount.value = null;
      showCostModal.value = true;
      return;
    }

        // Interception si déplacement vers la colonne Résolu (ID 5)
    else if (targetStatusId === 2) {
      pendingTicket.value = targetTicket;
      pendingMoveEvent.value = event;
      costInputAmount.value = null;
      showCancelModal.value = true;
      return;
    }

    // Comportement standard pour les autres statuts
    try {
      await updateTicketStatus(targetTicket.id, targetStatusId);
      targetTicket.status = targetStatusId;
    } catch (error) {
      refreshBoard();
    }
  };

  /**
   * Confirme le passage à Résolu, sauve dans SQLite puis met à jour GLPI
   */
  const confirmResolutionWithCost = async () => {
    if (!pendingTicket.value) return;

    try {
      const ticketId = pendingTicket.value.id;
      const amount = parseFloat(costInputAmount.value) || 0;

      // 1. Sauvegarde SQLite via notre nouveau service dédié
      await kanbanCostService.saveTicketCost({
        ticket_id: ticketId,
        amount: amount,
        label: costInputName.value,
        date: new Date().toISOString().slice(0, 10)
      });

      // 2. Clôture sur l'API GLPI
      await updateTicketStatus(ticketId, 5);
      pendingTicket.value.status = 5;

      // Reset des états
      showCostModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;

      alert("Ticket résolu et coût enregistré localement avec succès !");
    } catch (error) {
      alert("Une erreur est survenue lors de l'enregistrement.");
      refreshBoard(); // Annule le déplacement graphique en cas d'erreur backend
    }
  };

  /**
   * Annule la clôture du ticket et repositionne la carte
   */
  const cancelResolution = () => {
    showCostModal.value = false;
    pendingTicket.value = null;
    pendingMoveEvent.value = null;
    refreshBoard();
  };

    const cancelAnnulation = () => {
    showCancelModal.value = false;
    pendingTicket.value = null;
    pendingMoveEvent.value = null;
    refreshBoard();
  };

  const handleOpenDetails = async (ticket) => {
    showDetailModal.value = true;
    await selectTicket(ticket);
  };

  const handleTicketCreated = () => {
    showCreateModal.value = false;
    refreshBoard();
  };

    const confirmAnnulation = async () => {
    if (!pendingTicket.value) return;

    try {
      const ticketId = pendingTicket.value.id;
      await kanbanCostService.cancelCost({
        ticket_id: ticketId
      });
      await updateTicketStatus(ticketId, 2);
      pendingTicket.value.status = 2;
      showCancelModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;

      alert("Cout du ticket annulee !");
    } catch (error) {
      alert("Une erreur est survenue lors de l'annulation.");
      refreshBoard(); // Annule le déplacement graphique en cas d'erreur backend
    }
  };

  onMounted(refreshBoard);

  return {
    isLoading,
    showCreateModal,
    showDetailModal,
    showCostModal,
    showCancelModal,
    searchQuery,
    costInputAmount,
    costInputName,
    pendingTicket,
    columnsConfig,
    boardLists,
    refreshBoard,
    handleCardMove,
    confirmResolutionWithCost,
    cancelResolution,
    cancelAnnulation,
    handleOpenDetails,
    handleTicketCreated,
    confirmAnnulation
  };
}