# Guide de Modification : Persistance de l'Item ID et de la Catégorie dans SQLite

Ce document décrit les modifications à apporter à l'architecture pour enregistrer directement `item_id` et `category` dans la table local `tickets_costs` de SQLite. Cela permettra de calculer les statistiques de rentabilité (AssetStats) directement depuis SQLite sans dépendre entièrement de la disponibilité ou des liaisons dynamiques de l'API GLPI à chaque recalcul.

---

## 1. BACKEND : Mise à jour de la Base de Données (`kanbanConfigService.js`)

Nous devons modifier le script d'initialisation de la table `tickets_costs` pour y inclure les deux nouvelles colonnes. Nous mettons également à jour la méthode `saveCout` pour insérer ces valeurs.

### Fichier : `src/services/locale/kanbanConfigService.js` (ou votre dossier backend)

```javascript
// 1. Mettre à jour l'initialisation de la table (initDb)
const initDb = async () => {
  const db = await getDb();
  await db.exec(`
    /* ... vos autres tables (kanban_color, etc.) ... */

    /* Structure modifiée de la table des coûts */
    CREATE TABLE IF NOT EXISTS tickets_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER,
      item_id INTEGER,       /* ➕ Nouvelle colonne */
      category TEXT,         /* ➕ Nouvelle colonne (ex: 'Computer', 'Printer') */
      amount REAL,
      label TEXT,
      date TEXT
    );
  `);
};

// 2. Mettre à jour la fonction d'insertion
const kanbanConfigService = {
  // ... vos autres méthodes ...

  async saveCout(ticketId, itemId, category, amount, label, date) {
    const db = await getDb();
    try {
      const result = await db.run(
        `INSERT INTO tickets_costs (ticket_id, item_id, category, amount, label, date) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ticketId, 
          itemId || null, 
          category || 'Unknown', 
          amount, 
          label, 
          date || new Date().toISOString().slice(0, 10)
        ]
      );
      return { success: true, id: result.lastID };
    } catch (error) {
      console.error("Erreur SQLite lors de l'insertion du coût avec Item/Catégorie :", error);
      throw error;
    }
  },
  
  // La méthode getAllCosts renverra automatiquement les nouvelles colonnes
  async getAllCosts() {
    const db = await getDb();
    try {
      return await db.all('SELECT id, ticket_id, item_id, category, amount, label, date FROM tickets_costs');
    } catch (error) {
      console.error("Erreur lors de la récupération des coûts SQLite:", error);
      throw error;
    }
  }
};


2. BACKEND : Mise à jour du Contrôleur Express (kanbanConfigController.js)

Le contrôleur doit maintenant intercepter item_id et category depuis le corps de la requête HTTP (req.body) envoyée par le Frontend.
Fichier : src/controllers/kanbanConfigController.js
JavaScript

const { kanbanConfigService } = require('../services/kanbanConfigService');

const kanbanConfigController = {
  // ... vos autres méthodes ...

  async saveCosts(req, res) {
    try {
      // ➕ Récupération des deux nouvelles variables depuis le payload
      const { ticket_id, item_id, category, amount, label, date } = req.body;
      
      if (!ticket_id) {
        return res.status(400).json({ message: "L'identifiant du ticket (ticket_id) est manquant." });
      }

      // Transmission des arguments au service de base de données
      const result = await kanbanConfigService.saveCout(
        ticket_id, 
        item_id, 
        category, 
        amount, 
        label, 
        date
      );

      res.json({ message: 'Coût d\'intervention enregistré avec succès !', id: result.id });
    } catch (error) {
      console.error("Erreur contrôleur saveCosts:", error);
      res.status(500).json({ message: 'Erreur interne lors de la sauvegarde du coût' });
    }
  },
};

3. FRONTEND : Mise à jour du Service API (kanbanCostService.js)

Nous adaptons la fonction axios/fetch pour qu'elle accepte et pousse ces données vers l'API Express.
Fichier : src/services/locale/kanbanCostService.js
JavaScript

const EXPRESS_BASE_URL = 'http://localhost:3005/api';

