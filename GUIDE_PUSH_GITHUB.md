# Guide: Pousser vers GitHub

## Étapes Rapides

### 1. Vérifier l'état du projet

```powershell
.\verifier-avant-push.ps1
```

Ce script affiche:
- La branche actuelle
- Les fichiers modifiés
- Le remote configuré
- Les derniers commits

### 2. Pousser vers GitHub

```powershell
.\push-feature-temps-reel.ps1
```

Ce script va:
1. Créer une nouvelle branche `feature/temps-reel-notifications-statuts`
2. Ajouter tous les fichiers modifiés
3. Créer un commit avec un message détaillé
4. Pousser vers GitHub

## Détails de la Branche

### Nom
`feature/temps-reel-notifications-statuts`

### Contenu

Cette branche contient toutes les modifications pour:
- ✅ Notifications en temps réel (polling 10s)
- ✅ Statuts des demandes en temps réel (polling 15s)
- ✅ Notifications demandeur corrigées
- ✅ Dashboard Technicien intégré
- ✅ Dashboard Responsable intégré

### Fichiers Principaux Modifiés

**Backend**:
- `PanneService.java` - Notifications demandeur corrigées

**Frontend**:
- `notification.service.ts` - Polling amélioré
- `demandes-polling.service.ts` - Nouveau service (créé)
- `dashboard-technicien.component.ts` - Polling intégré
- `dashboard-responsable.component.ts` - Polling intégré

**Documentation**:
- `FIX_NOTIFICATIONS_TEMPS_REEL.md`
- `FIX_STATUTS_TEMPS_REEL.md`
- `GUIDE_NOTIFICATIONS_TEMPS_REEL.md`
- `NOTIFICATION_RESOLUE_TOUS_ROLES.md`
- `IMPLEMENTATION_COMPLETE_TEMPS_REEL.md`

## Après le Push

### Sur GitHub

1. Aller sur votre repository GitHub
2. Vous verrez un message "Compare & pull request"
3. Cliquer dessus pour créer une Pull Request

### Message de Pull Request Suggéré

```markdown
## 🚀 Feature: Temps Réel pour Notifications et Statuts

### Résumé
Implémentation du temps réel pour les notifications et les statuts des demandes/interventions. Les utilisateurs n'ont plus besoin de rafraîchir la page pour voir les mises à jour.

### Fonctionnalités Ajoutées
- ✅ Notifications en temps réel (polling 10s) pour tous les utilisateurs
- ✅ Statuts des demandes en temps réel (polling 15s)
- ✅ Notifications demandeur uniquement à la résolution
- ✅ Dashboard Technicien avec polling automatique
- ✅ Dashboard Responsable avec polling automatique

### Modifications Techniques

#### Backend
- Notification au demandeur uniquement quand responsable marque RESOLUE
- Ajout notification dans `marquerPanneResolue()` et `traiterParResponsable()`

#### Frontend
- `NotificationService`: Polling amélioré (liste complète)
- `DemandesPollingService`: Nouveau service de polling
- Intégration dans Dashboard Technicien et Responsable

### Tests
- ✅ Notifications arrivent automatiquement (max 10s)
- ✅ Statuts se mettent à jour automatiquement (max 15s)
- ✅ Fonctionne pour tous les rôles
- ✅ Pas de rafraîchissement manuel nécessaire

### Prochaines Étapes
- [ ] Intégrer polling dans Dashboard Demandeur
- [ ] Intégrer polling dans Dashboard Superviseur
- [ ] Intégrer polling dans Dashboard Admin

### Documentation
Voir les fichiers markdown créés pour plus de détails.
```

## Commandes Git Utiles

### Voir les modifications
```bash
git status
git diff
```

### Voir l'historique
```bash
git log --oneline -10
```

### Changer de branche
```bash
# Revenir à main
git checkout main

# Revenir à la feature
git checkout feature/temps-reel-notifications-statuts
```

### Mettre à jour depuis main
```bash
# Sur la branche feature
git checkout feature/temps-reel-notifications-statuts

# Récupérer les dernières modifications de main
git fetch origin
git merge origin/main
```

## Résolution de Problèmes

### Erreur: "remote origin already exists"
```bash
# Vérifier le remote
git remote -v

# Si besoin, mettre à jour l'URL
git remote set-url origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
```

### Erreur: "Permission denied"
```bash
# Vérifier votre authentification GitHub
# Utiliser un Personal Access Token si nécessaire
```

### Erreur: "Branch already exists"
```bash
# Basculer sur la branche existante
git checkout feature/temps-reel-notifications-statuts

# Ou supprimer et recréer
git branch -D feature/temps-reel-notifications-statuts
git checkout -b feature/temps-reel-notifications-statuts
```

## Bonnes Pratiques

### Avant de Pousser
1. ✅ Vérifier que le code compile (backend et frontend)
2. ✅ Tester les fonctionnalités principales
3. ✅ Vérifier qu'il n'y a pas de fichiers sensibles (mots de passe, clés API)
4. ✅ Relire le message de commit

### Après le Push
1. ✅ Vérifier sur GitHub que tout est bien poussé
2. ✅ Créer une Pull Request
3. ✅ Demander une revue de code si nécessaire
4. ✅ Merger dans main après validation

## Fichiers à Ignorer

Ces fichiers ne doivent PAS être poussés:
- `node_modules/`
- `target/`
- `.env`
- `*.log`
- Fichiers de configuration locale

Vérifiez votre `.gitignore` pour vous assurer qu'ils sont bien ignorés.
