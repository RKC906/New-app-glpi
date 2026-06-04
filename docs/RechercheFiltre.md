# Recherche + filtre en Vue (Composition API)

Ce guide explique comment ajouter une **recherche rapide** dans un tableau, avec gestion des cas vides et un comportement fiable.

---

## ✅ Dans le template

### Champ de recherche + table

```vue
<div class="search-box">
  <input
    v-model="searchQuery"
    type="text"
    placeholder="Rechercher..."
    class="search-input"
  />
</div>

<table class="my-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Nom</th>
    </tr>
  </thead>
  <tbody>
    <tr v-if="filteredItems.length === 0">
      <td colspan="2">Aucun résultat trouvé.</td>
    </tr>

    <tr v-for="item in filteredItems" :key="item.id">
      <td>{{ item.id }}</td>
      <td>{{ item.name }}</td>
    </tr>
  </tbody>
</table>
```

---

## ✅ Dans le script

### Version simple (nom + id)

```js
import { computed, ref } from 'vue'

// 1. Variable de recherche
const searchQuery = ref('')

// 2. Liste filtrée
const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) {
    return items.value // ← remplace items par ton tableau (ex: peripherals.value)
  }

  const query = searchQuery.value.toLowerCase().trim()

  return items.value.filter(item => {
    const matchName = item.name ? item.name.toLowerCase().includes(query) : false
    const matchId = item.id ? item.id.toString().includes(query) : false

    return matchName || matchId
  })
})
```

---

## 🔎 Variantes utiles

### Recherche sur plusieurs champs

```js
const filteredItems = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()

  if (!query) return items.value

  return items.value.filter(item => {
    const fields = [item.name, item.type, item.brand]
    return fields.some(field => String(field || '').toLowerCase().includes(query))
  })
})
```

### Recherche exacte (ID uniquement)

```js
const filteredItems = computed(() => {
  const query = searchQuery.value.trim()

  if (!query) return items.value

  return items.value.filter(item => String(item.id) === query)
})
```

---

## 🧠 Bonnes pratiques

- Toujours faire `trim()` pour éviter les espaces inutiles.
- Convertir les valeurs en `String()` évite les erreurs sur `undefined`.
- Si tu as beaucoup d'éléments, tu peux **déclencher le filtre sur `@input`** avec un délai (debounce).

---

## ⚠️ Erreurs fréquentes

- **`items` est `undefined`** → assure-toi que ta liste est initialisée (ex: `ref([])`).
- **`item.name` manquant** → protège avec `item.name ? ... : false`.
- **Tableau vide** → le message *Aucun résultat trouvé* aide l'utilisateur.

---

## ✅ Résumé

- `searchQuery` stocke la recherche.
- `filteredItems` calcule le tableau filtré.
- Tu peux étendre la recherche à d'autres champs facilement.

Si tu veux, je peux adapter l'exemple directement à tes composants (ex: `ComputerList.vue`).