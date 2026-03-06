# 🔐 Guide de connexion - UASZ Maintenance

## 📋 Identifiants de test

Les utilisateurs suivants sont créés automatiquement au démarrage de l'application:

### 👨‍💼 ADMINISTRATEUR
```
Username: admin
Password: admin123
Rôle: ADMINISTRATEUR
```
**Accès:**
- Gestion complète des utilisateurs (création, modification, suppression)
- Activation/désactivation des comptes
- Réinitialisation des mots de passe
- Vue d'ensemble de tous les utilisateurs

---

### 👁️ SUPERVISEUR
```
Username: superviseur
Password: super123
Rôle: SUPERVISEUR
```
**Accès:**
- Tableaux de bord stratégiques
- Suivi global des interventions
- Statistiques et rapports
- Vue d'ensemble de la plateforme

---

### 🔧 RESPONSABLE MAINTENANCE
```
Username: responsable
Password: resp123
Rôle: RESPONSABLE_MAINTENANCE
```
**Accès:**
- Gestion des demandes de maintenance
- Affectation des techniciens
- Priorisation des interventions
- Création et suivi des maintenances préventives
- Gestion du stock d'équipements
- Création de demandes de panne
- Rapports et statistiques

---

### 👷 TECHNICIEN
```
Username: technicien
Password: tech123
Rôle: TECHNICIEN
Catégorie: Électricité
Sous-catégorie: Installation électrique
```
**Accès:**
- Vue des interventions assignées
- Réalisation des interventions
- Rapport d'intervention
- Gestion des pièces utilisées
- Maintenances préventives assignées
- Historique des interventions

---

### 👤 DEMANDEUR
```
Username: demandeur
Password: dem123
Rôle: DEMANDEUR
```
**Accès:**
- Création de demandes de panne
- Suivi de ses demandes
- Historique des signalements
- Notifications sur l'avancement

---

## 🚀 Comment se connecter

### 1. Démarrer l'application

**Backend (Spring Boot):**
```bash
cd uasz-maintenance-backend
./mvnw spring-boot:run
```
Le backend sera accessible sur: http://localhost:8080

**Frontend (Angular):**
```bash
cd uasz-maintenance-frontend
npm install
npm start
```
Le frontend sera accessible sur: http://localhost:4200

### 2. Accéder à l'interface de connexion

Ouvrez votre navigateur et allez sur: http://localhost:4200

### 3. Se connecter

1. Entrez un des usernames ci-dessus
2. Entrez le mot de passe correspondant
3. Cliquez sur "Se connecter"

Vous serez automatiquement redirigé vers le dashboard correspondant à votre rôle.

---

## 🔄 Réinitialisation des données

Si vous souhaitez réinitialiser les utilisateurs de test:

1. Arrêtez l'application
2. Supprimez les utilisateurs de la base de données:
```sql
DELETE FROM utilisateurs WHERE username IN ('admin', 'superviseur', 'responsable', 'technicien', 'demandeur');
```
3. Redémarrez l'application - les utilisateurs seront recréés automatiquement

---

## 🛠️ Création de nouveaux utilisateurs

### Via l'interface Administrateur

1. Connectez-vous avec le compte `admin`
2. Allez dans "Gestion des utilisateurs"
3. Cliquez sur "Nouvel utilisateur"
4. Remplissez le formulaire:
   - Nom et Prénom
   - Username (unique)
   - Email (optionnel)
   - Mot de passe
   - Rôle
   - Pour les techniciens: Catégorie et Sous-catégorie

### Via l'API REST

```bash
POST http://localhost:8080/api/utilisateurs
Content-Type: application/json
Authorization: Bearer {votre_token_jwt}

{
  "nom": "Nom",
  "prenom": "Prénom",
  "username": "username",
  "email": "email@example.com",
  "password": "motdepasse",
  "role": "DEMANDEUR",
  "actif": true
}
```

---

## 📊 Base de données

**Configuration PostgreSQL:**
```
Host: localhost
Port: 5432
Database: maintenance_db
Username: postgres
Password: ouz4real
```

**Connexion via psql:**
```bash
psql -h localhost -U postgres -d maintenance_db
```

**Voir tous les utilisateurs:**
```sql
SELECT id, username, nom, prenom, email, role, actif 
FROM utilisateurs 
ORDER BY date_creation DESC;
```

---

## 🔒 Sécurité

- Les mots de passe sont hashés avec BCrypt
- Les tokens JWT expirent après 24 heures
- Les mots de passe de test sont simples - **changez-les en production!**
- Pour changer un mot de passe, utilisez l'interface administrateur

---

## ❓ Problèmes courants

### "Utilisateur ou mot de passe incorrect"
- Vérifiez que vous utilisez le bon username (pas l'email)
- Vérifiez que le mot de passe est correct (sensible à la casse)
- Assurez-vous que l'utilisateur est actif

### "Token expiré"
- Reconnectez-vous pour obtenir un nouveau token
- Le token JWT expire après 24 heures

### "Utilisateurs non créés au démarrage"
- Vérifiez les logs de l'application
- Vérifiez que la base de données est accessible
- Vérifiez que la table `utilisateurs` existe

---

## 📞 Support

Pour toute question ou problème, consultez:
- Les logs de l'application: `logs/application.log`
- La documentation Swagger: http://localhost:8080/swagger-ui.html
- Le fichier README.md du projet
