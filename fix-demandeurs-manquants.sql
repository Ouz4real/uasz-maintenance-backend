-- Script pour corriger les demandeurs manquants dans les pannes

-- OPTION 1: Si les pannes ont un champ 'signalee_par' (username)
-- On peut essayer de retrouver le demandeur_id a partir du username

-- Afficher les pannes sans demandeur_id mais avec signalee_par
SELECT 
    p.id,
    p.titre,
    p.signalee_par,
    u.id AS utilisateur_id,
    u.prenom,
    u.nom
FROM pannes p
LEFT JOIN utilisateurs u ON p.signalee_par = u.username
WHERE p.demandeur_id IS NULL
  AND p.signalee_par IS NOT NULL;

-- OPTION 2: Mettre a jour les pannes pour ajouter le demandeur_id
-- ATTENTION: Executez cette requete SEULEMENT si vous etes sur!

-- UPDATE pannes p
-- SET demandeur_id = (
--     SELECT u.id 
--     FROM utilisateurs u 
--     WHERE u.username = p.signalee_par
--     LIMIT 1
-- )
-- WHERE p.demandeur_id IS NULL
--   AND p.signalee_par IS NOT NULL
--   AND EXISTS (
--       SELECT 1 FROM utilisateurs u WHERE u.username = p.signalee_par
--   );

-- OPTION 3: Si les utilisateurs n'ont pas de prenom/nom
-- Mettre a jour les utilisateurs pour ajouter prenom et nom

-- Afficher les utilisateurs sans prenom/nom
SELECT id, username, prenom, nom, role
FROM utilisateurs
WHERE (prenom IS NULL OR prenom = '') 
   OR (nom IS NULL OR nom = '');

-- Exemple de mise a jour (ADAPTEZ selon vos donnees)
-- UPDATE utilisateurs
-- SET prenom = 'Prenom', nom = 'Nom'
-- WHERE id = 1 AND (prenom IS NULL OR prenom = '');
