<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h2>📊 Tableau de Bord GLPI</h2>
      <button @click="refreshDashboard" :disabled="isLoading" class="btn-refresh">
        {{ isLoading ? 'Mise à jour...' : '🔄 Actualiser' }}
      </button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card purple">
        <div class="kpi-icon">📦</div>
        <div class="kpi-info">
          <h3>Total Équipements</h3>
          <p class="kpi-value">{{ stats.totalAssets }}</p>
        </div>
      </div>

      <div class="kpi-card blue">
        <div class="kpi-icon">🎫</div>
        <div class="kpi-info">
          <h3>Tickets Globaux</h3>
          <p class="kpi-value">{{ stats.totalTickets }}</p>
        </div>
      </div>

      <div class="kpi-card red">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <h3>Coût Total du Parc</h3>
          <p class="kpi-value">{{ stats.totalCosts.toFixed(2) }} €</p>
        </div>
      </div>
    </div>

    <div class="details-grid">
      
      <div class="details-card">
        <div class="card-title">🔌 Répartition du Matériel</div>
        <table class="details-table">
          <thead>
            <tr><th>Type d'élément</th><th>Quantité</th></tr>
          </thead>
          <tbody>
            <tr><td>💻 Ordinateurs (Computers)</td><td class="badge-count gray">{{ stats.computers }}</td></tr>
            <tr><td>🖥️ Moniteurs (Monitors)</td><td class="badge-count gray">{{ stats.monitors }}</td></tr>
            <tr><td>🖨️ Imprimantes (Printers)</td><td class="badge-count gray">{{ stats.printers }}</td></tr>
            <tr><td>🖱️ Périphériques (Peripherals)</td><td class="badge-count gray">{{ stats.peripherals }}</td></tr>
          </tbody>
        </table>
      </div>

      <div class="details-card">
        <div class="card-title">🛠️ Suivi du Helpdesk & Tickets</div>
        
        <h4 class="sub-title">📌 Par Type</h4>
        <table class="details-table compact">
          <tbody>
            <tr><td>🔴 Incidents</td><td class="badge-count red-bg">{{ stats.incidents }}</td></tr>
            <tr><td>🟢 Demandes</td><td class="badge-count green-bg">{{ stats.demands }}</td></tr>
          </tbody>
        </table>

        <h4 class="sub-title" style="margin-top: 20px;">🔄 Par État d'avancement</h4>
        <table class="details-table compact">
          <tbody>
            <tr><td>🆕 Nouveaux</td><td class="badge-count status-blue">{{ stats.statusNew }}</td></tr>
            <tr><td>⏳ En cours (Assignés)</td><td class="badge-count status-orange">{{ stats.statusAssigned }}</td></tr>
            <tr><td>📅 En cours (Planifiés)</td><td class="badge-count status-orange">{{ stats.statusPlanned }}</td></tr>
            <tr><td>⏸️ En attente</td><td class="badge-count status-purple">{{ stats.statusWaiting }}</td></tr>
            <tr><td>✅ Résolus</td><td class="badge-count status-green">{{ stats.statusSolved }}</td></tr>
            <tr><td>📁 Clos</td><td class="badge-count status-gray">{{ stats.statusClosed }}</td></tr>
          </tbody>
        </table>
      </div>

    </div>
  </div>
  <div>
    <RouterLink :to="{ name: 'accueil' }">
    <button class="btn-secondary">Retour à l'accueil</button>
    </RouterLink>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDashboard } from '@/composables/useDashboard'

const { stats, isLoading, refreshDashboard } = useDashboard()

onMounted(() => {
  refreshDashboard()
})
</script>

<style scoped>
.dashboard-container { padding: 30px; max-width: 1200px; margin: 0 auto; font-family: sans-serif; background-color: #f8f9fa; min-height: 100vh; }
.dashboard-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.dashboard-header h2 { color: #2c3e50; margin: 0; }
.btn-refresh { background-color: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; font-weight: 600; }
.btn-refresh:hover { background-color: #2980b9; }
.btn-refresh:disabled { background-color: #95a5a6; }

.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 40px; }
.kpi-card { background: white; border-radius: 10px; padding: 25px; display: flex; align-items: center; gap: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); border-left: 5px solid transparent; }
.kpi-card.purple { border-left-color: #9b59b6; }
.kpi-card.blue { border-left-color: #3498db; }
.kpi-card.red { border-left-color: #e74c3c; }
.kpi-icon { font-size: 2.5rem; }
.kpi-info h3 { margin: 0; color: #7f8c8d; font-size: 0.95rem; text-transform: uppercase; }
.kpi-value { margin: 5px 0 0 0; font-size: 1.8rem; font-weight: bold; color: #2c3e50; }

.details-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 30px; }
.details-card { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.card-title { font-size: 1.1rem; font-weight: bold; color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #f1f3f5; padding-bottom: 10px; }

.sub-title { font-size: 0.9rem; color: #7f8c8d; text-transform: uppercase; margin: 10px 0 5px 0; letter-spacing: 0.5px; }

.details-table { width: 100%; border-collapse: collapse; }
.details-table th { text-align: left; color: #95a5a6; font-size: 0.85rem; text-transform: uppercase; padding-bottom: 12px; }
.details-table td { padding: 12px 0; border-bottom: 1px solid #f8f9fa; color: #34495e; font-weight: 500; }
.details-table.compact td { padding: 8px 0; }

.badge-count { text-align: right; font-weight: bold; width: 60px; }
.badge-count.gray { color: #7f8c8d; }
.badge-count.red-bg { color: #e74c3c; }
.badge-count.green-bg { color: #2ecc71; }

/* 🎨 Couleurs des badges de statuts */
.status-blue { color: #3498db; }
.status-orange { color: #e67e22; }
.status-purple { color: #9b59b6; }
.status-green { color: #2ecc71; }
.status-gray { color: #95a5a6; }

.btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }

</style>