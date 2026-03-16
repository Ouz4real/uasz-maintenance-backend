# ⚡ Solution : Lenteur de 10 secondes lors de la création de demande

## 🎯 Problème

Quand vous créez une demande, ça prend 10 secondes avant qu'elle soit enregistrée.

## ✅ Solution (30 secondes)

### 1. Ouvrez le fichier
```
src/main/resources/application.properties
```

### 2. Trouvez cette ligne
```properties
app.email.enabled=true
```

### 3. Changez-la en
```properties
app.email.enabled=false
```

### 4. Redémarrez le backend
```bash
# Arrêtez avec Ctrl+C dans le terminal du backend
# Puis relancez
mvn spring-boot:run
```

## 🧪 Vérifier que c'est résolu

```powershell
./test-performance-creation-demande.ps1
```

Ce script va :
- Créer une demande
- Mesurer le temps de réponse
- Vous dire si c'est résolu

**Résultat attendu :** < 2 secondes (au lieu de 10)

## 🤔 Pourquoi ce problème ?

Le système essaie d'envoyer un email au demandeur, mais comme les identifiants SMTP ne sont pas configurés, il attend le timeout (5 secondes) avant d'échouer.

En désactivant les emails, la création devient instantanée.

## 📧 Et les emails ?

Vous pourrez les activer plus tard quand vous serez prêt :

1. Configurez les identifiants SMTP (voir `README_EMAIL_DEMANDEUR.md`)
2. Changez `app.email.enabled=true`
3. Redémarrez le backend

## ✅ Ce qui fonctionne toujours

Même avec les emails désactivés :
- ✅ Création de demandes
- ✅ Notifications dans l'application
- ✅ Affectation de techniciens
- ✅ Toutes les autres fonctionnalités

Seuls les emails ne sont pas envoyés.

---

**Temps de fix : 30 secondes**
**Redémarrage requis : Oui**
