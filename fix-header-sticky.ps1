# Script pour fixer le header sticky dans tous les dashboards
Write-Host "=== FIX HEADER STICKY ===" -ForegroundColor Cyan

$dashboards = @(
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardSuperviseur/dashboard-superviseur.component.scss",
    "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin/dashboard-admin.component.scss"
)

$cssToAdd = @"

/* Fix: Header sticky pour éviter que la pagination pousse le menu hors de l'écran */
.topbar {
  position: sticky !important;
  top: 0 !important;
  z-index: 100 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1) !important;
}

.topbar-right {
  display: flex !important;
  align-items: center !important;
  gap: 1rem !important;
}

/* Assurer que le contenu principal peut scroller */
.dashboard-content,
.main-content {
  overflow-x: auto !important;
  max-width: 100% !important;
}

/* Limiter la largeur du tableau pour éviter le débordement */
.table-container,
table {
  max-width: 100% !important;
  overflow-x: auto !important;
}

/* Pagination responsive */
.pagination {
  flex-wrap: wrap !important;
  gap: 0.25rem !important;
}
"@

foreach ($dashboard in $dashboards) {
    if (Test-Path $dashboard) {
        Write-Host "`nTraitement de: $dashboard" -ForegroundColor Yellow
        
        # Lire le contenu
        $content = Get-Content -Path $dashboard -Raw
        
        # Vérifier si le fix n'est pas déjà présent
        if ($content -notmatch "Header sticky pour éviter") {
            # Ajouter le CSS à la fin
            $content += $cssToAdd
            
            # Écrire le fichier
            Set-Content -Path $dashboard -Value $content -NoNewline
            
            Write-Host "  ✓ Fix appliqué" -ForegroundColor Green
        } else {
            Write-Host "  - Fix déjà présent" -ForegroundColor Gray
        }
    } else {
        Write-Host "`n✗ Fichier non trouvé: $dashboard" -ForegroundColor Red
    }
}

Write-Host "`n=== FIX TERMINÉ ===" -ForegroundColor Green
Write-Host "`nLe header restera maintenant fixé en haut de la page." -ForegroundColor Cyan
Write-Host "La cloche et le menu utilisateur seront toujours visibles." -ForegroundColor Cyan
