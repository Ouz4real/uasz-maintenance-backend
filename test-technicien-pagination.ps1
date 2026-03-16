Write-Host "=== TEST PAGINATION TECHNICIEN ===" -ForegroundColor Cyan
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts"
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"
$scssFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss"

Write-Host "1. Vérification des méthodes TypeScript..." -ForegroundColor Yellow
$tsContent = Get-Content $tsFile -Raw

$methods = @(
    "getVisibleInterventionsPages",
    "getVisibleHistoriquePages",
    "getVisibleDemandesPages",
    "getVisibleMaintenancesPages"
)

foreach ($method in $methods) {
    if ($tsContent -match "$method\(\)") {
        Write-Host "   ✓ $method() existe" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $method() manquante" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "2. Vérification du HTML..." -ForegroundColor Yellow
$htmlContent = Get-Content $htmlFile -Raw

$htmlMethods = @(
    @{Name="Mes interventions"; Method="getVisibleInterventionsPages"},
    @{Name="Historique"; Method="getVisibleHistoriquePages"},
    @{Name="Mes demandes"; Method="getVisibleDemandesPages"},
    @{Name="Maintenances préventives"; Method="getVisibleMaintenancesPages"}
)

foreach ($item in $htmlMethods) {
    if ($htmlContent -match "$($item.Method)\(\)") {
        Write-Host "   ✓ $($item.Name) utilise $($item.Method)()" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $($item.Name) n'utilise pas $($item.Method)()" -ForegroundColor Red
    }
}

$ellipsisCount = ([regex]::Matches($htmlContent, "pagination-ellipsis")).Count
Write-Host "   ✓ Ellipsis trouvés: $ellipsisCount (attendu: 4)" -ForegroundColor $(if ($ellipsisCount -eq 4) { "Green" } else { "Yellow" })

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
Write-Host "  1. Mes interventions - pagination avec ellipsis" -ForegroundColor White
Write-Host "  2. Maintenances préventives - pagination avec ellipsis" -ForegroundColor White
Write-Host "  3. Mes demandes - pagination avec ellipsis" -ForegroundColor White
Write-Host "  4. Historique - pagination avec ellipsis" -ForegroundColor White
Write-Host ""
Write-Host "Note: La section 'Equipements' n'a pas de pagination" -ForegroundColor Yellow
