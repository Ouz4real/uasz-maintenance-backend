-- Script SQL pour vérifier et corriger les noms des techniciens

-- 1. Vérifier les techniciens sans prénom/nom
SELECT id, username, nom, prenom, email, role
FROM utilisateurs
WHERE role = 'TECHNICIEN'
AND (nom IS NULL OR nom = '' OR prenom IS NULL OR prenom = '');

-- 2. Mettre à jour les techniciens qui n'ont pas de prénom/nom
-- (Exemple: utiliser le username comme nom si vide)

-- Pour le technicien avec username 'technicien'
UPDATE utilisateurs
SET nom = 'Technicien',
    prenom = 'Service'
WHERE username = 'technicien'
AND role = 'TECHNICIEN'
AND (nom IS NULL OR nom = '' OR prenom IS NULL OR prenom = '');

-- 3. Vérifier tous les utilisateurs sans prénom/nom
SELECT id, username, nom, prenom, email, role
FROM utilisateurs
WHERE (nom IS NULL OR nom = '' OR prenom IS NULL OR prenom = '');

-- 4. Afficher tous les techniciens
SELECT id, username, nom, prenom, email, role, enabled
FROM utilisateurs
WHERE role = 'TECHNICIEN'
ORDER BY username;
