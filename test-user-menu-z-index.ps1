# Test du z-index des menus utilisateur dans tous les dashboards

Write-Host "=== TEST Z-INDEX MENU UTILISATEUR ===" -ForegroundColor Cyan
Write-Host ""

$dashboards = @(
    @{
        Name = "Technicien"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss"
    },
    @{
        Name = "Responsable"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.scss"
    },
    @{
        Name = "Admin"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.scss"
    },
    @{
        Name = "Demandeur"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.scss"
    },
    @{
        Name = "Superviseur"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.scss"
    }
)

$allPassed = $true

foreach ($dashboard in $dashboards) {
    Write-Host "`n=== Dashboard $($dashboard.Name) ===" -ForegroundColor Yellow
    
    $content = Get-Content $dashboard.Path -Raw
    
    # Verifier position: fixed
    if ($content -match "\.user-menu \{[^}]*position:\s*fixed") {
        Write-Host "   [OK] position: fixed" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] position n'est pas fixed" -ForegroundColor Red
        $allPassed = $false
    }
    
    # Verifier z-index: 2000
    if ($content -match "\.user-menu \{[^}]*z-index:\s*2000") {
        Write-Host "   [OK] z-index: 2000" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] z-index n'est pas 2000" -ForegroundColor Red
        $allPassed = $false
    }
    
    # Verifier top: 80px
    if ($content -match "\.user-menu \{[^}]*top:\s*80px") {
        Write-Host "   [OK] top: 80px" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] top n'est pas 80px" -ForegroundColor Red
        $allPassed = $false
    }
    
    # Verifier right: 40px
    if ($content -match "\.user-menu \{[^}]*right:\s*40px") {
        Write-Host "   [OK] right: 40px" -ForegroundColor Green
    } else {
        Write-Host "   [ERREUR] right n'est pas 40px" -ForegroundColor Red
        $allPassed = $false
    }
}

Write-Host "`n=== RESULTAT FINAL ===" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host "SUCCES: Tous les menus utilisateur ont les memes styles!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Caracteristiques communes:" -ForegroundColor White
    Write-Host "  - position: fixed" -ForegroundColor White
    Write-Host "  - top: 80px" -ForegroundColor White
    Write-Host "  - right: 40px" -ForegroundColor White
    Write-Host "  - z-index: 2000" -ForegroundColor White
    Write-Host ""
    Write-Host "Le menu utilisateur s'affichera maintenant correctement au-dessus du header" -ForegroundColor Green
    Write-Host "pour tous les dashboards (technicien, responsable, admin, demandeur, superviseur)" -ForegroundColor Green
} else {
    Write-Host "ECHEC: Certains dashboards ont des styles incorrects" -ForegroundColor Red
}
