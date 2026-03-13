-- Ajouter les colonnes raison_refus et date_refus à la table pannes
-- Ces colonnes permettent de stocker la raison du refus d'une intervention par un technicien

-- Ajouter la colonne raison_refus
ALTER TABLE pannes 
ADD COLUMN IF NOT EXISTS raison_refus TEXT;

-- Ajouter la colonne date_refus
ALTER TABLE pannes 
ADD COLUMN IF NOT EXISTS date_refus TIMESTAMP;

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'pannes' 
  AND column_name IN ('raison_refus', 'date_refus')
ORDER BY column_name;
