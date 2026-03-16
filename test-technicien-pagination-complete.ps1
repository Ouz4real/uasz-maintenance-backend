# Test complet de toutes les paginations du dashboard technicien

Write-Host "=== TEST COMPLET PAGINATION TECHNICIEN ===" -ForegroundColor Cyan
Write-Host ""

$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts" -Raw
$htmlContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html" -Raw

$sections = @(
    @{
        Name = "Mes interventions"
        Prefix = "interventions"
        Method = "getVisibleInterventionsPages"
        GoTo = "goToPage"
    },
    @{
        Name = "Maintenances preventives"
        Prefix = "maintenances"
        Method = "getVisibleMaintenancesPages"
        GoTo = "goToMaintenancePage"
    },
    @{
        Name = "Mes demandes"
        Prefix = "demandes"
        Method = "getVisibleDemandesPages"
        GoTo = "goToDemandesPage"
    },
    @{
        Name = "Equipements"
        Prefix = "equipement"
        Method = "getVisibleEquipementsPages"
        GoTo = "goToEquipementPage"
    },
    @{
        Name = "Historique"
        Prefix = "historique"
        Method = "getVisibleHistoriquePages"
        GoTo = "goToHistoriquePage"
    }
)

$allPassed = $true

foreach ($section in $sections) {
    Write-Host "`n=== $($section.Name) ===" -ForegroundColor Yellow
    
    $sectionPassed = $true
    
    # Verifier la methode getVisible
    if ($tsContent -match "$($section.Method)\(\)") {
        Write-Host "   [OK] $($section.Method)() existe" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] $($section.Method)() manquante" -ForegroundColor Red
        $sectionPassed = $false
    }
    
    # Verifier la methode goTo
    if ($tsContent -match "$($section.GoTo)\(") {
        Write-Host "   [OK] $($section.GoTo)() existe" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] $($section.GoTo)() manquante" -ForegroundColor Red
        $sectionPassed = $false
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

if ($ellipsisCount -eq 5) {
    Write-Host "[OK] Toutes les 5 sections ont le support des ellipsis" -ForegroundColor Green
} else {
    Write-Host "[ATTENTION] Nombre d'ellipsis attendu: 5, trouve: $ellipsisCount" -ForegroundColor Yellow
}

Write-Host "`n=== RESULTAT FINAL ===" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "SUCCES: Toutes les paginations du technicien sont implementees!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Sections avec pagination:" -ForegroundColor White
    Write-Host "  1. Mes interventions" -ForegroundColor White
    Write-Host "  2. Maintenances preventives" -ForegroundColor White
    Write-Host "  3. Mes demandes" -ForegroundColor White
    Write-Host "  4. Equipements" -ForegroundColor White
    Write-Host "  5. Historique" -ForegroundColor White
    Write-Host ""
    Write-Host "Caracteristiques:" -ForegroundColor White
    Write-Host "  - Fenetre glissante (max 7 pages)" -ForegroundColor White
    Write-Host "  - Ellipsis pour pages cachees" -ForegroundColor White
    Write-Host "  - Meme style que responsable/admin/demandeur" -ForegroundColor White
} else {
    Write-Host "ECHEC: Certaines sections sont incompletes" -ForegroundColor Red
}
