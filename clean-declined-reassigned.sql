-- Script pour nettoyer les demandes déclinées qui ont été réaffectées
-- À exécuter si vous avez des demandes en base avec des informations de déclin

-- Afficher les demandes actuellement déclinées
SELECT id, titre, statut_interventions, raison_refus, date_refus, technicien_id
FROM panne
WHERE statut_interventions = 'DECLINEE';

-- Réinitialiser les demandes déclinées qui ont un technicien affecté
-- (cela signifie qu'elles ont été réaffectées)
UPDATE panne
SET 
    statut_interventions = 'EN_COURS',
    raison_refus = NULL,
    date_refus = NULL
WHERE statut_interventions = 'DECLINEE'
  AND technicien_id IS NOT NULL;

-- Vérifier le résultat
SELECT id, titre, statut_interventions, raison_refus, date_refus, technicien_id
FROM panne
WHERE technicien_id IS NOT NULL
ORDER BY id DESC
LIMIT 10;
