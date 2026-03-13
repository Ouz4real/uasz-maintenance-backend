# Script complet pour pousser vers GitHub (initialisation + push)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Push Complet vers GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# ÉTAPE 1: Initialiser Git si nécessaire
# ============================================
Write-Host "ÉTAPE 1: Vérification Git" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

if (-not (Test-Path ".git")) {
    Write-Host "Repository Git non initialisé. Initialisation..." -ForegroundColor Yellow
    git init
    Write-Host "✓ Git initialisé" -ForegroundColor Green
} else {
    Write-Host "✓ Repository Git déjà initialisé" -ForegroundColor Green
}
Write-Host ""

# ============================================
# ÉTAPE 2: Configuration utilisateur
# ============================================
Write-Host "ÉTAPE 2: Configuration utilisateur" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Write-Host "Configuration du nom d'utilisateur..." -ForegroundColor Yellow
    Write-Host "Entrez votre nom (ex: Jean Dupont):" -ForegroundColor Cyan
    $name = Read-Host "Nom"
    git config user.name "$name"
    Write-Host "✓ Nom configuré: $name" -ForegroundColor Green
} else {
    Write-Host "✓ Nom: $userName" -ForegroundColor Green
}

if (-not $userEmail) {
    Write-Host "Configuration de l'email..." -ForegroundColor Yellow
    Write-Host "Entrez votre email GitHub:" -ForegroundColor Cyan
    $email = Read-Host "Email"
    git config user.email "$email"
    Write-Host "✓ Email configuré: $email" -ForegroundColor Green
} else {
    Write-Host "✓ Email: $userEmail" -ForegroundColor Green
}
Write-Host ""

# ============================================
# ÉTAPE 3: Créer .gitignore
# ============================================
Write-Host "ÉTAPE 3: Configuration .gitignore" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

if (-not (Test-Path ".gitignore")) {
    $gitignoreContent = @"
# Compiled class files
*.class
target/
*.jar
*.war
*.ear

# Log files
*.log

# IDE
.idea/
*.iml
.vscode/
*.swp
*.swo

# Node
node_modules/
dist/
.angular/

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.bak
*.swp
*~
"@
    Set-Content -Path ".gitignore" -Value $gitignoreContent
    Write-Host "✓ .gitignore créé" -ForegroundColor Green
} else {
    Write-Host "✓ .gitignore existe" -ForegroundColor Green
}
Write-Host ""

# ============================================
# ÉTAPE 4: Configuration du remote
# ============================================
Write-Host "ÉTAPE 4: Configuration du remote GitHub" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

$existingRemote = git remote get-url origin 2>$null

