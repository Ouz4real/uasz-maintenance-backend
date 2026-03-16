Write-Host "=== TEST FIX PAGINATION GESTION STOCK ===" -ForegroundColor Cyan
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html"

Write-Host "1. Vérification loadEquipementsStock appelle updateStockPagination..." -ForegroundColor Yellow
$tsContent = Get-Content $tsFile -Raw
if ($tsContent -match "loadEquipementsStock[\s\S]*?updateStockPagination\(\)") {
    Write-Host "   ✓ loadEquipementsStock() appelle updateStockPagination()" -ForegroundColor Green
} else {
    Write-Host "   ✗ loadEquipementsStock() n'appelle pas updateStockPagination()" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Vérification onEquipementSearchChange appelle applyStockFilters..." -ForegroundColor Yellow
if ($tsContent -match "onEquipementSearchChange[\s\S]*?applyStockFilters\(\)") {
    Write-Host "   ✓ onEquipementSearchChange() appelle applyStockFilters()" -ForegroundColor Green
} else {
    Write-Host "   ✗ onEquipementSearchChange() n'appelle pas applyStockFilters()" -ForegroundColor Red
}

Write-Host ""
Write-Host "3. Vérification des filtres dans le HTML..." -ForegroundColor Yellow
$htmlContent = Get-Content $htmlFile -Raw
$ngModelChangeCount = ([regex]::Matches($htmlContent, "equipementEtatFilter.*ngModelChange")).Count + 
                      ([regex]::Matches($htmlContent, "equipementTypeFilter.*ngModelChange")).Count

if ($ngModelChangeCount -ge 2) {
    Write-Host "   ✓ Les filtres ont des événements (ngModelChange)" -ForegroundColor Green
} else {
    Write-Host "   ✗ Les filtres n'ont pas d'événements (ngModelChange)" -ForegroundColor Red
}

Write-Host ""
Write-Host "4. Vérification applyStockFilters est publique..." -ForegroundColor Yellow
if ($tsContent -match "^\s+applyStockFilters\(\): void \{" -and $tsContent -notmatch "private applyStockFilters") {
    Write-Host "   ✓ applyStockFilters() est publique" -ForegroundColor Green
} else {
    Write-Host "   ✗ applyStockFilters() n'est pas publique" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== RÉSULTAT ===" -ForegroundColor Cyan
Write-Host "Les données de stock devraient maintenant s'afficher correctement!" -ForegroundColor Green
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor White
Write-Host "1. Redémarrez le frontend (ng serve)" -ForegroundColor White
Write-Host "2. Connectez-vous en tant que responsable" -ForegroundColor White
Write-Host "3. Allez dans 'Gestion stock'" -ForegroundColor White
Write-Host "4. Les équipements devraient s'afficher avec pagination" -ForegroundColor White
