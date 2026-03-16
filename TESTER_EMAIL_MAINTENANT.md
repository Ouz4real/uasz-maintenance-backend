# 📧 Tester l'Envoi d'Email Maintenant

## ✅ Configuration Actuelle

D'après le test, vos emails sont :
- ✅ **Activés** (`app.email.enabled=true`)
- ✅ **Configurés** (identifiants SMTP présents)

## 🧪 Test Simple (2 minutes)

### Étape 1 : Créer une demande via l'interface

1. Ouvrez votre navigateur : http://localhost:4200
2. Connectez-vous en tant que demandeur :
   - **Username** : `demandeur`
   - **Mot de passe** : `dem123`
3. Cliquez sur "Nouvelle demande"
4. Remplissez le formulaire :
   - Titre : "Test Email"
   - Description : "Test d'envoi d'email"
   - Lieu : "Bureau"
   - Type d'équipement : "Ordinateur"
5. Cliquez sur "Enregistrer"

### Étape 2 : Vérifier les logs du backend

Dans le terminal du backend, vous devriez voir :

**Si l'email est envoyé avec succès :**
```
- Notifications créées pour les responsables (nouvelle demande)
- Email de confirmation envoyé au demandeur: demandeur@uasz.sn
```

**Si l'email échoue :**
```
Erreur envoi email au demandeur: [message d'erreur]
```

### Étape 3 : Vérifier votre boîte email

1. Ouvrez la boîte email : `demandeur@uasz.sn` (ou l'email configuré)
2. Cherchez un email avec le sujet : "Confirmation de votre demande de maintenance - UASZ"
3. Vérifiez aussi les **spams**

## 📊 Résultats Possibles

### ✅ Email reçu
Parfait ! Le système fonctionne. Vous recevrez maintenant un email à chaque nouvelle demande.

### ❌ Email non reçu

**Vérifiez :**

1. **Les logs du backend** - Y a-t-il une erreur ?

2. **Les spams** - L'email peut être dans les spams

3. **L'adresse email du demandeur** - Vérifiez dans la base de données :
   ```sql
   SELECT email FROM utilisateurs WHERE username = 'demandeur';
   ```

4. **La configuration SMTP** dans `application.properties` :
   - `spring.mail.username` est correct ?
   - `spring.mail.password` est le mot de passe d'application ?

### ⚠️ Erreur "Authentication failed"

**Cause :** Identifiants SMTP incorrects

**Solution :**
1. Vérifiez que vous utilisez un **mot de passe d'application** Gmail (pas votre mot de passe Gmail)
2. Vérifiez que la validation en 2 étapes est activée
3. Recréez un mot de passe d'application si nécessaire

### ⚠️ Erreur "Connection timeout"

**Cause :** Problème réseau ou firewall

**Solution :**
1. Vérifiez votre connexion internet
2. Vérifiez que le port 587 n'est pas bloqué
3. Essayez avec le port 465 (SSL) :
   ```properties
   spring.mail.port=465
   spring.mail.properties.mail.smtp.ssl.enable=true
   ```

## 🔍 Diagnostic Avancé

Si l'email n'est toujours pas envoyé, vérifiez les logs complets du backend pour voir l'erreur exacte.

Les erreurs courantes :
- `Authentication failed` → Mauvais identifiants
- `Connection timeout` → Problème réseau
- `Invalid Addresses` → Adresse email incorrecte
- `Mail server connection failed` → Serveur SMTP inaccessible

## 💡 Astuce

Pour tester rapidement, vous pouvez modifier l'email du demandeur dans la base de données pour utiliser votre propre email :

```sql
UPDATE utilisateurs 
SET email = 'votre-email@gmail.com' 
WHERE username = 'demandeur';
```

Puis créez une nouvelle demande et vérifiez votre boîte email.

---

**Temps de test : 2 minutes**
**Difficulté : Facile**
