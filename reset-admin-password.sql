-- Script de réinitialisation du mot de passe admin
-- Mot de passe: admin123
-- Hash BCrypt généré: $2a$10$8K1p/a0dL3.uOYLvDfKFqOXwNlkJl8n.Yh3/Qv8K5xYvZqW8mXqGO

UPDATE utilisateurs 
SET mot_de_passe = '$2a$10$8K1p/a0dL3.uOYLvDfKFqOXwNlkJl8n.Yh3/Qv8K5xYvZqW8mXqGO'
WHERE username = 'admin';

-- Vérification
SELECT username, role, enabled 
FROM utilisateurs 
WHERE username = 'admin';
