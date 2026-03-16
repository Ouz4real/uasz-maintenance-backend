# Script pour retirer le fix header sticky
Write-Host "=== REVERT HEADER STICKY ===" -ForegroundColor Cyan

$dashboards = @(
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.scss"
)

foreach ($dashboard in $dashboards) {
    if (Test-Path $dashboard) {
        Write-Host "`nTraitement de: $dashboard" -ForegroundColor Yellow
        
        # Lire le contenu
        $content = Get-Content -Path $dashboard -Raw
        
        # Supprimer la section ajoutée (tout ce qui est après le commentaire "Fix: Header sticky")
        if ($content -match "(?s)(.+?)/\* Fix: Header sticky.+") {
            $content = $matches[1].TrimEnd()
            
            # Écrire le fichier
            Set-Content -Path $dashboard -Value $content -NoNewline
            
            Write-Host "  ✓ Modifications retirées" -ForegroundColor Green
        } else {
            Write-Host "  - Aucune modification à retirer" -ForegroundColor Gray
        }
    }
}

Write-Host "`n=== REVERT TERMINÉ ===" -ForegroundColor Green
Write-Host "Les fichiers sont revenus à leur état précédent." -ForegroundColor Cyan
