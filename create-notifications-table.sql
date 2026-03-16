-- Script de création de la table notifications
-- À exécuter dans PostgreSQL

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,
    utilisateur_id BIGINT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL,
    lu BOOLEAN NOT NULL DEFAULT FALSE,
    date_creation TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_lecture TIMESTAMP,
    entity_type VARCHAR(100),
    entity_id BIGINT,
    
    CONSTRAINT fk_notification_utilisateur 
        FOREIGN KEY (utilisateur_id) 
        REFERENCES utilisateurs(id) 
        ON DELETE CASCADE
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur_id ON notifications(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_notifications_lu ON notifications(lu);
CREATE INDEX IF NOT EXISTS idx_notifications_date_creation ON notifications(date_creation DESC);

-- Commentaires
COMMENT ON TABLE notifications IS 'Table des notifications utilisateur';
COMMENT ON COLUMN notifications.utilisateur_id IS 'ID de l''utilisateur destinataire';
COMMENT ON COLUMN notifications.titre IS 'Titre de la notification';
COMMENT ON COLUMN notifications.message IS 'Message détaillé de la notification';
COMMENT ON COLUMN notifications.type IS 'Type de notification: INFO, SUCCESS, WARNING, ERROR';
COMMENT ON COLUMN notifications.lu IS 'Indique si la notification a été lue';
COMMENT ON COLUMN notifications.date_creation IS 'Date de création de la notification';
COMMENT ON COLUMN notifications.date_lecture IS 'Date de lecture de la notification';
COMMENT ON COLUMN notifications.entity_type IS 'Type d''entité liée (PANNE, INTERVENTION, etc.)';
COMMENT ON COLUMN notifications.entity_id IS 'ID de l''entité liée';

-- Données de test (optionnel)
-- Remplacer les IDs utilisateur par des IDs valides de votre base

-- INSERT INTO notifications (utilisateur_id, titre, message, type, lu) VALUES
-- (1, 'Nouvelle demande', 'Une nouvelle demande de maintenance a été créée', 'INFO', false),
-- (1, 'Intervention assignée', 'Une intervention vous a été assignée', 'SUCCESS', false),
-- (2, 'Demande urgente', 'Une demande urgente nécessite votre attention', 'WARNING', false);

SELECT 'Table notifications créée avec succès!' AS resultat;
