-- Script pour ajouter la colonne must_change_password
-- D'abord, ajouter la colonne en autorisant NULL temporairement
ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN;

-- Mettre à jour tous les utilisateurs existants avec false par défaut
UPDATE utilisateurs SET must_change_password = false WHERE must_change_password IS NULL;

-- Maintenant, rendre la colonne NOT NULL
ALTER TABLE utilisateurs ALTER COLUMN must_change_password SET NOT NULL;

-- Définir la valeur par défaut pour les futurs enregistrements
ALTER TABLE utilisateurs ALTER COLUMN must_change_password SET DEFAULT false;

-- Vérifier que tous les utilisateurs ont une valeur
SELECT username, must_change_password FROM utilisateurs;
