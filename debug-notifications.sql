-- Script pour déboguer les notifications

-- 1. Vérifier tous les administrateurs
SELECT id, username, nom, prenom, role, enabled 
FROM utilisateurs 
WHERE role = 'ADMINISTRATEUR';

-- 2. Vérifier toutes les notifications
SELECT * FROM notifications ORDER BY date_creation DESC LIMIT 10;

-- 3. Vérifier les notifications pour les utilisateurs
SELECT n.*, u.username as admin_username
FROM notifications n
LEFT JOIN utilisateurs u ON n.utilisateur_id = u.id
WHERE n.entity_type = 'UTILISATEUR'
ORDER BY n.date_creation DESC;

-- 4. Compter les notifications non lues par utilisateur
SELECT utilisateur_id, COUNT(*) as nb_non_lues
FROM notifications
WHERE lu = false
GROUP BY utilisateur_id;
