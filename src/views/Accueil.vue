<template>

    <div>
        <RouterLink :to="{ name: 'computers' }">
        <button class="btn-secondary">Liste Computers</button>
        </RouterLink>
    </div>
    <div>
        <ResetData />
    </div>

</template>

<script setup>
    import { RouterLink } from 'vue-router'
    import ResetData from '@/components/ResetData.vue';
</script>
<style>
    .btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
</style>