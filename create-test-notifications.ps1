# Script PowerShell pour créer des notifications de test

$env:PGPASSWORD = "ouz4real"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Création de notifications de test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Exécuter le script SQL
psql -U postgres -d maintenance_db -f create-test-notifications.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Notifications de test créées!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Connectez-vous avec différents comptes pour voir les notifications." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création des notifications" -ForegroundColor Red
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
