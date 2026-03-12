# Script pour pousser les changements vers GitHub
# Inchallah! 🚀

Write-Host "🚀 Préparation du push vers GitHub..." -ForegroundColor Cyan
Write-Host ""

# Aller dans le bon répertoire
$repoPath = "C:\Users\Pro\OneDrive\Desktop\uasz-maintenance-backend"
Set-Location $repoPath

Write-Host "📁 Répertoire: $repoPath" -ForegroundColor Gray
Write-Host ""

# Vérifier le statut
Write-Host "📊 Vérification du statut Git..." -ForegroundColor Yellow
try {
    $status = git status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur Git: $status" -ForegroundColor Red
        Write-Host ""
        Write-Host "Tentative de réparation du repository..." -ForegroundColor Yellow
        
        # Vérifier si c'est un problème OneDrive
        if ($repoPath -like "*OneDrive*") {
            Write-Host "⚠️  Le repository est dans OneDrive, cela peut causer des problèmes" -ForegroundColor Yellow
            Write-Host ""
        }
        
        exit 1
    }
    
    Write-Host $status
    Write-Host ""
    
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}

# Ajouter tous les fichiers
Write-Host "➕ Ajout des fichiers modifiés..." -ForegroundColor Yellow
git add .

# Créer le commit
$commitMessage = "feat: Dashboard Administrateur Phase 1 + Initialisation utilisateurs

- Ajout du Dashboard Administrateur complet avec gestion des utilisateurs
- Interface de création, modification, suppression d'utilisateurs
- Filtres par rôle et statut
- Pagination et recherche
- Initialisation automatique des utilisateurs au démarrage (DataInitializer)
- Endpoint de debug pour réinitialisation des mots de passe
- Scripts de test de connexion (PowerShell et Bash)
- Documentation complète des identifiants

Utilisateurs créés automatiquement:
- admin / admin123 (ADMINISTRATEUR)
- superviseur / super123 (SUPERVISEUR)
- responsable / resp123 (RESPONSABLE_MAINTENANCE)
- technicien / tech123 (TECHNICIEN)
- demandeur / dem123 (DEMANDEUR)

Inchallah! 🚀"

Write-Host "💾 Création du commit..." -ForegroundColor Yellow
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Aucun changement à commiter ou erreur" -ForegroundColor Yellow
    Write-Host ""
}

# Pousser vers GitHub
Write-Host "🌐 Push vers GitHub..." -ForegroundColor Yellow
Write-Host ""

$branch = git branch --show-current
Write-Host "Branche actuelle: $branch" -ForegroundColor Gray

git push origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Push réussi! Inchallah!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🔗 Repository: https://github.com/Ouz4real/uasz-maintenance-backend" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors du push" -ForegroundColor Red
    Write-Host ""
    Write-Host "Vérifiez:" -ForegroundColor Yellow
    Write-Host "  - Votre connexion Internet" -ForegroundColor White
    Write-Host "  - Vos identifiants GitHub" -ForegroundColor White
    Write-Host "  - Les permissions sur le repository" -ForegroundColor White
}
