-- Solution pour PostgreSQL: Supprimer la contrainte CHECK et la recréer avec DECLINEE

-- 1. Supprimer l'ancienne contrainte
ALTER TABLE pannes 
DROP CONSTRAINT IF EXISTS pannes_statut_interventions_check;

-- 2. Créer la nouvelle contrainte avec DECLINEE
ALTER TABLE pannes 
ADD CONSTRAINT pannes_statut_interventions_check 
CHECK (statut_interventions IN ('NON_DEMARREE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'DECLINEE'));

-- 3. Vérifier que ça fonctionne
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'pannes_statut_interventions_check';
