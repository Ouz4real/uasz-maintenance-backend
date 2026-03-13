-- Script SQL pour diagnostiquer le probleme des demandeurs

-- 1. Verifier les pannes et leurs demandeurs
SELECT 
    p.id AS panne_id,
    p.titre,
    p.demandeur_id,
    p.signalee_par,
    u.id AS utilisateur_id,
    u.username,
    u.prenom,
    u.nom
FROM pannes p
LEFT JOIN utilisateurs u ON p.demandeur_id = u.id
ORDER BY p.id;

-- 2. Compter les pannes SANS demandeur_id
SELECT 
    COUNT(*) AS pannes_sans_demandeur
FROM pannes
WHERE demandeur_id IS NULL;

-- 3. Compter les pannes AVEC demandeur_id
SELECT 
    COUNT(*) AS pannes_avec_demandeur
FROM pannes
WHERE demandeur_id IS NOT NULL;

-- 4. Verifier les utilisateurs sans prenom ou nom
SELECT 
    id,
    username,
    prenom,
    nom,
    role
FROM utilisateurs
WHERE prenom IS NULL OR nom IS NULL OR prenom = '' OR nom = '';

-- 5. Lister tous les utilisateurs avec leurs infos
SELECT 
    id,
    username,
    prenom,
    nom,
    role
FROM utilisateurs
ORDER BY id;
