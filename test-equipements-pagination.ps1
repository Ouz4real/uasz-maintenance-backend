# Test de la pagination dans la section Equipements du technicien

Write-Host "=== TEST PAGINATION EQUIPEMENTS TECHNICIEN ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verification des modifications..." -ForegroundColor Yellow

# 1. Verifier les variables de pagination dans le TS
Write-Host "`n1. Variables de pagination dans dashboard-technicien.component.ts:" -ForegroundColor Green
$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts" -Raw

if ($tsContent -match "paginatedEquipements:") {
    Write-Host "   [OK] paginatedEquipements declare" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] paginatedEquipements manquant" -ForegroundColor Red
}

if ($tsContent -match "equipementItemsPerPage = 5") {
    Write-Host "   [OK] equipementItemsPerPage = 5" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] equipementItemsPerPage incorrect" -ForegroundColor Red
}

if ($tsContent -match "equipementCurrentPage = 1") {
    Write-Host "   [OK] equipementCurrentPage = 1" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] equipementCurrentPage incorrect" -ForegroundColor Red
}

# 2. Verifier les methodes de pagination
Write-Host "`n2. Methodes de pagination:" -ForegroundColor Green

if ($tsContent -match "applyEquipementPagination\(\)") {
    Write-Host "   [OK] applyEquipementPagination() existe" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] applyEquipementPagination() manquante" -ForegroundColor Red
}

if ($tsContent -match "goToEquipementPage\(page: number\)") {
    Write-Host "   [OK] goToEquipementPage() existe" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] goToEquipementPage() manquante" -ForegroundColor Red
}

if ($tsContent -match "getVisibleEquipementsPages\(\): \(number \| string\)\[\]") {
    Write-Host "   [OK] getVisibleEquipementsPages() existe" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] getVisibleEquipementsPages() manquante" -ForegroundColor Red
}

# 3. Verifier l'appel de pagination dans buildEquipementsView
Write-Host "`n3. Integration dans buildEquipementsView:" -ForegroundColor Green

if ($tsContent -match "this\.applyEquipementPagination\(\);") {
    Write-Host "   [OK] applyEquipementPagination() appelee dans buildEquipementsView" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] applyEquipementPagination() non appelee" -ForegroundColor Red
}

# 4. Verifier le HTML
Write-Host "`n4. Template HTML:" -ForegroundColor Green
$htmlContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html" -Raw

if ($htmlContent -match "paginatedEquipements\.length > 0") {
    Write-Host "   [OK] Utilise paginatedEquipements au lieu de equipementsView" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] N'utilise pas paginatedEquipements" -ForegroundColor Red
}

if ($htmlContent -match "\*ngFor=`"let e of paginatedEquipements`"") {
    Write-Host "   [OK] ngFor utilise paginatedEquipements" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] ngFor n'utilise pas paginatedEquipements" -ForegroundColor Red
}

if ($htmlContent -match "getVisibleEquipementsPages\(\)") {
    Write-Host "   [OK] Pagination UI avec getVisibleEquipementsPages()" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Pagination UI manquante" -ForegroundColor Red
}

if ($htmlContent -match "goToEquipementPage\(") {
    Write-Host "   [OK] Boutons de navigation avec goToEquipementPage()" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Boutons de navigation manquants" -ForegroundColor Red
}

if ($htmlContent -match "pagination-ellipsis") {
    Write-Host "   [OK] Support des ellipsis (...)" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Ellipsis manquants" -ForegroundColor Red
}

# 5. Verifier le SCSS
Write-Host "`n5. Styles SCSS:" -ForegroundColor Green
$scssContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss" -Raw

if ($scssContent -match "\.pagination-ellipsis") {
    Write-Host "   [OK] Style pagination-ellipsis present" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Style pagination-ellipsis manquant" -ForegroundColor Red
}

Write-Host "`n=== RESUME ===" -ForegroundColor Cyan
Write-Host "La pagination a ete ajoutee a la section Equipements du technicien" -ForegroundColor Green
Write-Host "- Fenetre glissante avec max 7 pages" -ForegroundColor White
Write-Host "- Ellipsis pour les pages cachees" -ForegroundColor White
Write-Host "- 5 equipements par page" -ForegroundColor White
Write-Host "- Meme style que les autres dashboards" -ForegroundColor White
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor Yellow
Write-Host "1. Demarrer le frontend: cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "2. Se connecter en tant que technicien" -ForegroundColor White
Write-Host "3. Aller dans la section 'Equipements'" -ForegroundColor White
Write-Host "4. Verifier la pagination en bas de la liste" -ForegroundColor White
