-- Script pour corriger l'encodage des notifications existantes et en créer de nouvelles

-- Supprimer les anciennes notifications avec mauvais encodage
DELETE FROM notifications;

-- Créer de nouvelles notifications avec le bon encodage
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
        (admin_id, 'Nouveau compte cree', 'Un nouveau compte technicien a ete cree par le systeme', 'INFO', false, NOW() - INTERVAL '5 minutes'),
        (admin_id, 'Systeme mis a jour', 'Le systeme de notifications a ete active avec succes', 'SUCCESS', false, NOW() - INTERVAL '1 hour'),
        (admin_id, 'Alerte securite', 'Tentative de connexion echouee detectee', 'WARNING', true, NOW() - INTERVAL '2 hours');
        
        RAISE NOTICE 'Notifications creees pour admin (ID: %)', admin_id;
    END IF;
    
    -- Notifications pour le technicien
    IF tech_id IS NOT NULL THEN
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation, entity_type, entity_id) VALUES
        (tech_id, 'Nouvelle intervention', 'Une intervention urgente vous a ete assignee', 'WARNING', false, NOW() - INTERVAL '10 minutes', 'INTERVENTION', 1),
        (tech_id, 'Piece disponible', 'La piece de rechange que vous avez demandee est disponible', 'SUCCESS', false, NOW() - INTERVAL '30 minutes', 'PIECE', 5),
        (tech_id, 'Intervention terminee', 'Intervention #123 a ete marquee comme terminee', 'INFO', true, NOW() - INTERVAL '3 hours', 'INTERVENTION', 123);
        
        RAISE NOTICE 'Notifications creees pour technicien (ID: %)', tech_id;
    END IF;
    
    -- Notifications pour le responsable
    IF resp_id IS NOT NULL THEN
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation, entity_type, entity_id) VALUES
        (resp_id, 'Nouvelle demande', 'Une nouvelle demande de maintenance necessite votre validation', 'INFO', false, NOW() - INTERVAL '15 minutes', 'PANNE', 10),
        (resp_id, 'Demande urgente', 'Une demande urgente a ete signalee au batiment A', 'ERROR', false, NOW() - INTERVAL '5 minutes', 'PANNE', 15),
        (resp_id, 'Intervention approuvee', 'Intervention #456 a ete approuvee', 'SUCCESS', true, NOW() - INTERVAL '1 hour', 'INTERVENTION', 456);
        
        RAISE NOTICE 'Notifications creees pour responsable (ID: %)', resp_id;
    END IF;
    
    -- Notifications pour le demandeur
    IF dem_id IS NOT NULL THEN
        INSERT INTO notifications (utilisateur_id, titre, message, type, lu, date_creation, entity_type, entity_id) VALUES
        (dem_id, 'Demande prise en compte', 'Votre demande de maintenance a ete prise en compte', 'SUCCESS', false, NOW() - INTERVAL '20 minutes', 'PANNE', 20),
        (dem_id, 'Intervention en cours', 'Un technicien est en route pour votre demande', 'INFO', false, NOW() - INTERVAL '10 minutes', 'INTERVENTION', 789),
        (dem_id, 'Intervention terminee', 'Intervention sur votre demande est terminee', 'SUCCESS', true, NOW() - INTERVAL '2 hours', 'INTERVENTION', 789);
        
        RAISE NOTICE 'Notifications creees pour demandeur (ID: %)', dem_id;
    END IF;
END $$;

-- Afficher le résultat
SELECT 
    u.username,
    u.role,
    COUNT(n.id) as nb_notifications,
    COUNT(CASE WHEN n.lu = false THEN 1 END) as nb_non_lues
FROM utilisateurs u
LEFT JOIN notifications n ON u.id = n.utilisateur_id
GROUP BY u.id, u.username, u.role
HAVING COUNT(n.id) > 0
ORDER BY u.role;

SELECT 'Notifications corrigees avec succes!' AS resultat;
