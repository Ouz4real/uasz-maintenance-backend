# Test des corrections pour l'admin (cloche et menu utilisateur)

Write-Host "=== TEST CORRECTIONS ADMIN ===" -ForegroundColor Cyan
Write-Host ""

$htmlContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.html" -Raw
$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.ts" -Raw
$scssContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.scss" -Raw

Write-Host "1. Verification de l'overlay pour fermer le menu:" -ForegroundColor Yellow

if ($htmlContent -match "user-menu-overlay") {
    Write-Host "   [OK] Overlay HTML present" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Overlay HTML manquant" -ForegroundColor Red
}

if ($scssContent -match "\.user-menu-overlay") {
    Write-Host "   [OK] Style overlay present" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Style overlay manquant" -ForegroundColor Red
}

if ($tsContent -match "closeUserMenu\(\)") {
    Write-Host "   [OK] Methode closeUserMenu() presente" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Methode closeUserMenu() manquante" -ForegroundColor Red
}

Write-Host "`n2. Verification du style de la cloche de notification:" -ForegroundColor Yellow

if ($scssContent -match "NOTIFICATION BELL OVERRIDE") {
    Write-Host "   [ERREUR] Styles personnalises encore presents" -ForegroundColor Red
} else {
    Write-Host "   [OK] Styles personnalises supprimes" -ForegroundColor Green
}

if ($htmlContent -match "app-notification-bell") {
    Write-Host "   [OK] Composant app-notification-bell utilise" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Composant app-notification-bell manquant" -ForegroundColor Red
}

Write-Host "`n=== RESUME ===" -ForegroundColor Cyan
Write-Host "Corrections appliquees pour l'admin:" -ForegroundColor Green
Write-Host "  1. Ajout de l'overlay pour fermer le menu en cliquant ailleurs" -ForegroundColor White
Write-Host "  2. Ajout de la methode closeUserMenu()" -ForegroundColor White
Write-Host "  3. Suppression des styles personnalises de la cloche" -ForegroundColor White
Write-Host "  4. La cloche utilise maintenant le style standard du composant" -ForegroundColor White
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor Yellow
Write-Host "1. Demarrer le frontend: cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "2. Se connecter en tant qu'admin" -ForegroundColor White
Write-Host "3. Verifier que la cloche ressemble aux autres dashboards" -ForegroundColor White
Write-Host "4. Ouvrir le menu utilisateur et cliquer ailleurs pour le fermer" -ForegroundColor White
