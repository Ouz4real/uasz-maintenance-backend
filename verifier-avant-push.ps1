# Script pour vérifier l'état du projet avant de pousser

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vérification avant Push" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier la branche actuelle
Write-Host "1. Branche actuelle:" -ForegroundColor Yellow
$currentBranch = git branch --show-current
Write-Host "   $currentBranch" -ForegroundColor Green
Write-Host ""

# 2. Vérifier le statut Git
Write-Host "2. Statut Git:" -ForegroundColor Yellow
git status --short
Write-Host ""

# 3. Compter les fichiers modifiés
Write-Host "3. Résumé des modifications:" -ForegroundColor Yellow
$modified = (git status --short | Where-Object { $_ -match "^ M" }).Count
$added = (git status --short | Where-Object { $_ -match "^A " }).Count
$deleted = (git status --short | Where-Object { $_ -match "^ D" }).Count
$untracked = (git status --short | Where-Object { $_ -match "^\?\?" }).Count

Write-Host "   Fichiers modifiés: $modified" -ForegroundColor $(if ($modified -gt 0) { "Yellow" } else { "Gray" })
Write-Host "   Fichiers ajoutés: $added" -ForegroundColor $(if ($added -gt 0) { "Green" } else { "Gray" })
Write-Host "   Fichiers supprimés: $deleted" -ForegroundColor $(if ($deleted -gt 0) { "Red" } else { "Gray" })
Write-Host "   Fichiers non suivis: $untracked" -ForegroundColor $(if ($untracked -gt 0) { "Cyan" } else { "Gray" })
Write-Host ""

# 4. Vérifier le remote
Write-Host "4. Configuration remote:" -ForegroundColor Yellow
$remotes = git remote -v
if ($remotes) {
    $remotes | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
} else {
    Write-Host "   ❌ Aucun remote configuré!" -ForegroundColor Red
}
Write-Host ""

# 5. Derniers commits
Write-Host "5. Derniers commits:" -ForegroundColor Yellow
git log --oneline -5
Write-Host ""

# 6. Fichiers principaux modifiés
Write-Host "6. Fichiers principaux modifiés:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   Backend (Java):" -ForegroundColor Cyan
git status --short | Where-Object { $_ -match "\.java$" } | ForEach-Object { 
    Write-Host "     $_" -ForegroundColor Gray 
}

Write-Host ""
Write-Host "   Frontend (TypeScript):" -ForegroundColor Cyan
git status --short | Where-Object { $_ -match "\.ts$" } | ForEach-Object { 
    Write-Host "     $_" -ForegroundColor Gray 
}

Write-Host ""
Write-Host "   Documentation (Markdown):" -ForegroundColor Cyan
git status --short | Where-Object { $_ -match "\.md$" } | ForEach-Object { 
    Write-Host "     $_" -ForegroundColor Gray 
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vérification terminée" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$totalChanges = $modified + $added + $deleted + $untracked
if ($totalChanges -gt 0) {
    Write-Host "✅ Vous avez $totalChanges fichier(s) à commiter" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour pousser vers GitHub, exécutez:" -ForegroundColor Yellow
    Write-Host "  .\push-feature-temps-reel.ps1" -ForegroundColor Cyan
} else {
    Write-Host "ℹ️  Aucune modification à commiter" -ForegroundColor Gray
}
Write-Host ""
