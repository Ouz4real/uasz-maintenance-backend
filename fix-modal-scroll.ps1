# Script pour ajouter lockBodyScroll() et unlockBodyScroll() dans toutes les modales

$dashboards = @(
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.ts",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.ts"
)

foreach ($file in $dashboards) {
    if (Test-Path $file) {
        Write-Host "Traitement de $file..." -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw
        
        # Ajouter lockBodyScroll() après chaque ligne contenant "= true;" dans les méthodes open*Modal
        $content = $content -replace '(\s+)(this\.show\w+Modal\s*=\s*true;)', '$1$2$1this.lockBodyScroll();'
        
        # Ajouter unlockBodyScroll() après chaque ligne contenant "= false;" dans les méthodes close*Modal
        $content = $content -replace '(\s+)(this\.show\w+Modal\s*=\s*false;)', '$1$2$1this.unlockBodyScroll();'
        
        # Sauvegarder
        Set-Content $file -Value $content -NoNewline
        
        Write-Host "✓ $file mis à jour" -ForegroundColor Green
    } else {
        Write-Host "✗ $file introuvable" -ForegroundColor Red
    }
}

Write-Host "`nTerminé!" -ForegroundColor Green
