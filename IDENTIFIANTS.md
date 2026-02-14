# Identifiants de connexion - UASZ Maintenance

## Base de données PostgreSQL
- **Host**: localhost:5432
- **Database**: maintenance_db
- **Username**: postgres
- **Password**: ouz4real

## Comptes utilisateurs de test

### 1. ADMINISTRATEUR
- **Username**: `admin`
- **Password**: `admin123`
- **Rôle**: ADMINISTRATEUR
- **Description**: Gestion complète des utilisateurs et de la plateforme

### 2. SUPERVISEUR
- **Username**: `superviseur`
- **Password**: `super123`
- **Rôle**: SUPERVISEUR
- **Description**: Suivi stratégique et tableaux de bord

### 3. RESPONSABLE MAINTENANCE
- **Username**: `responsable`
- **Password**: `resp123`
- **Rôle**: RESPONSABLE_MAINTENANCE
- **Description**: Gestion des demandes, affectation des techniciens, maintenance préventive

### 4. TECHNICIEN
- **Username**: `technicien`
- **Password**: `tech123`
- **Rôle**: TECHNICIEN
- **Catégorie**: Électricité
- **Sous-catégorie**: Installation électrique
- **Description**: Réalisation des interventions et maintenances

### 5. DEMANDEUR
- **Username**: `demandeur`
- **Password**: `dem123`
- **Rôle**: DEMANDEUR
- **Description**: Signalement de pannes et suivi des demandes

---

## Instructions pour initialiser les utilisateurs

### Option 1: Via SQL (Recommandé)
Exécutez le script SQL `src/main/resources/data.sql` qui sera créé automatiquement au démarrage de l'application.

### Option 2: Via l'interface Administrateur
1. Connectez-vous avec le compte admin
2. Allez dans "Gestion des utilisateurs"
3. Créez de nouveaux utilisateurs avec le bouton "Nouvel utilisateur"

---

## URLs de l'application

- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080
- **Swagger UI**: http://localhost:8080/swagger-ui.html

---

## Notes importantes

- Les mots de passe sont hashés avec BCrypt
- Le token JWT expire après 24 heures
- Pour réinitialiser un mot de passe, utilisez l'interface administrateur
- Les techniciens doivent avoir une catégorie et sous-catégorie définies
