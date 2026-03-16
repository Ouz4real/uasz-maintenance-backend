# Script pour tester le fix du header sticky
Write-Host "=== TEST HEADER STICKY ===" -ForegroundColor Cyan

Write-Host "`n1. Vérification des fichiers modifiés..." -ForegroundColor Yellow

$dashboards = @(
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.scss"
)

$allGood = $true

foreach ($dashboard in $dashboards) {
    $fileName = Split-Path $dashboard -Leaf
    $content = Get-Content -Path $dashboard -Raw
    
    if ($content -match "position: sticky") {
        Write-Host "  ✓ $fileName - sticky appliqué" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $fileName - sticky manquant" -ForegroundColor Red
        $allGood = $false
    }
    
    if ($content -match "z-index: 100") {
        Write-Host "  ✓ $fileName - z-index OK" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $fileName - z-index manquant" -ForegroundColor Red
        $allGood = $false
    }
}

if ($allGood) {
    Write-Host "`n=== TOUS LES TESTS PASSÉS ===" -ForegroundColor Green
    Write-Host "`nPour tester dans le navigateur:" -ForegroundColor Cyan
    Write-Host "1. Redémarrez le frontend si nécessaire" -ForegroundColor White
    Write-Host "2. Connectez-vous en tant que Responsable" -ForegroundColor White
    Write-Host "3. Allez dans 'Tableau de bord'" -ForegroundColor White
    Write-Host "4. Scrollez vers le bas ou changez de page de pagination" -ForegroundColor White
    Write-Host "5. Le header avec la cloche et le menu doit rester visible en haut" -ForegroundColor White
} else {
    Write-Host "`n=== CERTAINS TESTS ONT ÉCHOUÉ ===" -ForegroundColor Red
}
