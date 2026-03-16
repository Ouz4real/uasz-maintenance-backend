# Test de la pagination dans la section Mes demandes du superviseur

Write-Host "=== TEST PAGINATION MES DEMANDES SUPERVISEUR ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verification des modifications..." -ForegroundColor Yellow

# 1. Verifier la methode getVisibleDemandesPages dans le TS
Write-Host "`n1. Methode getVisibleDemandesPages() dans dashboard-superviseur.component.ts:" -ForegroundColor Green
$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.ts" -Raw

if ($tsContent -match "getVisibleDemandesPages\(\): \(number \| string\)\[\]") {
    Write-Host "   [OK] getVisibleDemandesPages() existe" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] getVisibleDemandesPages() manquante" -ForegroundColor Red
}

if ($tsContent -match "const maxVisible = 7") {
    Write-Host "   [OK] Fenetre glissante de 7 pages" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Fenetre glissante incorrecte" -ForegroundColor Red
}

# 2. Verifier le HTML
Write-Host "`n2. Template HTML:" -ForegroundColor Green
$htmlContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.html" -Raw

if ($htmlContent -match "getVisibleDemandesPages\(\)") {
    Write-Host "   [OK] Utilise getVisibleDemandesPages() dans le template" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] N'utilise pas getVisibleDemandesPages()" -ForegroundColor Red
}

if ($htmlContent -match "pagination-ellipsis") {
    Write-Host "   [OK] Support des ellipsis (...)" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Ellipsis manquants" -ForegroundColor Red
}

if ($htmlContent -match "\`$any\(page\)") {
    Write-Host "   [OK] Cast de type avec `$any()" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Cast de type manquant" -ForegroundColor Red
}

# 3. Verifier le SCSS
Write-Host "`n3. Styles SCSS:" -ForegroundColor Green
$scssContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.scss" -Raw

if ($scssContent -match "\.pagination-ellipsis") {
    Write-Host "   [OK] Style pagination-ellipsis present" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Style pagination-ellipsis manquant" -ForegroundColor Red
}

if ($scssContent -match "\.resp-pagination") {
    Write-Host "   [OK] Style resp-pagination present" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Style resp-pagination manquant" -ForegroundColor Red
}

if ($scssContent -match "\.resp-page-btn") {
    Write-Host "   [OK] Style resp-page-btn present" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Style resp-page-btn manquant" -ForegroundColor Red
}

Write-Host "`n=== RESUME ===" -ForegroundColor Cyan
Write-Host "La pagination avec fenetre glissante a ete ajoutee a 'Mes demandes' du superviseur" -ForegroundColor Green
Write-Host "- Fenetre glissante avec max 7 pages" -ForegroundColor White
Write-Host "- Ellipsis pour les pages cachees" -ForegroundColor White
Write-Host "- Meme style que les autres dashboards" -ForegroundColor White
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor Yellow
Write-Host "1. Demarrer le frontend: cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "2. Se connecter en tant que superviseur" -ForegroundColor White
Write-Host "3. Aller dans la section 'Mes demandes'" -ForegroundColor White
Write-Host "4. Verifier la pagination en bas de la liste" -ForegroundColor White
