<template>
 <div class="settings-page">
 <div class="settings-header">
 <h2>Personnalisation du Tableau Kanban</h2>
 <p class="subtitle">Sélectionnez une langue pour visualiser la traduction automatique et ajustez les couleurs de fond.</p>
 </div>

 <div v-if="loading" class="loading-state">
 <div class="spinner"></div>
 <p>Chargement des paramètres...</p>
 </div>

 <div v-else class="settings-card">
 <div class="language-selector-zone">
 <label for="lang-select">Aperçu de la langue :</label>
 <select id="lang-select" v-model="selectedLang" class="select-lang">
 <option v-for="lang in languages" :key="lang.code" :value="lang.code">
 {{ lang.label }}
 </option>
 </select>
 </div>

 <form @submit.prevent="submitForm">
 <table class="settings-table">
 <thead>
 <tr>
 <th>ID Statut</th>
 <th>Nom par défaut (FR)</th>
 <th>Traduction Automatique</th>
 <th>Couleur de fond</th>
 <th>Aperçu de la colonne</th>
 </tr>
 </thead>
 <tbody>
 <tr v-for="status in statusList" :key="status.id">
 <td class="status-id">#{{ status.id }}</td>
 <td class="status-fr"><strong>{{ status.defaultFr }}</strong></td>
 <td class="status-translation">{{ status.currentTranslation }}</td>
 <td>
 <input v-model="form.colors[status.id]" type="color" class="input-color" />
 </td>
 <td>
 <div class="color-preview" :style="{ backgroundColor: form.colors[status.id] }">
 {{ status.currentTranslation }}
 </div>
 </td>
 </tr>
 </tbody>
 </table>

 <div class="form-actions">
 <button type="button" @click="$router.back()" class="btn-cancel">Annuler</button>
 <button type="submit" class="btn-submit" :disabled="saving">
 {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
 </button>
 </div>
 </form>
 </div>
 </div>
</template>

<script setup>
import { useKanbanSettings } from '@/composables/locales/useKanbanConfig'
const { loading, saving, selectedLang, languages, statusList, form, submitForm } = useKanbanSettings()
</script>

<style scoped>
.language-selector-zone { margin-bottom: 25px; display: flex; align-items: center; gap: 12px; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; }
.language-selector-zone label { font-weight: 600; color: #334155; }
.select-lang { padding: 8px 14px; border-radius: 6px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; }
.status-translation { color: #0284c7; font-weight: 600; font-size: 0.95rem; }
/* ... Reste de ton CSS identique ... */
</style>