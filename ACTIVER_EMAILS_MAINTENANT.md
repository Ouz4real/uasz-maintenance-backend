# 📧 Activer les Emails Maintenant

## Pourquoi vous ne recevez pas d'email ?

Les emails sont **désactivés** pour éviter la lenteur. Pour les activer, suivez ces étapes :

## ⚡ Configuration Rapide (5 minutes)

### Étape 1 : Créer un mot de passe d'application Gmail

1. Allez sur https://myaccount.google.com/security
2. Cliquez sur "Validation en 2 étapes"
   - Si pas activé, activez-la d'abord
3. Cliquez sur "Mots de passe des applications"
4. Sélectionnez "Autre (nom personnalisé)"
5. Tapez "UASZ Maintenance"
6. Cliquez sur "Générer"
7. **Copiez le mot de passe** (16 caractères sans espaces)
   - Exemple : `abcd efgh ijkl mnop`

### Étape 2 : Modifier application.properties

Ouvrez : `src/main/resources/application.properties`

Trouvez ces lignes et modifiez-les :

```properties
spring.mail.username=votre-email@gmail.com
spring.mail.password=votre-mot-de-passe-application
```

Remplacez par :

```properties
spring.mail.username=VOTRE_VRAI_EMAIL@gmail.com
spring.mail.password=LE_MOT_DE_PASSE_COPIE
```

**Exemple :**
```properties
spring.mail.username=maintenance.uasz@gmail.com
spring.mail.password=abcdefghijklmnop
```

### Étape 3 : Activer les emails

Dans le même fichier, trouvez :

```properties
app.email.enabled=false
```

Changez en :

```properties
app.email.enabled=true
```

### Étape 4 : Redémarrer le backend

```bash
# Dans le terminal du backend
# Arrêtez avec Ctrl+C
# Puis relancez
mvn spring-boot:run
```

### Étape 5 : Tester

```powershell
./test-email-demandeur.ps1
```

Ou créez une demande via l'interface et vérifiez votre boîte email.

## 🔍 Vérifier les Logs

Après avoir créé une demande, regardez les logs du backend :

**Succès :**
```
- Email de confirmation envoyé au demandeur: votre-email@gmail.com
```

**Erreur :**
```
Erreur envoi email au demandeur: Authentication failed
```

## ⚠️ Problèmes Courants

### "Authentication failed"
- Vérifiez que vous utilisez un **mot de passe d'application** (pas votre mot de passe Gmail)
- Vérifiez que la validation en 2 étapes est activée

### "Connection timeout"
- Vérifiez votre connexion internet
- Vérifiez que le port 587 n'est pas bloqué

### Email non reçu
- Vérifiez les spams
- Vérifiez l'adresse email du demandeur dans la base de données
- Vérifiez les logs du backend

## 📝 Checklist

- [ ] Mot de passe d'application Gmail créé
- [ ] `spring.mail.username` modifié avec votre vrai email
- [ ] `spring.mail.password` modifié avec le mot de passe d'application
- [ ] `app.email.enabled=true`
- [ ] Backend redémarré
- [ ] Test effectué

## 🎯 Résultat Attendu

Après configuration, quand vous créez une demande :
1. La demande est créée rapidement (< 2 secondes)
2. Un email est envoyé au demandeur
3. L'email arrive dans quelques secondes

---

**Temps : 5 minutes**
**Difficulté : Facile**
