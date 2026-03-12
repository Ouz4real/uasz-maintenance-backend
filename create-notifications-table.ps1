# Script PowerShell pour créer la table notifications dans PostgreSQL
# Assurez-vous que PostgreSQL est en cours d'exécution

$env:PGPASSWORD = "ouz4real"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Création de la table notifications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Exécuter le script SQL
psql -U postgres -d maintenance_db -f create-notifications-table.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Table notifications créée avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant utiliser le système de notifications." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Erreur lors de la création de la table" -ForegroundColor Red
    Write-Host "Vérifiez que PostgreSQL est démarré et que la base maintenance_db existe." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
