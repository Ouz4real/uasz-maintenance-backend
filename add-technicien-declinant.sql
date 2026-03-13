-- Ajouter la colonne technicien_declinant_id pour savoir qui a décliné
ALTER TABLE panne 
ADD COLUMN technicien_declinant_id BIGINT NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE panne
ADD CONSTRAINT fk_panne_technicien_declinant
FOREIGN KEY (technicien_declinant_id) REFERENCES utilisateur(id);

-- Mettre à jour les données existantes: 
-- Si une panne est déclinée, le technicien actuel est celui qui a décliné
UPDATE panne
SET technicien_declinant_id = technicien_id
WHERE statut_interventions = 'DECLINEE' 
  AND raison_refus IS NOT NULL
  AND technicien_id IS NOT NULL;

-- Vérifier le résultat
SELECT id, titre, statut_interventions, technicien_id, technicien_declinant_id, raison_refus
FROM panne
WHERE statut_interventions = 'DECLINEE'
ORDER BY id DESC;
