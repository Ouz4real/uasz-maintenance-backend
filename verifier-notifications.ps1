# Script de vérification du système de notifications

$env:PGPASSWORD = "ouz4real"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vérification du système de notifications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que la table existe
Write-Host "1. Vérification de la table notifications..." -ForegroundColor Yellow
$tableExists = & $psql -U postgres -d maintenance_db -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications');"

if ($tableExists -match "t") {
    Write-Host "   ✅ Table notifications existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ Table notifications n'existe pas" -ForegroundColor Red
    Write-Host "   Exécutez: .\create-notifications-table.ps1" -ForegroundColor Yellow
    exit
}

Write-Host ""

# Compter les notifications par utilisateur
Write-Host "2. Notifications par utilisateur:" -ForegroundColor Yellow
& $psql -U postgres -d maintenance_db -c "SELECT u.username, u.role, COUNT(n.id) as total, COUNT(CASE WHEN n.lu = false THEN 1 END) as non_lues FROM utilisateurs u LEFT JOIN notifications n ON u.id = n.utilisateur_id GROUP BY u.id, u.username, u.role HAVING COUNT(n.id) > 0 ORDER BY u.role;"

Write-Host ""

# Afficher les dernières notifications
Write-Host "3. Dernières notifications créées:" -ForegroundColor Yellow
& $psql -U postgres -d maintenance_db -c "SELECT n.id, u.username, n.titre, n.type, n.lu, n.date_creation FROM notifications n JOIN utilisateurs u ON n.utilisateur_id = u.id ORDER BY n.date_creation DESC LIMIT 5;"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Vérification terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor Yellow
Write-Host "1. Démarrez le backend: mvn spring-boot:run" -ForegroundColor White
Write-Host "2. Démarrez le frontend: cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "3. Connectez-vous en tant qu'admin" -ForegroundColor White
Write-Host "4. Regardez la cloche 🔔 dans le header (badge avec le nombre 2)" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
