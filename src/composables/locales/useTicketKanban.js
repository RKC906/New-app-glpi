import { ref, reactive, watch, onMounted } from 'vue';
import { useTicketsManager } from '@/composables/useTicketsManager';
import { kanbanConfigService } from '@/services/locale/kanbanConfigService';
import { kanbanCostService } from '@/services/locale/kanbanCostService';

export function useTicketKanban() {
  const { tickets, isLoading, loadTickets, updateTicketStatus, selectTicket } = useTicketsManager();

  const showCreateModal = ref(false);
  const showDetailModal = ref(false);
  const showCostModal = ref(false);
  const showCancelModal = ref(false);
  const searchQuery = ref('');

  const costInputAmount = ref(null);
  const costInputName = ref('Frais de résolution / Maintenance');
  const reopenPercentage = ref(null); // Variable liée au champ de pourcentage
  const pendingMoveEvent = ref(null);
  const pendingTicket = ref(null);

  const columnsConfig = ref([
    { id: 1, title: 'Nouveau', color: '#0ea5e9', bg: '#f0f9ff', textColor: '#0369a1', badgeBg: 'rgba(14, 165, 233, 0.15)' },
    { id: 2, title: 'En Cours', color: '#f59e0b', bg: '#fffaf0', textColor: '#b45309', badgeBg: 'rgba(245, 158, 11, 0.15)' },
    { id: 5, title: 'Résolu', color: '#10b981', bg: '#f0fdf4', textColor: '#15803d', badgeBg: 'rgba(16, 185, 129, 0.15)' }
  ]);

  const boardLists = reactive({ 1: [], 2: [], 5: [] });

  const refreshBoard = async () => {
    loadTickets();
    await loadCustomKanbanConfig();
  };

  const loadCustomKanbanConfig = async () => {
    try {
      const config = await kanbanConfigService.fetchConfig();
      const activeLang = (config.currentLang || 'fr').toLowerCase().trim();
      columnsConfig.value = columnsConfig.value.map(column => {
        const customColor = config.colors.find(c => c.id_status === column.id);
        const customTrans = config.translations.find(t => (t.langue || '').toLowerCase().trim() === activeLang && t.id_status === column.id);
        return {
          ...column,
          bg: customColor ? customColor.color : column.bg,
          title: customTrans ? customTrans.translation : column.title
        };
      });
    } catch (error) {
      console.error('Erreur paramètres SQLite:', error);
    }
  };

  const dispatchTicketsToBoard = () => {
    const filtered = tickets.value.filter(t => {
      const query = searchQuery.value.toLowerCase().trim();
      if (!query) return true;
      return (t.name && t.name.toLowerCase().includes(query)) || (t.id && t.id.toString().includes(query.replace('#', '')));
    });
    boardLists[1] = filtered.filter(t => parseInt(t.status) === 1);
    boardLists[2] = filtered.filter(t => parseInt(t.status) === 2 || parseInt(t.status) === 3);
    boardLists[5] = filtered.filter(t => parseInt(t.status) === 5 || parseInt(t.status) === 6);
  };

  watch([tickets, searchQuery], dispatchTicketsToBoard, { deep: true });

  const handleCardMove = async (event, targetStatusId) => {
    if (!event.added) return;
    const targetTicket = event.added.element;

    if (targetStatusId === 5) {
      pendingTicket.value = targetTicket;
      pendingMoveEvent.value = event;
      costInputAmount.value = null;
      showCostModal.value = true;
      return;
    } 
    // Interception : Transfert de Résolu (5) vers En Cours (2)
    else if (targetStatusId === 2) {
      if (parseInt(targetTicket.status) === 5) {
        pendingTicket.value = targetTicket;
        pendingMoveEvent.value = event;
        reopenPercentage.value = null;
        showCancelModal.value = true;
        return;
      }
    }

    try {
      await updateTicketStatus(targetTicket.id, targetStatusId);
      targetTicket.status = targetStatusId;
    } catch (error) {
      refreshBoard();
    }
  };

  const confirmResolutionWithCost = async () => {
    if (!pendingTicket.value) return;
    try {
      const ticketId = pendingTicket.value.id;
      await kanbanCostService.saveTicketCost({
        ticket_id: ticketId,
        amount: parseFloat(costInputAmount.value) || 0,
        label: costInputName.value,
        date: new Date().toISOString().slice(0, 10)
      });
      await updateTicketStatus(ticketId, 5);
      pendingTicket.value.status = 5;
      showCostModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;
      alert("Ticket résolu et coût enregistré localement !");
    } catch (error) {
      alert("Erreur lors de l'enregistrement.");
      refreshBoard();
    }
  };

  const confirmAnnulation = async () => {
    if (!pendingTicket.value) return;
    try {
      const ticketId = pendingTicket.value.id;
      await kanbanCostService.cancelCost({ ticketId });
      await updateTicketStatus(ticketId, 2);
      pendingTicket.value.status = 2;
      
      showCancelModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;
      alert("Dernier coût annulé et ticket repassé en cours !");
    } catch (error) {
      alert("Une erreur est survenue lors de l'annulation.");
      refreshBoard();
    }
  };

  const confirmReouverture = async () => {
    if (!pendingTicket.value) return;
    if (reopenPercentage.value === null || reopenPercentage.value === '') {
      alert("Veuillez saisir un pourcentage pour la réouverture.");
      return;
    }
    try {
      const ticketId = pendingTicket.value.id;
      await kanbanCostService.reopenTicketCost({
        ticketId: ticketId,
        percentage: parseFloat(reopenPercentage.value)
      });
      await updateTicketStatus(ticketId, 2);
      pendingTicket.value.status = 2;

      showCancelModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;
      alert("Ticket réouvert et surcoût enregistré avec succès !");
    } catch (error) {
      alert("Une erreur est survenue lors de la réouverture.");
      refreshBoard();
    }
  };

  const cancelResolution = () => { showCostModal.value = false; pendingTicket.value = null; refreshBoard(); };
  const cancelAnnulation = () => { showCancelModal.value = false; pendingTicket.value = null; refreshBoard(); };
  const handleOpenDetails = async (ticket) => { showDetailModal.value = true; await selectTicket(ticket); };
  const handleTicketCreated = () => { showCreateModal.value = false; refreshBoard(); };

  onMounted(refreshBoard);

  return {
    isLoading, showCreateModal, showDetailModal, showCostModal, showCancelModal,
    searchQuery, costInputAmount, costInputName, reopenPercentage, pendingTicket,
    columnsConfig, boardLists, refreshBoard, handleCardMove, confirmResolutionWithCost,
    cancelResolution, cancelAnnulation, handleOpenDetails, handleTicketCreated,
    confirmAnnulation, confirmReouverture
  };
}