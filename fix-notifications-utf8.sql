-- Script pour créer des notifications avec accents corrects en UTF-8

-- Supprimer les anciennes notifications
DELETE FROM notifications;

-- Créer de nouvelles notifications avec accents
DO $$
DECLARE
    admin_id BIGINT;
    tech_id BIGINT;
    resp_id BIGINT;
    dem_id BIGINT;
BEGIN
    -- Trouver les IDs des utilisateurs
    SELECT id INTO admin_id FROM utilisateurs WHERE role = 'ADMINISTRATEUR' LIMIT 1;
    SELECT id INTO tech_id FROM utilisateurs WHERE role = 'TECHNICIEN' LIMIT 1;
    SELECT id INTO resp_id FROM utilisateurs WHERE role = 'RESPONSABLE_MAINTENANCE' LIMIT 1;
    SELECT id INTO dem_id FROM utilisateurs WHERE role = 'DEMANDEUR' LIMIT 1;
    
    -- Notifications pour l'admin
    IF admin_id IS NOT NULL THEN
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation) VALUES
        (admin_id, E'Nouveau compte créé', E'Un nouveau compte technicien a été créé par le système', 'INFO', false, NOW() - INTERVAL '5 minutes'),
        (admin_id, E'Système mis à jour', E'Le système de notifications a été activé avec succès', 'SUCCESS', false, NOW() - INTERVAL '1 hour'),
        (admin_id, E'Alerte sécurité', E'Tentative de connexion échouée détectée', 'WARNING', true, NOW() - INTERVAL '2 hours');
        
        RAISE NOTICE 'Notifications créées pour admin (ID: %)', admin_id;
    END IF;
    
    -- Notifications pour le technicien
    IF tech_id IS NOT NULL THEN
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation, entity_type, entity_id) VALUES
        (tech_id, E'Nouvelle intervention', E'Une intervention urgente vous a été assignée', 'WARNING', false, NOW() - INTERVAL '10 minutes', 'INTERVENTION', 1),
        (tech_id, E'Pièce disponible', E'La pièce de rechange que vous avez demandée est disponible', 'SUCCESS', false, NOW() - INTERVAL '30 minutes', 'PIECE', 5),
        (tech_id, E'Intervention terminée', E'L''intervention #123 a été marquée comme terminée', 'INFO', true, NOW() - INTERVAL '3 hours', 'INTERVENTION', 123);
        
        RAISE NOTICE 'Notifications créées pour technicien (ID: %)', tech_id;
    END IF;
    
    -- Notifications pour le responsable
    IF resp_id IS NOT NULL THEN
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation, entity_type, entity_id) VALUES
        (resp_id, E'Nouvelle demande', E'Une nouvelle demande de maintenance nécessite votre validation', 'INFO', false, NOW() - INTERVAL '15 minutes', 'PANNE', 10),
        (resp_id, E'Demande urgente', E'Une demande urgente a été signalée au bâtiment A', 'ERROR', false, NOW() - INTERVAL '5 minutes', 'PANNE', 15),
        (resp_id, E'Intervention approuvée', E'L''intervention #456 a été approuvée', 'SUCCESS', true, NOW() - INTERVAL '1 hour', 'INTERVENTION', 456);
        
        RAISE NOTICE 'Notifications créées pour responsable (ID: %)', resp_id;
    END IF;
    
    -- Notifications pour le demandeur
    IF dem_id IS NOT NULL THEN
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation, entity_type, entity_id) VALUES
        (dem_id, E'Demande prise en compte', E'Votre demande de maintenance a été prise en compte', 'SUCCESS', false, NOW() - INTERVAL '20 minutes', 'PANNE', 20),
        (dem_id, E'Intervention en cours', E'Un technicien est en route pour votre demande', 'INFO', false, NOW() - INTERVAL '10 minutes', 'INTERVENTION', 789),
        (dem_id, E'Intervention terminée', E'L''intervention sur votre demande est terminée', 'SUCCESS', true, NOW() - INTERVAL '2 hours', 'INTERVENTION', 789);
        
        RAISE NOTICE 'Notifications créées pour demandeur (ID: %)', dem_id;
    END IF;
END $$;

-- Afficher le résultat
SELECT 'Notifications avec accents créées avec succès!' AS resultat;
