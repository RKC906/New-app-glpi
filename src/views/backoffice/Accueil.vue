<template>
    <header class="admin-header">
        <h2 class="admin-title">Tableau de bord Administrateur</h2>
        <LogOutButton />
    </header>
  <body>
    <div>
        <RouterLink :to="{ name: 'computers' }">
        <button class="btn-secondary">Liste Computers</button>
        </RouterLink>
    </div>
    <div>
        <ResetData />
    </div>
    <div>
        <ImportFile1 />
        <ImportFile2 />
        <ImportFile3 />
        <ImportImage />
    </div>
  </body>
    
</template>

<script setup>
    import LogOutButton from '@/components/LogOutButton.vue';
    import { RouterLink } from 'vue-router'
    import ResetData from '@/components/ResetData.vue';
    import ImportFile1 from '@/components/import/ImportFile1.vue';
    import ImportFile2 from '@/components/import/ImportFile2.vue';
    import ImportFile3 from '@/components/import/ImportFile3.vue';
    import ImportImage from '@/components/import/ImportImage.vue';
</script>
<style>
    .btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
    .admin-header {
  display: flex;                  /* 1. On active Flexbox */
  justify-content: space-between; /* 2. Aligne les enfants aux extrémités (Titre à gauche, bouton à droite) */
  align-items: center;            /* 3. Aligne verticalement le titre et le bouton au centre */
  
  /* Le reste de ton design (Padding, couleurs...) */
  padding: 15px 30px;
  background-color: #2c3e50;
  color: white;
}

.admin-title {
  margin: 0; /* Optionnel : retire les marges par défaut du h2 pour un alignement parfait */
  font-size: 1.5rem;
}
</style>