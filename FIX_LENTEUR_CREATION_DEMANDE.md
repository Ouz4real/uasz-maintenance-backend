# Fix : Lenteur lors de la création de demande (10 secondes)

## 🐛 Problème Identifié

Lors de la création d'une demande, il y a un délai de ~10 secondes avant que la demande soit créée.

## 🔍 Cause

Le système tente d'envoyer un email au demandeur, mais comme les identifiants SMTP ne sont pas configurés, il attend le timeout (5 secondes) avant d'échouer. Avec les retries, cela peut prendre jusqu'à 10 secondes.

## ✅ Solution Immédiate : Désactiver les emails

Dans `src/main/resources/application.properties`, changez :

```properties
app.email.enabled=false
```

**Résultat :** La création de demande sera instantanée (< 1 seconde)

## 🔄 Redémarrage Requis

Après modification, redémarrez le backend :

```bash
# Arrêtez avec Ctrl+C
mvn spring-boot:run
```

## 📧 Pour Activer les Emails Plus Tard

Quand vous serez prêt à configurer les emails :

### 1. Créer un mot de passe d'application Gmail
- https://myaccount.google.com/security
- Validation en 2 étapes → Activer
- Mots de passe des applications → Créer
- Copier le mot de passe

### 2. Modifier application.properties
```properties
spring.mail.username=votre-email@gmail.com
spring.mail.password=votre-mot-de-passe-application
app.email.enabled=true
```

### 3. Redémarrer le backend
```bash
mvn spring-boot:run
```

## 🧪 Vérifier que c'est résolu

Après redémarrage avec `app.email.enabled=false` :

1. Créez une nouvelle demande
2. Elle devrait être créée instantanément (< 1 seconde)
3. Vérifiez les logs : "Email désactivé - Email non envoyé à [email]"

## 📊 Logs Attendus

### Avec emails désactivés
```
- Notifications créées pour les responsables (nouvelle demande)
Email désactivé - Email non envoyé à demandeur@example.com
```

### Avec emails activés et configurés
```
- Notifications créées pour les responsables (nouvelle demande)
- Email de confirmation envoyé au demandeur: demandeur@example.com
```

### Avec emails activés mais mal configurés (PROBLÈME)
```
- Notifications créées pour les responsables (nouvelle demande)
Erreur envoi email au demandeur: Connection timeout
[Délai de 5-10 secondes]
```

## 💡 Recommandation

Pour le développement, gardez `app.email.enabled=false` jusqu'à ce que vous soyez prêt à configurer les emails correctement.

Cela n'affecte pas les autres fonctionnalités :
- ✅ Création de demandes
- ✅ Notifications dans l'application
- ✅ Affectation de techniciens
- ✅ Tout le reste fonctionne normalement

---

**Status :** ✅ Résolu - Emails désactivés temporairement
**Performance :** Création de demande instantanée
