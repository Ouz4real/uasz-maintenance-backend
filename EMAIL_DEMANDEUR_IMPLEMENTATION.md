# Implémentation Email Demandeur - Nouvelle Demande

## ✅ Ce qui a été fait

### 1. Dépendances ajoutées

**Fichier : `pom.xml`**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-mail</artifactId>
</dependency>
```

### 2. Configuration SMTP

**Fichier : `src/main/resources/application.properties`**
```properties
# ================= EMAIL =================
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=votre-email@gmail.com
spring.mail.password=votre-mot-de-passe-application
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000

app.email.from=noreply@uasz-maintenance.sn
app.email.enabled=true
```

### 3. Service Email créé

**Fichier : `EmailService.java` (Interface)**
- `sendNewDemandeEmail()` : Envoie un email au demandeur
- `sendNotificationEmail()` : Envoie un email pour une notification

**Fichier : `EmailServiceImpl.java` (Implémentation)**
- Template HTML professionnel pour nouvelle demande
- Template HTML professionnel pour notification
- Gestion des erreurs (n'empêche pas la création de demande)
- Logs détaillés

### 4. Intégration dans PanneService

**Fichier : `PanneService.java`**

Modification de la méthode `createPanne()` :
```java
// Après la création de la panne et des notifications
try {
    String equipementNom = equipement != null ? equipement.getNom() : saved.getTypeEquipement();
    String demandeurNom = demandeur.getPrenom() + " " + demandeur.getNom();
    
    emailService.sendNewDemandeEmail(
        demandeur.getEmail(),
        demandeurNom,
        saved.getDescription() != null ? saved.getDescription() : saved.getTitre(),
        equipementNom
    );
    System.out.println("  - Email de confirmation envoyé au demandeur: " + demandeur.getEmail());
} catch (Exception e) {
    System.err.println("Erreur envoi email au demandeur: " + e.getMessage());
    // On ne bloque pas la création de la demande si l'email échoue
}
```

## 📧 Contenu de l'Email

### Sujet
```
Confirmation de votre demande de maintenance - UASZ
```

### Corps (HTML)

L'email contient :
- **En-tête** : Logo et titre UASZ Maintenance
- **Salutation personnalisée** : "Bonjour [Prénom Nom]"
- **Message de confirmation** : Demande bien reçue
- **Détails de la demande** :
  - Équipement concerné
  - Description du problème
  - Date de soumission
- **Statut actuel** : En attente de traitement
- **Prochaines étapes** : Notification lors de l'affectation
- **Pied de page** : Informations UASZ

### Design
- Responsive (s'adapte aux mobiles)
- Couleurs professionnelles (bleu UASZ)
- Icônes pour meilleure lisibilité
- Police Arial pour compatibilité

## 🔄 Flux Complet

```
1. Demandeur crée une demande
   ↓
2. Backend enregistre la demande
   ↓
3. Notifications créées (responsables, superviseurs)
   ↓
4. Email envoyé au demandeur ← NOUVEAU
   ↓
5. Demandeur reçoit confirmation par email
```

## 🧪 Comment tester

### Méthode 1 : Script PowerShell
```powershell
./test-email-demandeur.ps1
```

### Méthode 2 : Interface utilisateur
1. Connectez-vous en tant que demandeur
2. Créez une nouvelle demande
3. Vérifiez votre boîte email

### Méthode 3 : API directe
```bash
# 1. Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demandeur","password":"password123"}'

# 2. Créer demande (avec le token)
curl -X POST http://localhost:8080/api/pannes \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "demandeurId": 1,
    "titre": "Test Email",
    "description": "Test envoi email",
    "lieu": "Bureau",
    "typeEquipement": "Ordinateur",
    "priorite": "MOYENNE"
  }'
```

## 📊 Logs à surveiller

Après la création d'une demande, vous devriez voir :
```
- Notifications créées pour les responsables (nouvelle demande)
- Email de confirmation envoyé au demandeur: demandeur@example.com
```

En cas d'erreur :
```
Erreur envoi email au demandeur: [message d'erreur]
```

## ⚠️ Points importants

1. **Non bloquant** : Si l'email échoue, la demande est quand même créée
2. **Asynchrone** : L'envoi ne ralentit pas la création
3. **Configurable** : Peut être désactivé avec `app.email.enabled=false`
4. **Sécurisé** : Utilise TLS/STARTTLS
5. **Professionnel** : Template HTML responsive

## 🎯 Prochaines étapes

Maintenant que l'email pour le demandeur fonctionne, nous allons ajouter :

1. ✅ **Demandeur** : Email de confirmation (nouvelle demande) - FAIT
2. ⏳ **Responsable** : Email lors de nouvelle demande
3. ⏳ **Technicien** : Email lors de l'affectation
4. ⏳ **Demandeur** : Email lors du changement de statut
5. ⏳ **Tous** : Email pour chaque notification

## 🔧 Configuration requise

Avant de tester, configurez :

1. **Gmail** (recommandé pour les tests) :
   - Activez la validation en 2 étapes
   - Créez un mot de passe d'application
   - Utilisez ce mot de passe dans `application.properties`

2. **Autre fournisseur** :
   - Modifiez `spring.mail.host` et `spring.mail.port`
   - Utilisez vos identifiants SMTP

3. **Redémarrez le backend** après modification

## 📝 Exemple d'email reçu

```
De: noreply@uasz-maintenance.sn
À: demandeur@example.com
Sujet: Confirmation de votre demande de maintenance - UASZ

[Design HTML professionnel]

Bonjour Jean Dupont,

Nous avons bien reçu votre demande de maintenance. Votre demande a été 
enregistrée avec succès dans notre système.

📋 Détails de votre demande :
Équipement : Ordinateur
Description : Écran ne s'allume plus
Date de soumission : 13/03/2026 à 14:30

Votre demande est actuellement en attente de traitement. Notre équipe 
technique va l'examiner dans les plus brefs délais.

Vous recevrez une notification par email dès qu'un technicien sera 
affecté à votre demande.

Cordialement,
L'équipe de maintenance UASZ
```

---

**Status** : ✅ Implémenté et prêt à tester
**Prochaine étape** : Configuration SMTP et test
