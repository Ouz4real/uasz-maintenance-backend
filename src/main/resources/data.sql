-- Script d'initialisation des utilisateurs de test
-- UASZ Maintenance Platform

-- Suppression des utilisateurs existants (optionnel, à commenter si vous voulez garder les données)
-- DELETE FROM utilisateurs WHERE username IN ('admin', 'superviseur', 'responsable', 'technicien', 'demandeur');

-- 1. ADMINISTRATEUR
-- Username: admin | Password: admin123
INSERT INTO utilisateurs (nom, prenom, username, email, password, role, actif, date_creation)
VALUES (
    'Admin',
    'Système',
    'admin',
    'admin@uasz.sn',
    '$2a$10$8K1p/a0dL3.uOYLvDfKFqOXwNlkJl8n.Yh3/Qv8K5xYvZqW8mXqGO',
    'ADMINISTRATEUR',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 2. SUPERVISEUR
-- Username: superviseur | Password: super123
INSERT INTO utilisateurs (nom, prenom, username, email, password, role, actif, date_creation)
VALUES (
    'Diop',
    'Amadou',
    'superviseur',
    'superviseur@uasz.sn',
    '$2a$10$vI8aWBnW62fHZNjXTfFlUOh9lL8lqb.Kcg00LKW/oRFu9dNEeefaa',
    'SUPERVISEUR',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 3. RESPONSABLE MAINTENANCE
-- Username: responsable | Password: resp123
INSERT INTO utilisateurs (nom, prenom, username, email, password, role, actif, date_creation)
VALUES (
    'Sow',
    'Fatou',
    'responsable',
    'responsable@uasz.sn',
    '$2a$10$N.wmzPfhYkqiEg0y.HlIQeZqcYduRgMK2iHb5/Fzh8Gq5PYnJZn9e',
    'RESPONSABLE_MAINTENANCE',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 4. TECHNICIEN
-- Username: technicien | Password: tech123
INSERT INTO utilisateurs (nom, prenom, username, email, password, role, categorie, sous_categorie, disponible, actif, date_creation)
VALUES (
    'Fall',
    'Moussa',
    'technicien',
    'technicien@uasz.sn',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'TECHNICIEN',
    'Électricité',
    'Installation électrique',
    true,
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- 5. DEMANDEUR
-- Username: demandeur | Password: dem123
INSERT INTO utilisateurs (nom, prenom, username, email, password, role, actif, date_creation)
VALUES (
    'Ndiaye',
    'Aïssatou',
    'demandeur',
    'demandeur@uasz.sn',
    '$2a$10$DpwmetQn5zNTL52qJhT8oeNJBHjQ8mQ3JVQ4E7zRHOB8bCZhFn3/m',
    'DEMANDEUR',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (username) DO NOTHING;

-- Affichage de confirmation
SELECT 'Utilisateurs de test créés avec succès!' as message;
SELECT username, role, actif FROM utilisateurs WHERE username IN ('admin', 'superviseur', 'responsable', 'technicien', 'demandeur');
