package sn.uasz.uasz_maintenance_backend.services;

public interface EmailService {
    void sendNewDemandeEmail(String toEmail, String demandeurNom, String description, String equipement);
    void sendNotificationEmail(String toEmail, String userName, String notificationMessage);
    void sendDemandeAffecteeEmail(String toEmail, String demandeurNom, String titreDemande, String technicienNom, String dateAffectation);
    void sendDemandeResolueEmail(String toEmail, String demandeurNom, String titreDemande, String technicienNom, String dateResolution, String commentaire);
    void sendDemandePriseEnChargeEmail(String toEmail, String demandeurNom, String titreDemande, String technicienNom, String dateDebut);
    // Responsable
    void sendNouvelleDemandeResponsableEmail(String toEmail, String responsableNom, String titreDemande, String demandeurNom, String lieu, String priorite, String date);
    void sendDemandeAccepteeResponsableEmail(String toEmail, String responsableNom, String titreDemande, String technicienNom, String date);
    void sendDemandeDeclineeResponsableEmail(String toEmail, String responsableNom, String titreDemande, String technicienNom, String raisonRefus, String date);
    void sendDemandeResolueResponsableEmail(String toEmail, String responsableNom, String titreDemande, String technicienNom, String date);
    // Technicien
    void sendDemandeAffecteeTechnicienEmail(String toEmail, String technicienNom, String titreDemande, String demandeurNom, String lieu, String priorite, String date);
    // Admin
    void sendNouvelUtilisateurAdminEmail(String toEmail, String adminNom, String nouvelUtilisateurNom, String username, String email, String date);
    void sendWelcomeEmail(String toEmail, String prenomNom, String username, String motDePasseTemporaire);
}
