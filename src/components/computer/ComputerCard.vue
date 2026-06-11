<template>
 <div class="computer-card">
 <div class="icon"></div>
 <div class="info">
 <h3>{{ computer.name || 'Nom inconnu' }}</h3>
 <p class="id">ID GLPI : #{{ computer.id }}</p>
 </div>
 </div>
</template>

<script setup>
defineProps({
 computer: { type: Object, required: true }
})
</script>

<style scoped>
.computer-card {
 display: flex;
 align-items: center;
 background: white;
 padding: 15px 20px;
 border-radius: 8px;
 box-shadow: 0 2px 5px rgba(0,0,0,0.05);
 border-left: 4px solid #3498db;
}
.icon { font-size: 1.8em; margin-right: 15px; }
.info h3 { margin: 0 0 5px 0; color: #2c3e50; }
.id { margin: 0; color: #7f8c8d; font-size: 0.85em; }
</style>