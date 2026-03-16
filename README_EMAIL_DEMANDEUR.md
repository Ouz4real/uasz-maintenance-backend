# 📧 Email Automatique pour le Demandeur

## Qu'est-ce qui a été ajouté ?

Désormais, **chaque fois qu'un demandeur crée une nouvelle demande**, il reçoit automatiquement un email professionnel de confirmation.

## 🎯 Exemple d'email

```
De: noreply@uasz-maintenance.sn
À: demandeur@example.com
Sujet: Confirmation de votre demande de maintenance - UASZ

Bonjour Jean Dupont,

Nous avons bien reçu votre demande de maintenance.

📋 Détails de votre demande :
• Équipement : Ordinateur
• Description : Écran ne s'allume plus
• Date : 13/03/2026 à 14:30

Votre demande est en attente de traitement.
Vous recevrez une notification dès qu'un technicien sera affecté.

Cordialement,
L'équipe de maintenance UASZ
```

## ⚡ Configuration Rapide (5 minutes)

### 1. Créez un mot de passe d'application Gmail

1. Allez sur https://myaccount.google.com/security
2. Activez "Validation en 2 étapes"
3. Cliquez sur "Mots de passe des applications"
4. Créez un mot de passe pour "UASZ Maintenance"
5. Copiez le mot de passe (16 caractères)

### 2. Modifiez application.properties

Ouvrez : `src/main/resources/application.properties`

Changez ces 2 lignes :
```properties
spring.mail.username=VOTRE_EMAIL@gmail.com
spring.mail.password=VOTRE_MOT_DE_PASSE_APPLICATION
```

### 3. Redémarrez le backend

```bash
# Arrêtez avec Ctrl+C
# Puis relancez
mvn spring-boot:run
```

### 4. Testez

```powershell
./test-email-demandeur.ps1
```

## ✅ Vérification

Lancez d'abord :
```powershell
./verifier-config-email.ps1
```

Ce script vérifie que tout est bien configuré.

## 📚 Documentation Complète

- **Guide rapide** : `ETAPES_CONFIGURATION_EMAIL_DEMANDEUR.md`
- **Guide complet** : `GUIDE_CONFIGURATION_EMAIL.md`
- **Détails techniques** : `EMAIL_DEMANDEUR_IMPLEMENTATION.md`

## 🔧 Désactiver temporairement

Dans `application.properties` :
```properties
app.email.enabled=false
```

## 🆘 Problèmes ?

### Email non reçu ?
1. Vérifiez les spams
2. Vérifiez les logs du backend
3. Vérifiez que `app.email.enabled=true`

### Erreur d'authentification ?
- Utilisez un mot de passe d'application (pas votre mot de passe Gmail)
- Activez la validation en 2 étapes sur Gmail

### Backend ne démarre pas ?
```bash
mvn clean install
mvn spring-boot:run
```

## 📋 Checklist

- [ ] Mot de passe d'application Gmail créé
- [ ] `spring.mail.username` modifié
- [ ] `spring.mail.password` modifié
- [ ] Backend redémarré
- [ ] Test lancé avec `./test-email-demandeur.ps1`
- [ ] Email reçu dans la boîte du demandeur

## ⏭️ Prochaine Étape

Une fois que cela fonctionne, nous ajouterons les emails pour :
- Les responsables (nouvelle demande)
- Les techniciens (affectation)
- Toutes les notifications

---

**Temps de configuration : 5 minutes**
**Difficulté : Facile**