export const kanbanCostService = {
  // Mise à jour de la signature pour inclure item_id et category
  async saveTicketCost({ ticket_id, item_id, category, amount, label, date }) {
    try {
      const response = await fetch(`${EXPRESS_BASE_URL}/kanban/costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Envoi au format JSON vers le serveur Express
        body: JSON.stringify({ ticket_id, item_id, category, amount, label, date })
      });

      if (!response.ok) {
        throw new Error('Erreur réseau lors de la sauvegarde du coût');
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Erreur [kanbanCostService.saveTicketCost]:", error);
      throw error;
    }
  },

  // ... rest de vos méthodes (getAllCosts, cancelCost) ...
};

4. FRONTEND : Capture des infos dans le Composable du Kanban (useTicketKanban.js)

C'est l'étape clé. Lorsque l'utilisateur valide le formulaire de coût (au moment où le ticket passe dans la colonne Résolu), le composable doit extraire l'item_id (souvent nommé items_id) et l'itemtype (la catégorie) depuis l'objet ticket de GLPI actuel stocké dans pendingTicket.value.
Fichier : src/composables/locales/useTicketKanban.js
JavaScript

// ... à l'intérieur de la fonction useTicketKanban() ...

const confirmResolutionWithCost = async () => {
  if (!pendingTicket.value) return;

  try {
    const ticketId = pendingTicket.value.id;
    
    // 🔍 EXTRACTION DES DONNÉES DE LIAISON DEPUIS LE TICKET GLPI
    // GLPI stocke souvent ses liaisons d'appareils dans un tableau joint (ex: ticket.items ou ticket._items)
    // S'il n'y a pas d'appareil lié, on met des valeurs par défaut.
    let detectedItemId = null;
    let detectedCategory = 'Software'; // Catégorie générique par défaut si non spécifié

    if (pendingTicket.value.items && pendingTicket.value.items.length > 0) {
      // On prend le premier appareil lié pour la ventilation principale
      detectedItemId = pendingTicket.value.items[0].items_id;
      detectedCategory = pendingTicket.value.items[0].itemtype; 
    } else if (pendingTicket.value.itemtype) {
      // Alternative selon la structure de votre payload GLPI
      detectedItemId = pendingTicket.value.items_id;
      detectedCategory = pendingTicket.value.itemtype;
    }

    // Appel du service API mis à jour avec les attributs de l'appareil
    await kanbanCostService.saveTicketCost({
      ticket_id: ticketId,
      item_id: detectedItemId,         // ➕ Envoyé à SQLite
      category: detectedCategory,     // ➕ Envoyé à SQLite
      amount: Number(costInputAmount.value) || 0,
      label: costInputName.value,
      date: new Date().toISOString().slice(0, 10)
    });

    // Procéder au changement de statut GLPI graphique standard (Statut 5 = Résolu)
    await updateTicketStatus(ticketId, 5);
    
    // Reset et fermeture de la modale
    showCostModal.value = false;
    costInputAmount.value = null;
    pendingTicket.value = null;
    pendingMoveEvent.value = null;

    refreshBoard();
    alert("Ticket résolu et données financières persistées localement !");
  } catch (error) {
    console.error("Erreur lors de la clôture financière :", error);
    alert("Une erreur est survenue.");
    refreshBoard();
  }
};

5. bÉnÉfice : Lecture simplifiée dans le tableau statistique (useAssetStats.js)

Grâce à cette modification, la génération de votre rapport financier devient beaucoup plus simple. Dans useAssetStats.js, vous n'aurez plus besoin de croiser de manière complexe chaque ticket GLPI avec ses sous-liens d'API réseau pour retrouver le matériel, car l'information est stockée de manière définitive au moment même de l'action.

Votre boucle d'accumulation se basera directement sur les colonnes lues depuis la table locale SQLite :
JavaScript

// Exemple conceptuel de la simplification dans useAssetStats.js :
const localCosts = localRes.data || []; // Contient désormais { ticket_id, category, amount, item_id }

localCosts.forEach(cost => {
  const type = cost.category; // Plus besoin de fetch GLPI pour trouver le type !
  const amount = cost.amount;

  if (tempMap.has(type)) {
    const cat = tempMap.get(type);
    cat.sqliteCost += amount;
    cat.totalCost += amount;
    // ...
  } else {
    // ... initialiser la catégorie ...
  }
});