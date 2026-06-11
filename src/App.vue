<script setup>
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  await authStore.initFrontSession()
})
</script>

<template>
  <RouterView />
</template>

<style>
:root {
  --bg-dark: #f8fafc;
  --bg-card: #ffffff;
  --bg-element: #f1f5f9;
  --text-main: #1e293b;
  --text-muted: #64748b;
  --text-inverse: #ffffff;
  --accent: #3b82f6;
  --accent-hover: #2563eb;
  --success: #10b981;
  --danger: #ef4444;
  --border-color: #e2e8f0;
  --radius: 8px;
  --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

body {
  margin: 0;
  padding: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: var(--bg-dark);
  color: var(--text-main);
}

button {
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  border-radius: var(--radius);
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.kpi-card, .details-card, .dashboard-container {
  box-shadow: var(--shadow);
  border: 1px solid var(--border-color);
  background-color: var(--bg-card);
  border-radius: var(--radius);
}
</style>
