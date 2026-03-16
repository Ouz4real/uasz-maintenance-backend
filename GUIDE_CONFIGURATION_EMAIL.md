# Guide de Configuration des Emails - UASZ Maintenance

## 📧 Vue d'ensemble

Le système envoie automatiquement des emails professionnels dans deux cas :
1. **Nouvelle demande** : Le demandeur reçoit un email de confirmation
2. **Notifications** : Chaque utilisateur reçoit un email pour chaque notification

## 🚀 Configuration Initiale

### Étape 1 : Configuration SMTP dans `application.properties`

Le fichier contient déjà la structure de base. Vous devez modifier ces lignes :

```properties
# ================= EMAIL =================
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=votre-email@gmail.com          # ← MODIFIER ICI
spring.mail.password=votre-mot-de-passe-application # ← MODIFIER ICI
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000

# Email de l'application
app.email.from=noreply@uasz-maintenance.sn
app.email.enabled=true
```

### Étape 2 : Obtenir un mot de passe d'application Gmail

Si vous utilisez Gmail :

1. Allez sur votre compte Google
2. Sécurité → Validation en 2 étapes (activez-la si ce n'est pas fait)
3. Sécurité → Mots de passe des applications
4. Sélectionnez "Autre" et nommez-le "UASZ Maintenance"
5. Copiez le mot de passe généré (16 caractères)
6. Collez-le dans `spring.mail.password`

### Étape 3 : Redémarrer le backend

```bash
# Arrêtez le backend (Ctrl+C)
# Puis relancez
mvn spring-boot:run
```

## 📨 Fonctionnalités Implémentées

### 1. Email de Confirmation de Demande (Demandeur)

**Quand ?** Dès qu'un demandeur crée une nouvelle demande

**Contenu :**
- Nom du demandeur
- Détails de la demande (équipement, description)
- Date de soumission
- Message de confirmation professionnel

**Template :** Design HTML professionnel avec logo UASZ

### 2. Email de Notification (Tous les utilisateurs)

**Quand ?** À chaque notification créée dans le système

**Contenu :**
- Nom de l'utilisateur
- Message de la notification
- Date et heure
- Lien vers le tableau de bord

## 🧪 Tests

### Test 1 : Email au demandeur

```powershell
./test-email-demandeur.ps1
```

Ce script :
1. Se connecte en tant que demandeur
2. Crée une nouvelle demande
3. Vérifie que l'email est envoyé

### Test 2 : Vérification manuelle

1. Créez une demande via l'interface
2. Vérifiez les logs du backend :
   ```
   Email de confirmation envoyé au demandeur: [email]
   ```
3. Vérifiez la boîte email du demandeur

## ⚙️ Configuration Avancée

### Désactiver temporairement les emails

Dans `application.properties` :
```properties
app.email.enabled=false
```

### Utiliser un autre fournisseur SMTP

#### Exemple avec Outlook/Office365 :
```properties
spring.mail.host=smtp.office365.com
spring.mail.port=587
spring.mail.username=votre-email@outlook.com
spring.mail.password=votre-mot-de-passe
```

#### Exemple avec un serveur SMTP personnalisé :
```properties
spring.mail.host=smtp.votre-domaine.com
spring.mail.port=587
spring.mail.username=noreply@votre-domaine.com
spring.mail.password=votre-mot-de-passe
```

### Modifier l'adresse d'expédition

```properties
app.email.from=maintenance@uasz.sn
```

## 🎨 Personnalisation des Templates

Les templates HTML sont dans `EmailServiceImpl.java` :

- `buildNewDemandeEmailTemplate()` : Email de nouvelle demande
- `buildNotificationEmailTemplate()` : Email de notification

Vous pouvez modifier :
- Les couleurs (codes hex)
- Le texte
- La structure HTML
- Ajouter le logo UASZ

## 🔍 Dépannage

### Problème : Emails non envoyés

**Vérifiez :**
1. Les logs du backend pour les erreurs
2. Que `app.email.enabled=true`
3. Les identifiants SMTP
4. La connexion internet du serveur

### Problème : Erreur d'authentification Gmail

**Solution :**
- Utilisez un mot de passe d'application, pas votre mot de passe Gmail
- Activez la validation en 2 étapes
- Vérifiez que "Accès moins sécurisé" n'est pas nécessaire

### Problème : Emails dans les spams

**Solution :**
- Configurez SPF/DKIM pour votre domaine
- Utilisez une adresse email professionnelle
- Demandez aux utilisateurs d'ajouter l'expéditeur aux contacts

## 📋 Prochaines Étapes

Après avoir configuré les emails pour le demandeur, nous allons ajouter :

1. ✅ Email au demandeur (nouvelle demande) - **FAIT**
2. ⏳ Email au responsable (nouvelle demande)
3. ⏳ Email au technicien (affectation)
4. ⏳ Email au demandeur (changement de statut)
5. ⏳ Email pour toutes les notifications

## 📞 Support

En cas de problème, vérifiez :
- Les logs du backend
- La configuration SMTP
- Les paramètres de sécurité de votre compte email

---

**Note :** Les emails sont envoyés de manière asynchrone. Si l'envoi échoue, la demande est quand même créée (pas de blocage).