if ($existingRemote) {
    Write-Host "✓ Remote déjà configuré: $existingRemote" -ForegroundColor Green
} else {
    Write-Host "Entrez l'URL de votre repository GitHub:" -ForegroundColor Cyan
    Write-Host "(ex: https://github.com/username/uasz-maintenance.git)" -ForegroundColor Gray
    $repoUrl = Read-Host "URL"
    
    if ($repoUrl) {
        git remote add origin $repoUrl
        Write-Host "✓ Remote 'origin' configuré" -ForegroundColor Green
    } else {
        Write-Host "❌ URL requise pour continuer" -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# ============================================
# ÉTAPE 5: Vérifier la branche principale
# ============================================
Write-Host "ÉTAPE 5: Vérification branche principale" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

$currentBranch = git branch --show-current

if (-not $currentBranch) {
    Write-Host "Aucune branche. Création de 'main'..." -ForegroundColor Yellow
    git checkout -b main
    Write-Host "✓ Branche 'main' créée" -ForegroundColor Green
} else {
    Write-Host "✓ Branche actuelle: $currentBranch" -ForegroundColor Green
}
Write-Host ""

# ============================================
# ÉTAPE 6: Commit initial (si nécessaire)
# ============================================
Write-Host "ÉTAPE 6: Commit initial" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

$hasCommits = git log --oneline 2>$null

if (-not $hasCommits) {
    Write-Host "Aucun commit. Création du commit initial..." -ForegroundColor Yellow
    git add .
    git commit -m "Initial commit: Projet UASZ Maintenance"
    Write-Host "✓ Commit initial créé" -ForegroundColor Green
} else {
    Write-Host "✓ Repository a déjà des commits" -ForegroundColor Green
}
Write-Host ""

# ============================================
# ÉTAPE 7: Créer la branche feature
# ============================================
Write-Host "ÉTAPE 7: Création branche feature" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

$featureBranch = "feature/temps-reel-notifications-statuts"

# Vérifier si la branche existe déjà
$branchExists = git branch --list $featureBranch

if ($branchExists) {
    Write-Host "Branche '$featureBranch' existe déjà" -ForegroundColor Yellow
    Write-Host "Basculer dessus? (O/N)" -ForegroundColor Cyan
    $switch = Read-Host
    if ($switch -eq "O" -or $switch -eq "o") {
        git checkout $featureBranch
        Write-Host "✓ Basculé sur '$featureBranch'" -ForegroundColor Green
    }
} else {
    git checkout -b $featureBranch
    Write-Host "✓ Branche '$featureBranch' créée" -ForegroundColor Green
}
Write-Host ""

# ============================================
# ÉTAPE 8: Ajouter les fichiers
# ============================================
Write-Host "ÉTAPE 8: Ajout des fichiers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

git add .
Write-Host "✓ Tous les fichiers ajoutés" -ForegroundColor Green
Write-Host ""

# ============================================
# ÉTAPE 9: Créer le commit
# ============================================
Write-Host "ÉTAPE 9: Création du commit" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

$commitMessage = @"
feat: Implémentation temps réel pour notifications et statuts

✨ Nouvelles fonctionnalités:
- Notifications en temps réel (polling 10s) pour tous les utilisateurs
- Statuts des demandes en temps réel (polling 15s)
- Service DemandesPollingService pour gérer le polling automatique
- Intégration dans Dashboard Technicien et Responsable

🔧 Modifications Backend:
- Notification au demandeur uniquement quand responsable marque RESOLUE
- Suppression notification prématurée quand technicien termine
- Ajout notification dans marquerPanneResolue() et traiterParResponsable()

🎨 Modifications Frontend:
- NotificationService: Polling amélioré (liste complète au lieu du compteur)
- DemandesPollingService: Nouveau service de polling pour les demandes
- Dashboard Technicien: Intégration polling automatique
- Dashboard Responsable: Intégration polling automatique

📝 Documentation:
- FIX_NOTIFICATIONS_TEMPS_REEL.md
- FIX_STATUTS_TEMPS_REEL.md
- GUIDE_NOTIFICATIONS_TEMPS_REEL.md
- NOTIFICATION_RESOLUE_TOUS_ROLES.md
- IMPLEMENTATION_COMPLETE_TEMPS_REEL.md

✅ Résultats:
- Pas besoin de rafraîchir la page pour voir les notifications
- Pas besoin de rafraîchir la page pour voir les changements de statut
- Expérience utilisateur fluide et moderne
- Fonctionne pour tous les rôles (Demandeur, Technicien, Responsable, Superviseur, Admin)

🔄 Prochaines étapes:
- Intégrer polling dans Dashboard Demandeur
- Intégrer polling dans Dashboard Superviseur
- Intégrer polling dans Dashboard Admin
"@

git commit -m "$commitMessage"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Commit créé avec succès" -ForegroundColor Green
} else {
    Write-Host "❌ Erreur lors du commit" -ForegroundColor Red
    Write-Host "Peut-être qu'il n'y a pas de changements à commiter?" -ForegroundColor Yellow
}
Write-Host ""

# ============================================
# ÉTAPE 10: Push vers GitHub
# ============================================
Write-Host "ÉTAPE 10: Push vers GitHub" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Gray

Write-Host "Push de la branche '$featureBranch' vers GitHub..." -ForegroundColor Cyan

git push -u origin $featureBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "✅ SUCCÈS!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 Code poussé vers GitHub avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Résumé:" -ForegroundColor Yellow
    Write-Host "  Branche: $featureBranch" -ForegroundColor Gray
    Write-Host "  Remote: $(git remote get-url origin)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔗 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Allez sur GitHub" -ForegroundColor Gray
    Write-Host "  2. Vous verrez un bouton 'Compare & pull request'" -ForegroundColor Gray
    Write-Host "  3. Créez une Pull Request" -ForegroundColor Gray
    Write-Host "  4. Mergez dans main après validation" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "❌ ERREUR lors du push" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Causes possibles:" -ForegroundColor Yellow
    Write-Host "  1. Problème d'authentification GitHub" -ForegroundColor Gray
    Write-Host "  2. URL du repository incorrecte" -ForegroundColor Gray
    Write-Host "  3. Pas de droits d'écriture sur le repo" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Solutions:" -ForegroundColor Yellow
    Write-Host "  - Vérifiez votre authentification GitHub" -ForegroundColor Gray
    Write-Host "  - Utilisez un Personal Access Token si nécessaire" -ForegroundColor Gray
    Write-Host "  - Vérifiez l'URL: git remote -v" -ForegroundColor Gray
    Write-Host ""
}
