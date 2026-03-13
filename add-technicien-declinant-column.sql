-- Migration: Ajouter la colonne technicien_declinant_id pour garder l'historique des déclins
-- Cette colonne permet de savoir quel technicien a décliné une demande, même après réaffectation

-- Ajouter la colonne technicien_declinant_id
ALTER TABLE pannes 
ADD COLUMN technicien_declinant_id BIGINT NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE pannes 
ADD CONSTRAINT fk_pannes_technicien_declinant 
FOREIGN KEY (technicien_declinant_id) 
REFERENCES utilisateurs(id);

-- Créer un index pour améliorer les performances des requêtes
CREATE INDEX idx_pannes_technicien_declinant 
ON pannes(technicien_declinant_id);

-- Mettre à jour les données existantes: 
-- Pour les demandes déclinées, copier technicien_id vers technicien_declinant_id
UPDATE pannes 
SET technicien_declinant_id = technicien_id 
WHERE statut_interventions = 'DECLINEE' 
AND technicien_id IS NOT NULL 
AND technicien_declinant_id IS NULL;

-- Vérifier les résultats
SELECT 
    id,
    titre,
    statut_interventions,
    technicien_id,
    technicien_declinant_id,
    raison_refus
FROM pannes 
WHERE statut_interventions = 'DECLINEE'
ORDER BY id DESC;
