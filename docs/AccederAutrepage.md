# Accéder à une autre page (Vue Router)

Ce guide montre **deux façons simples et fiables** de naviguer entre les pages :

- **Navigation déclarative** avec `<RouterLink>` (idéale pour les liens et boutons)
- **Navigation programmatique** avec `router.push()` (idéale après un traitement)

> Prérequis : un routeur configuré dans `src/routers/index.js` et les routes nommées.

---

## ✅ Approche 1 : Navigation directe avec `<RouterLink>` (la plus simple)

À utiliser pour les boutons qui mènent vers une autre page **sans logique métier**.

### Exemple

```vue
<template>
  <RouterLink to="/computers/create">
    <button class="btn-primary">Ajouter un Ordinateur</button>
  </RouterLink>

  <RouterLink :to="{ name: 'computers' }">
    <button class="btn-secondary">Retour à la liste</button>
  </RouterLink>
</template>
```

### Bonnes pratiques

- Préférez **les noms de route** (`name`) lorsque c'est possible : plus robuste.
- `<RouterLink>` génère un `<a>`, donc vous pouvez styliser l'état actif si besoin.

### Style minimal

```vue
<style scoped>
/* RouterLink génère une balise <a>, cette règle supprime le soulignement par défaut */
a { text-decoration: none; }
.btn-primary { padding: 10px 20px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }
.btn-secondary { padding: 10px 20px; background-color: #7f8c8d; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px; }
</style>
```

---

## ✅ Approche 2 : Navigation par programmation avec `router.push()` (la plus flexible)

Idéal après un **enregistrement**, une **validation** ou un **appel API**.

### Exemple (Composition API)

```vue
<template>
  <button @click="saveAndNavigate" class="btn-success">
    Enregistrer et Quitter
  </button>
</template>

<script setup>
import { useRouter } from 'vue-router'

// 1. On récupère l'instance du routeur
const router = useRouter()

const saveAndNavigate = async () => {
  console.log("1. Traitement de données en cours...")
  // Exemple : await api.post(...)
  
  console.log("2. Traitement fini, redirection de l'utilisateur...")
  
  // 2. On pousse la nouvelle URL dans l'historique du navigateur
  router.push('/computers')
  
  // Ou bien en utilisant le nom de la route :
  // router.push({ name: 'computers' })
}
</script>
```

### Notes utiles

- `router.push()` ajoute une entrée dans l'historique (utilisateur peut revenir). 
- Si tu veux remplacer la page actuelle (sans retour arrière) :
  - `router.replace('/computers')`
- Tu peux aussi passer des paramètres :
  - `router.push({ name: 'computer.view', params: { id: 12 } })`

### Style minimal

```vue
<style scoped>
.btn-success { padding: 10px 20px; background-color: #2ecc71; color: white; border: none; border-radius: 4px; cursor: pointer; }
</style>
```

---

## 🧠 Erreurs fréquentes

- **Route name manquante** : vérifie que `name` existe dans `src/routers/index.js`.
- **Paramètres oubliés** : si ta route attend `:id`, passe-le dans `params`.
- **Redirection trop tôt** : attends que l'appel API soit terminé.

---

## ✅ Résumé rapide

- `<RouterLink>` : simple, propre, idéal pour des liens ou boutons.
- `router.push()` : puissant pour naviguer après un traitement.

Si tu veux, je peux adapter ces exemples à tes routes exactes.