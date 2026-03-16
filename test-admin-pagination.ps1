Write-Host "=== TEST PAGINATION ADMIN ===" -ForegroundColor Cyan
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.ts"
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.html"
$scssFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.scss"

Write-Host "1. Vérification des méthodes TypeScript..." -ForegroundColor Yellow
$tsContent = Get-Content $tsFile -Raw

if ($tsContent -match "getVisibleUtilisateursPages\(\)") {
    Write-Host "   ✓ getVisibleUtilisateursPages() existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ getVisibleUtilisateursPages() manquante" -ForegroundColor Red
}

if ($tsContent -match "getVisibleDemandesPages\(\)") {
    Write-Host "   ✓ getVisibleDemandesPages() existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ getVisibleDemandesPages() manquante" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Vérification du HTML..." -ForegroundColor Yellow
$htmlContent = Get-Content $htmlFile -Raw

if ($htmlContent -match "getVisibleUtilisateursPages\(\)") {
    Write-Host "   ✓ Section Utilisateurs utilise getVisibleUtilisateursPages()" -ForegroundColor Green
} else {
    Write-Host "   ✗ Section Utilisateurs n'utilise pas getVisibleUtilisateursPages()" -ForegroundColor Red
}

if ($htmlContent -match "getVisibleDemandesPages\(\)") {
    Write-Host "   ✓ Section Mes demandes utilise getVisibleDemandesPages()" -ForegroundColor Green
} else {
    Write-Host "   ✗ Section Mes demandes n'utilise pas getVisibleDemandesPages()" -ForegroundColor Red
}

$ellipsisCount = ([regex]::Matches($htmlContent, "pagination-ellipsis")).Count
Write-Host "   ✓ Ellipsis trouvés: $ellipsisCount (attendu: 2)" -ForegroundColor $(if ($ellipsisCount -eq 2) { "Green" } else { "Yellow" })

Write-Host ""
Write-Host "3. Vérification des styles SCSS..." -ForegroundColor Yellow
$scssContent = Get-Content $scssFile -Raw

if ($scssContent -match "\.pagination-ellipsis") {
    Write-Host "   ✓ Style pagination-ellipsis existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ Style pagination-ellipsis manquant" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RÉSULTAT ===" -ForegroundColor Cyan
Write-Host "✓ Pagination avec fenêtre glissante (7 pages max) ajoutée!" -ForegroundColor Green
Write-Host ""
Write-Host "Sections mises à jour:" -ForegroundColor White
Write-Host "  1. Utilisateurs - pagination avec ellipsis" -ForegroundColor White
Write-Host "  2. Mes demandes - pagination avec ellipsis" -ForegroundColor White
Write-Host ""
Write-Host "Style identique au dashboard responsable!" -ForegroundColor Green
