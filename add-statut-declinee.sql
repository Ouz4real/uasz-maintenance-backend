-- Script pour ajouter le statut DECLINEE à la base de données

-- Si vous utilisez MySQL/MariaDB avec une colonne ENUM
-- Vous devez modifier la définition de la colonne

-- Option 1: Si la colonne est de type ENUM
ALTER TABLE panne 
MODIFY COLUMN statut_interventions ENUM('NON_DEMARREE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'DECLINEE');

-- Option 2: Si la colonne est de type VARCHAR (plus flexible)
-- Rien à faire, VARCHAR accepte n'importe quelle valeur

-- Vérification
SELECT DISTINCT statut_interventions FROM panne;

-- Test: Mettre une panne en DECLINEE pour tester
-- UPDATE panne SET statut_interventions = 'DECLINEE' WHERE id = 18;
