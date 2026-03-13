# Script pour nettoyer les fichiers de test avant de pousser (OPTIONNEL)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Nettoyage avant Push (OPTIONNEL)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  Ce script va supprimer les fichiers de test PowerShell" -ForegroundColor Yellow
Write-Host "Les fichiers markdown de documentation seront conservés" -ForegroundColor Gray
Write-Host ""
Write-Host "Voulez-vous continuer? (O/N)" -ForegroundColor Yellow
$response = Read-Host

if ($response -ne "O" -and $response -ne "o") {
    Write-Host "Annulé" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Fichiers qui seront supprimés:" -ForegroundColor Yellow
Write-Host ""

# Liste des patterns de fichiers à supprimer
$patterns = @(
    "test-*.ps1",
    "debug-*.ps1",
    "fix-*.ps1",
    "verifier-*.ps1",
    "diagnostic-*.ps1",
    "analyze-*.ps1",
    "create-test-*.ps1",
    "add-*.ps1",
    "recuperer-*.ps1",
    "resume-*.ps1",
    "restart-*.ps1",
    "reset-*.ps1",
    "check-*.ps1",
    "clean-*.ps1"
)

$filesToDelete = @()

foreach ($pattern in $patterns) {
    $files = Get-ChildItem -Path . -Filter $pattern -File
    foreach ($file in $files) {
        $filesToDelete += $file
        Write-Host "  - $($file.Name)" -ForegroundColor Gray
    }
}

if ($filesToDelete.Count -eq 0) {
    Write-Host "  Aucun fichier à supprimer" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Total: $($filesToDelete.Count) fichier(s)" -ForegroundColor Yellow
Write-Host ""
Write-Host "Confirmer la suppression? (O/N)" -ForegroundColor Yellow
$confirm = Read-Host

if ($confirm -ne "O" -and $confirm -ne "o") {
    Write-Host "Annulé" -ForegroundColor Gray
    exit 0
}

Write-Host ""
Write-Host "Suppression en cours..." -ForegroundColor Yellow

$deleted = 0
foreach ($file in $filesToDelete) {
    try {
        Remove-Item $file.FullName -Force
        Write-Host "  ✓ $($file.Name)" -ForegroundColor Green
        $deleted++
    } catch {
        Write-Host "  ✗ $($file.Name) - Erreur: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "$deleted fichier(s) supprimé(s)" -ForegroundColor Green
Write-Host ""
Write-Host "Fichiers conservés:" -ForegroundColor Yellow
Write-Host "  - Tous les fichiers .md (documentation)" -ForegroundColor Gray
Write-Host "  - Tous les fichiers .sql" -ForegroundColor Gray
Write-Host "  - Tous les fichiers source (.java, .ts, etc.)" -ForegroundColor Gray
Write-Host "  - push-feature-temps-reel.ps1" -ForegroundColor Gray
Write-Host "  - verifier-avant-push.ps1" -ForegroundColor Gray
Write-Host "  - nettoyer-avant-push.ps1 (ce script)" -ForegroundColor Gray
Write-Host ""
Write-Host "Vous pouvez maintenant pousser vers GitHub:" -ForegroundColor Yellow
Write-Host "  .\push-feature-temps-reel.ps1" -ForegroundColor Cyan
Write-Host ""
