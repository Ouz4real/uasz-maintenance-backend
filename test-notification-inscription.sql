-- Script pour tester la notification d'inscription d'utilisateur

-- Créer une notification d'inscription pour l'admin
DO $$
DECLARE
    admin_id BIGINT;
    new_user_id BIGINT;
BEGIN
    -- Trouver l'ID de l'admin
    SELECT id INTO admin_id FROM utilisateurs WHERE role = 'ADMINISTRATEUR' LIMIT 1;
    
    -- Trouver un utilisateur récent (ou utiliser un ID fictif)
    SELECT id INTO new_user_id FROM utilisateurs WHERE role = 'DEMANDEUR' ORDER BY id DESC LIMIT 1;
    
    IF admin_id IS NOT NULL AND new_user_id IS NOT NULL THEN
        -- Créer la notification
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation, entity_type, entity_id) 
        VALUES (
            admin_id,
            E'Nouvel utilisateur inscrit',
            E'Jean Dupont (jdupont) s''est inscrit sur la plateforme',
            'INFO',
            false,
            NOW(),
            'UTILISATEUR',
            new_user_id
        );
        
        RAISE NOTICE 'Notification d''inscription créée pour admin (ID: %) pointant vers utilisateur (ID: %)', admin_id, new_user_id;
    ELSE
        RAISE NOTICE 'Admin ou utilisateur non trouvé';
    END IF;
END $$;

-- Afficher les notifications de l'admin
SELECT 
    n.id,
    n.titre,
    n.message,
    n.type,
    n.lu,
    n.entity_type,
    n.entity_id,
    n.date_creation
FROM notifications n
JOIN utilisateurs u ON n.utilisateur_id = u.id
WHERE u.role = 'ADMINISTRATEUR'
ORDER BY n.date_creation DESC
LIMIT 5;

SELECT E'✅ Notification de test créée avec succès!' AS resultat;
