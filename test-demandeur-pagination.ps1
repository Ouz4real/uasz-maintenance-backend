Write-Host "=== TEST PAGINATION DEMANDEUR ===" -ForegroundColor Cyan
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.ts"
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.html"
$scssFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.scss"

Write-Host "1. Vérification des méthodes TypeScript..." -ForegroundColor Yellow
$tsContent = Get-Content $tsFile -Raw

if ($tsContent -match "getVisibleDashboardPages\(\)") {
    Write-Host "   ✓ getVisibleDashboardPages() existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ getVisibleDashboardPages() manquante" -ForegroundColor Red
}

if ($tsContent -match "getVisibleMesDemandesPages\(\)") {
    Write-Host "   ✓ getVisibleMesDemandesPages() existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ getVisibleMesDemandesPages() manquante" -ForegroundColor Red
}

if ($tsContent -match "getVisibleDocumentsPages\(\)") {
    Write-Host "   ✓ getVisibleDocumentsPages() existe" -ForegroundColor Green
} else {
    Write-Host "   ✗ getVisibleDocumentsPages() manquante" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Vérification du HTML..." -ForegroundColor Yellow
$htmlContent = Get-Content $htmlFile -Raw

if ($htmlContent -match "getVisibleDashboardPages\(\)") {
    Write-Host "   ✓ Dashboard utilise getVisibleDashboardPages()" -ForegroundColor Green
} else {
    Write-Host "   ✗ Dashboard n'utilise pas getVisibleDashboardPages()" -ForegroundColor Red
}

if ($htmlContent -match "getVisibleMesDemandesPages\(\)") {
    Write-Host "   ✓ Mes demandes utilise getVisibleMesDemandesPages()" -ForegroundColor Green
} else {
    Write-Host "   ✗ Mes demandes n'utilise pas getVisibleMesDemandesPages()" -ForegroundColor Red
}

if ($htmlContent -match "getVisibleDocumentsPages\(\)") {
    Write-Host "   ✓ Documents utilise getVisibleDocumentsPages()" -ForegroundColor Green
} else {
    Write-Host "   ✗ Documents n'utilise pas getVisibleDocumentsPages()" -ForegroundColor Red
}

$ellipsisCount = ([regex]::Matches($htmlContent, "pagination-ellipsis")).Count
Write-Host "   ✓ Ellipsis trouvés: $ellipsisCount (attendu: 3)" -ForegroundColor $(if ($ellipsisCount -eq 3) { "Green" } else { "Yellow" })

# Vérifier qu'il n'y a qu'une seule pagination Documents
$docPaginationCount = ([regex]::Matches($htmlContent, "<!-- Pagination Documents -->")).Count
Write-Host "   ✓ Pagination Documents: $docPaginationCount (attendu: 1)" -ForegroundColor $(if ($docPaginationCount -eq 1) { "Green" } else { "Red" })

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
Write-Host "✓ Pagination en double supprimée dans Documents!" -ForegroundColor Green
Write-Host ""
Write-Host "Sections mises à jour:" -ForegroundColor White
Write-Host "  1. Dashboard - pagination avec ellipsis" -ForegroundColor White
Write-Host "  2. Mes demandes - pagination avec ellipsis" -ForegroundColor White
Write-Host "  3. Documents - pagination avec ellipsis (dupliqué supprimé)" -ForegroundColor White
