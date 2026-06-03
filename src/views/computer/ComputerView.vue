<template>
  <div class="page-container">
    <h2>Inventaire des Ordinateurs</h2>

    <div v-if="isLoading" class="state-box">Chargement des données...</div>
    <div v-else-if="error" class="state-box error">{{ error }}</div>
    
    <div v-else>
      <div v-if="computers.length === 0" class="empty-state">
        <p>Aucun ordinateur trouvé dans votre base GLPI.</p>
      </div>

      <div v-else class="grid-layout">
        <ComputerCard 
          v-for="item in computers" 
          :key="item.id" 
          :computer="item" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useComputers } from '@/composables/useComputer'
import ComputerCard from '@/components/computer/ComputerCard.vue'

const { computers, isLoading, error, fetchComputers } = useComputers()

onMounted(() => {
  // L'appel fonctionne direct car la session est déjà ouverte par App.vue !
  fetchComputers() 
})
</script>

<style scoped>
.page-container { max-width: 800px; margin: 40px auto; padding: 0 20px; }
h2 { color: #2c3e50; margin-bottom: 25px; }
.state-box { text-align: center; color: #7f8c8d; padding: 20px; }
.state-box.error { color: #c0392b; background: #fdf2e9; border-radius: 4px; }
.empty-state { text-align: center; padding: 40px; border: 2px dashed #bdc3c7; color: #7f8c8d; }
.grid-layout { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
</style>