-- Ajouter la colonne created_at à la table utilisateurs
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

-- Mettre à jour les utilisateurs existants avec la date actuelle
UPDATE utilisateurs SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- Rendre la colonne NOT NULL après avoir mis à jour les valeurs existantes
ALTER TABLE utilisateurs ALTER COLUMN created_at SET NOT NULL;
