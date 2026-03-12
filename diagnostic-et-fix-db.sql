-- Script de diagnostic et correction pour le statut DECLINEE

-- 1. Vérifier la structure actuelle de la table
SHOW CREATE TABLE panne;

-- 2. Vérifier les statuts actuels
SELECT DISTINCT statut_interventions FROM panne;

-- 3. Modifier la colonne pour accepter DECLINEE
-- Si c'est un ENUM, on le change en VARCHAR
ALTER TABLE panne 
MODIFY COLUMN statut_interventions VARCHAR(20) NOT NULL DEFAULT 'NON_DEMARREE';

-- 4. Vérifier que la modification a fonctionné
DESCRIBE panne;

-- 5. Test: Essayer de mettre une panne en DECLINEE
-- UPDATE panne SET statut_interventions = 'DECLINEE' WHERE id = 18;

-- 6. Vérifier
-- SELECT id, titre, statut_interventions, raison_refus FROM panne WHERE id = 18;
