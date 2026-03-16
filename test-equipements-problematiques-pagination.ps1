# Test de la pagination dans "Équipements les plus problématiques" du superviseur

Write-Host "=== TEST PAGINATION EQUIPEMENTS PROBLEMATIQUES ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Verification des modifications..." -ForegroundColor Yellow

# 1. Verifier la methode getPagesEquipements dans le TS
Write-Host "`n1. Methode getPagesEquipements() dans dashboard-superviseur.component.ts:" -ForegroundColor Green
$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.ts" -Raw

if ($tsContent -match "getPagesEquipements\(\): \(number \| string\)\[\]") {
    Write-Host "   [OK] getPagesEquipements() retourne (number | string)[]" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] getPagesEquipements() type incorrect" -ForegroundColor Red
}

if ($tsContent -match "const maxVisible = 7") {
    Write-Host "   [OK] Fenetre glissante de 7 pages" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Fenetre glissante incorrecte" -ForegroundColor Red
}

if ($tsContent -match "equipementsPageStartIndex") {
    Write-Host "   [OK] Getter equipementsPageStartIndex existe" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Getter equipementsPageStartIndex manquant" -ForegroundColor Red
}

if ($tsContent -match "equipementsPageEndIndex") {
    Write-Host "   [OK] Getter equipementsPageEndIndex existe" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Getter equipementsPageEndIndex manquant" -ForegroundColor Red
}

if ($tsContent -match "equipementsTotalCount") {
    Write-Host "   [OK] Getter equipementsTotalCount existe" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Getter equipementsTotalCount manquant" -ForegroundColor Red
}

# 2. Verifier le HTML
Write-Host "`n2. Template HTML:" -ForegroundColor Green
$htmlContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.html" -Raw

if ($htmlContent -match "resp-pagination") {
    Write-Host "   [OK] Utilise le style resp-pagination" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Style resp-pagination manquant" -ForegroundColor Red
}

if ($htmlContent -match "resp-page-btn") {
    Write-Host "   [OK] Utilise le style resp-page-btn" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Style resp-page-btn manquant" -ForegroundColor Red
}

if ($htmlContent -match "pagination-ellipsis") {
    Write-Host "   [OK] Support des ellipsis (...)" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Ellipsis manquants" -ForegroundColor Red
}

if ($htmlContent -match "Précédent.*Suivant") {
    Write-Host "   [OK] Boutons Précédent/Suivant présents" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Boutons Précédent/Suivant manquants" -ForegroundColor Red
}

if ($htmlContent -match "equipementsPageStartIndex.*equipementsPageEndIndex.*equipementsTotalCount") {
    Write-Host "   [OK] Affichage du nombre d'éléments" -ForegroundColor Green
} else {
    Write-Host "   [ERREUR] Affichage du nombre d'éléments manquant" -ForegroundColor Red
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

Write-Host "`n=== RESUME ===" -ForegroundColor Cyan
Write-Host "La pagination avec fenetre glissante a ete ajoutee a 'Équipements les plus problématiques'" -ForegroundColor Green
Write-Host "- Fenetre glissante avec max 7 pages" -ForegroundColor White
Write-Host "- Ellipsis pour les pages cachees" -ForegroundColor White
Write-Host "- Boutons Précédent/Suivant" -ForegroundColor White
Write-Host "- Affichage du nombre d'éléments" -ForegroundColor White
Write-Host "- Meme style que les autres dashboards" -ForegroundColor White
Write-Host ""
Write-Host "Pour tester:" -ForegroundColor Yellow
Write-Host "1. Demarrer le frontend: cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "2. Se connecter en tant que superviseur" -ForegroundColor White
Write-Host "3. Aller dans la section 'Equipements'" -ForegroundColor White
Write-Host "4. Verifier la pagination dans 'Équipements les plus problématiques'" -ForegroundColor White
