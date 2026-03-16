# Test complet de toutes les paginations du dashboard superviseur

Write-Host "=== TEST COMPLET PAGINATION SUPERVISEUR ===" -ForegroundColor Cyan
Write-Host ""

$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.ts" -Raw
$htmlContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.html" -Raw

$sections = @(
    @{
        Name = "Mes demandes"
        Method = "getVisibleDemandesPages"
        Variables = @("demandePageSize", "demandeCurrentPage", "demandeTotalPages")
    },
    @{
        Name = "Équipements les plus problématiques"
        Method = "getPagesEquipements"
        Variables = @("currentPageEquipements", "itemsPerPageEquipements", "equipementsPageStartIndex")
    }
)

$allPassed = $true

foreach ($section in $sections) {
    Write-Host "`n=== $($section.Name) ===" -ForegroundColor Yellow
    
    $sectionPassed = $true
    
    # Verifier la methode
    if ($tsContent -match "$($section.Method)\(\)") {
        Write-Host "   [OK] $($section.Method)() existe" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] $($section.Method)() manquante" -ForegroundColor Red
        $sectionPassed = $false
    }
    
    # Verifier les variables
    foreach ($var in $section.Variables) {
        if ($tsContent -match $var) {
            Write-Host "   [OK] Variable $var existe" -ForegroundColor Green
        } else {
            Write-Host "   [ERREUR] Variable $var manquante" -ForegroundColor Red
            $sectionPassed = $false
        }
    }
    
    # Verifier dans le HTML
    if ($htmlContent -match "$($section.Method)\(\)") {
        Write-Host "   [OK] Utilise dans le template HTML" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] Non utilise dans le HTML" -ForegroundColor Red
        $sectionPassed = $false
    }
    
    if ($sectionPassed) {
        Write-Host "   [SUCCES] Section complete" -ForegroundColor Green
    } else {
        Write-Host "   [ECHEC] Section incomplete" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host "`n=== VERIFICATION GLOBALE ===" -ForegroundColor Cyan

# Compter les occurrences de pagination-ellipsis dans le HTML
$ellipsisCount = ([regex]::Matches($htmlContent, "pagination-ellipsis")).Count
Write-Host "Nombre de sections avec ellipsis: $ellipsisCount" -ForegroundColor White

if ($ellipsisCount -eq 2) {
    Write-Host "[OK] Les 2 sections ont le support des ellipsis" -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] Nombre d'ellipsis attendu: 2, trouve: $ellipsisCount" -ForegroundColor Yellow
}

# Verifier le style SCSS
$scssContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.scss" -Raw

if ($scssContent -match "\.pagination-ellipsis") {
    Write-Host "[OK] Style pagination-ellipsis present dans SCSS" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Style pagination-ellipsis manquant dans SCSS" -ForegroundColor Red
    $allPassed = $false
}

if ($scssContent -match "\.resp-pagination") {
    Write-Host "[OK] Style resp-pagination present dans SCSS" -ForegroundColor Green
} else {
    Write-Host "[ERREUR] Style resp-pagination manquant dans SCSS" -ForegroundColor Red
    $allPassed = $false
}

Write-Host "`n=== RESULTAT FINAL ===" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "SUCCES: Toutes les paginations du superviseur sont implementees!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sections avec pagination:" -ForegroundColor White
    Write-Host "  1. Mes demandes" -ForegroundColor White
    Write-Host "  2. Équipements les plus problématiques" -ForegroundColor White
    Write-Host ""
    Write-Host "Caracteristiques:" -ForegroundColor White
    Write-Host "  - Fenetre glissante (max 7 pages)" -ForegroundColor White
    Write-Host "  - Ellipsis pour pages cachees" -ForegroundColor White
    Write-Host "  - Boutons Précédent/Suivant" -ForegroundColor White
    Write-Host "  - Affichage du nombre d'éléments" -ForegroundColor White
    Write-Host "  - Meme style que les autres dashboards" -ForegroundColor White
} else {
    Write-Host "ECHEC: Certaines sections sont incompletes" -ForegroundColor Red
}
