import { ref, onMounted } from 'vue';
import { useTicketsManager } from '@/composables/useTicketsManager';
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
  const pendingMoveEvent = ref(null);
  const pendingTicket = ref(null);

  // 🛠️ Nouveau champ pour le pourcentage de réouverture
  const reopenPercentage = ref(0);

  const columnsConfig = ref([
    { id: 1, title: 'Nouveau', color: '#0ea5e9', bg: '#f0f9ff', textColor: '#0369a1', badgeBg: 'rgba(14, 165, 233, 0.15)' },
                            { id: 2, title: 'En Cours', color: '#f59e0b', bg: '#fffaf0', textColor: '#b45309', badgeBg: 'rgba(245, 158, 11, 0.15)' },
                            { id: 5, title: 'Résolu', color: '#10b981', bg: '#f0fdf4', textColor: '#15803d', badgeBg: 'rgba(16, 185, 129, 0.15)' }
  ]);

  const boardLists = ref({ 1: [], 2: [], 5: [] });

  const refreshBoard = async () => {
    await loadTickets();
    boardLists.value = { 1: [], 2: [], 5: [] };
    tickets.value.forEach(ticket => {
      const statusId = ticket.status;
      if (boardLists.value[statusId]) {
        boardLists.value[statusId].push(ticket);
      }
    });
  };

  const handleCardMove = async (event, targetStatusId) => {
    if (!event.added) return;
    const targetTicket = event.added.element;

    // Interception 1 : Vers Résolu (ID 5) -> Formulaire coût standard
    if (targetStatusId === 5) {
      pendingTicket.value = targetTicket;
      pendingMoveEvent.value = event;
      costInputAmount.value = null;
      showCostModal.value = true;
      return;
    }

    // 🛠️ Interception 2 : Depuis Résolu (5) Vers En Cours (ID 2) -> Boite dialogue demandée
    if (targetStatusId === 2 && targetTicket.status === 5) {
      pendingTicket.value = targetTicket;
      pendingMoveEvent.value = event;
      reopenPercentage.value = 0; // Reset input field
      showCancelModal.value = true;
      return;
    }

    // Traitement standard pour les autres colonnes
    try {
      await updateTicketStatus(targetTicket.id, targetStatusId);
      targetTicket.status = targetStatusId;
    } catch (error) {
      refreshBoard();
    }
  };

  // 🛠️ BOUTON "ANNULATION" (Supprime le dernier coût et repasse en statut 2)
  const confirmAnnulation = async () => {
    if (!pendingTicket.value) return;
    try {
      const ticketId = pendingTicket.value.id;
      await kanbanCostService.cancelCost(ticketId);
      await updateTicketStatus(ticketId, 2);

      showCancelModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;
      alert("Dernier coût supprimé et ticket remis En cours.");
      await refreshBoard();
    } catch (error) {
      alert("Erreur lors de la suppression du coût.");
      cancelAnnulationModal();
    }
  };

  // 🛠️ BOUTON "RÉOUVERTURE" (Ajoute X% du dernier coût et repasse en statut 2)
  const confirmReouverture = async () => {
    if (!pendingTicket.value) return;
    try {
      const ticketId = pendingTicket.value.id;
      await kanbanCostService.reopenTicketCost(ticketId, reopenPercentage.value);
      await updateTicketStatus(ticketId, 2);

      showCancelModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;
      alert(`Ticket réouvert avec succès avec des frais de ${reopenPercentage.value}%.`);
      await refreshBoard();
    } catch (error) {
      alert("Erreur lors de la réouverture.");
      cancelAnnulationModal();
    }
  };

  const cancelAnnulationModal = () => {
    showCancelModal.value = false;
    pendingTicket.value = null;
    pendingMoveEvent.value = null;
    refreshBoard(); // Remet la carte graphiquement dans Terminé
  };

  const cancelResolution = () => {
    showCostModal.value = false;
    pendingTicket.value = null;
    pendingMoveEvent.value = null;
    refreshBoard();
  };

  const confirmResolutionWithCost = async () => {
    if (!pendingTicket.value) return;
    try {
      const ticketId = pendingTicket.value.id;
      if (costInputAmount.value !== null && costInputAmount.value > 0) {
        await kanbanCostService.saveTicketCost({
          ticket_id: ticketId,
          amount: parseFloat(costInputAmount.value),
                                               label: costInputName.value
        });
      }
      await updateTicketStatus(ticketId, 5);
      showCostModal.value = false;
      pendingTicket.value = null;
      pendingMoveEvent.value = null;
      await refreshBoard();
    } catch (error) {
      alert("Erreur lors de la sauvegarde du coût.");
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
    reopenPercentage, // 🛠️ Retourné
    pendingTicket,
    columnsConfig,
    boardLists,
    refreshBoard,
    handleCardMove,
    cancelResolution,
    confirmResolutionWithCost,
    confirmAnnulation,  // 🛠️ Retourné
    confirmReouverture, // 🛠️ Retourné
    cancelAnnulationModal
  };
}
