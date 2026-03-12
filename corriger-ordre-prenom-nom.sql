-- Script pour corriger l'ordre prenom/nom si les valeurs sont inversees

-- ATTENTION: Ce script inverse les valeurs de prenom et nom
-- Executez-le SEULEMENT si vous etes sur que les valeurs sont inversees!

-- 1. D'abord, verifiez les valeurs actuelles
SELECT id, username, prenom, nom FROM utilisateurs;

-- 2. Si les valeurs sont inversees, executez cette requete pour les corriger:
-- DECOMMENTEZ les lignes ci-dessous pour executer

-- UPDATE utilisateurs
-- SET 
--     prenom = nom,
--     nom = prenom
-- WHERE prenom IS NOT NULL AND nom IS NOT NULL;

-- 3. Verifiez apres la correction
-- SELECT id, username, prenom, nom FROM utilisateurs;

-- ALTERNATIVE: Corriger utilisateur par utilisateur
-- UPDATE utilisateurs SET prenom='Doudou', nom='Fall' WHERE id=X;
-- UPDATE utilisateurs SET prenom='Marié', nom='Ousmane' WHERE id=Y;
