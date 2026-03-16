# Script pour corriger l'affichage des notifications

$env:PGPASSWORD = "ouz4real"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Correction de l'affichage des notifications" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Suppression des anciennes notifications..." -ForegroundColor Yellow
& $psql -U postgres -d maintenance_db -c "DELETE FROM notifications;"
Write-Host "   ✅ Anciennes notifications supprimees" -ForegroundColor Green
Write-Host ""

Write-Host "2. Creation de nouvelles notifications (sans accents)..." -ForegroundColor Yellow
& $psql -U postgres -d maintenance_db -f fix-notifications-encoding.sql | Out-Null
Write-Host "   ✅ Nouvelles notifications creees" -ForegroundColor Green
Write-Host ""

Write-Host "3. Verification..." -ForegroundColor Yellow
& $psql -U postgres -d maintenance_db -c "SELECT u.username, u.role, COUNT(n.id) as total, COUNT(CASE WHEN n.lu = false THEN 1 END) as non_lues FROM utilisateurs u LEFT JOIN notifications n ON u.id = n.utilisateur_id GROUP BY u.id, u.username, u.role HAVING COUNT(n.id) > 0 ORDER BY u.role;"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Correction terminee!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Les notifications sont maintenant:" -ForegroundColor Yellow
Write-Host "- Sans accents (pour eviter les problemes d'encodage)" -ForegroundColor White
Write-Host "- La cloche est maintenant visible (fond bleu clair)" -ForegroundColor White
Write-Host ""
Write-Host "Redemarrez le frontend pour voir les changements:" -ForegroundColor Yellow
Write-Host "cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
