-- Script pour verifier l'ordre prenom/nom dans la base de donnees

-- Afficher tous les utilisateurs avec prenom et nom
SELECT 
    id,
    username,
    prenom,
    nom,
    CONCAT(prenom, ' ', nom) AS "Prenom Nom (correct)",
    CONCAT(nom, ' ', prenom) AS "Nom Prenom (inverse)"
FROM utilisateurs
WHERE prenom IS NOT NULL AND nom IS NOT NULL
ORDER BY id;

-- Verifier si les valeurs sont inversees
-- Si vous voyez que "Nom Prenom" correspond a ce qui s'affiche,
-- alors les valeurs sont inversees dans la base
