# Étapes de Configuration - Email Demandeur

## 🎯 Objectif
Envoyer automatiquement un email professionnel au demandeur dès qu'il crée une nouvelle demande de maintenance.

## ✅ Implémentation Terminée

Tous les fichiers ont été créés et modifiés. Il ne reste plus qu'à configurer et tester.

## 📋 Checklist de Configuration

### Étape 1 : Préparer un compte email (5 min)

**Option A : Gmail (Recommandé pour les tests)**
1. Utilisez un compte Gmail existant ou créez-en un
2. Activez la validation en 2 étapes :
   - https://myaccount.google.com/security
   - Validation en 2 étapes → Activer
3. Créez un mot de passe d'application :
   - Mots de passe des applications
   - Sélectionnez "Autre" → "UASZ Maintenance"
   - Copiez le mot de passe (16 caractères sans espaces)

**Option B : Autre fournisseur**
- Outlook, Office365, ou serveur SMTP personnalisé
- Notez : host, port, username, password

### Étape 2 : Configurer application.properties (2 min)

Ouvrez : `src/main/resources/application.properties`

Modifiez ces lignes :
```properties
spring.mail.username=VOTRE_EMAIL@gmail.com
spring.mail.password=VOTRE_MOT_DE_PASSE_APPLICATION
```

**Exemple :**
```properties
spring.mail.username=maintenance.uasz@gmail.com
spring.mail.password=abcd efgh ijkl mnop
```

### Étape 3 : Recompiler le projet (1 min)

```bash
# Dans le terminal, à la racine du projet backend
mvn clean install
```

Ou si le backend tourne déjà :
```bash
# Arrêtez avec Ctrl+C
# Puis relancez
mvn spring-boot:run
```

### Étape 4 : Tester (2 min)

**Méthode rapide :**
```powershell
./test-email-demandeur.ps1
```

**Vérifications :**
1. Le script affiche "✓ Demande créée avec succès!"
2. Les logs backend montrent : "Email de confirmation envoyé au demandeur: [email]"
3. Vérifiez la boîte email du demandeur

### Étape 5 : Vérifier l'email reçu

L'email devrait contenir :
- ✅ Sujet : "Confirmation de votre demande de maintenance - UASZ"
- ✅ Salutation personnalisée avec le nom du demandeur
- ✅ Détails de la demande (équipement, description, date)
- ✅ Message professionnel
- ✅ Design HTML propre

## 🔧 Configuration Avancée (Optionnel)

### Personnaliser l'adresse d'expédition

Dans `application.properties` :
```properties
app.email.from=maintenance@uasz.sn
```

### Désactiver temporairement les emails

```properties
app.email.enabled=false
```

### Utiliser Outlook au lieu de Gmail

```properties
spring.mail.host=smtp.office365.com
spring.mail.port=587
spring.mail.username=votre-email@outlook.com
spring.mail.password=votre-mot-de-passe
```

## 🐛 Dépannage

### Problème : "Authentication failed"

**Cause :** Mauvais identifiants ou mot de passe d'application non utilisé

**Solution :**
- Vérifiez que vous utilisez un mot de passe d'application (pas votre mot de passe Gmail)
- Vérifiez qu'il n'y a pas d'espaces dans le mot de passe
- Activez la validation en 2 étapes sur Gmail

### Problème : "Connection timeout"

**Cause :** Firewall ou problème réseau

**Solution :**
- Vérifiez votre connexion internet
- Vérifiez que le port 587 n'est pas bloqué
- Essayez le port 465 avec SSL

### Problème : Email non reçu

**Vérifications :**
1. Regardez dans les spams
2. Vérifiez les logs backend pour les erreurs
3. Vérifiez que `app.email.enabled=true`
4. Vérifiez l'adresse email du demandeur dans la base de données

### Problème : Backend ne démarre pas

**Cause :** Dépendance Maven non téléchargée

**Solution :**
```bash
mvn clean install -U
```

## 📊 Logs à surveiller

### Succès
```
- Notifications créées pour les responsables (nouvelle demande)
- Email de confirmation envoyé au demandeur: demandeur@example.com
```

### Erreur
```
Erreur envoi email au demandeur: Authentication failed
```

## 🎓 Comprendre le Flux

```
┌─────────────────┐
│   Demandeur     │
│  crée demande   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PanneService   │
│  createPanne()  │
└────────┬────────┘
         │
         ├──► 1. Enregistre la demande en BDD
         │
         ├──► 2. Crée notifications (responsables)
         │
         ├──► 3. Envoie email au demandeur ← NOUVEAU
         │
         └──► 4. Retourne la demande créée
```

## 📝 Fichiers Modifiés/Créés

### Modifiés
- ✅ `pom.xml` - Ajout dépendance spring-boot-starter-mail
- ✅ `application.properties` - Configuration SMTP
- ✅ `PanneService.java` - Ajout envoi email

### Créés
- ✅ `EmailService.java` - Interface du service
- ✅ `EmailServiceImpl.java` - Implémentation avec templates HTML
- ✅ `test-email-demandeur.ps1` - Script de test
- ✅ `GUIDE_CONFIGURATION_EMAIL.md` - Guide complet
- ✅ `EMAIL_DEMANDEUR_IMPLEMENTATION.md` - Documentation technique

## ⏭️ Prochaines Étapes

Une fois que l'email pour le demandeur fonctionne, nous pourrons ajouter :

1. ✅ Email au demandeur (nouvelle demande) - **TERMINÉ**
2. ⏳ Email au responsable (nouvelle demande)
3. ⏳ Email au technicien (affectation)
4. ⏳ Email au demandeur (statut changé)
5. ⏳ Email pour toutes les notifications

## 💡 Conseils

1. **Testez d'abord avec Gmail** - C'est le plus simple
2. **Gardez les logs ouverts** - Pour voir les erreurs en temps réel
3. **Vérifiez les spams** - Les premiers emails peuvent y atterrir
4. **Utilisez un email de test** - Pas votre email principal
5. **Documentez votre config** - Notez les paramètres qui fonctionnent

## ✨ Résultat Attendu

Après configuration, chaque fois qu'un demandeur crée une demande :
- ✅ La demande est enregistrée
- ✅ Les notifications sont créées
- ✅ Un email professionnel est envoyé au demandeur
- ✅ Le demandeur reçoit une confirmation claire et détaillée

---

**Temps estimé total : 10 minutes**
**Difficulté : Facile**
**Prérequis : Compte Gmail avec validation 2 étapes**
