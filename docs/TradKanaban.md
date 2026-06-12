1. Le dictionnaire dans SQLite (kanbanConfigService.js)

const initDb = async () => {
  const db = await getDb();
  
  // ... vos requêtes de création de tables (kanban_color, kanban_translation, kanban_settings) ...

  // Vérification et insertion du dictionnaire multilingue
  const transCheck = await db.get("SELECT COUNT(*) as count FROM kanban_translation");
  if (transCheck.count === 0) {
    await db.run(`
      INSERT INTO kanban_translation (id_status, langue, translation) VALUES 
      -- 🇫🇷 Français
      (1, 'fr', 'Nouveau'), (2, 'fr', 'En Cours'), (5, 'fr', 'Résolu'),
      
      -- 🇲🇬 Malgache
      (1, 'mg', 'Vaovao'), (2, 'mg', 'Efa manao'), (5, 'mg', 'Vita'),
      
      -- 🇬🇧 Anglais (Nouvelle langue ajoutée en BDD)
      (1, 'en', 'New'),     (2, 'en', 'In Progress'), (5, 'en', 'Solved')
    `);
  }
};

Note importante pour votre base actuelle :

Si votre fichier SQLite existe déjà sur votre machine, le bloc if (transCheck.count === 0) ne s'exécutera pas car la table n'est pas vide (elle contient déjà le français et le malgache).

Pour forcer l'ajout de l'anglais sans supprimer votre base de données, vous pouvez ajouter cette fonction de "migration" ou exécuter cette requête directement :
JavaScript

// Vous pouvez appeler ceci une fois au démarrage pour ajouter l'anglais en toute sécurité
async function addEnglishLanguage() {
  const db = await getDb();
  await db.run(`
    INSERT OR IGNORE INTO kanban_translation (id_status, langue, translation) VALUES 
    (1, 'en', 'New'),
    (2, 'en', 'In Progress'),
    (5, 'en', 'Solved')
  `);
}

2. Comment l'API Express renvoie les données