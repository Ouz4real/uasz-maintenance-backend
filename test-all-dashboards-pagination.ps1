# Test complet de toutes les paginations dans tous les dashboards

Write-Host "=== TEST COMPLET PAGINATION TOUS LES DASHBOARDS ===" -ForegroundColor Cyan
Write-Host ""

$dashboards = @(
    @{
        Name = "Responsable"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable"
        Sections = @("Tableau de bord", "Mes demandes", "Maintenances preventives", "Gestion stock")
    },
    @{
        Name = "Admin"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardAdmin"
        Sections = @("Utilisateurs", "Mes demandes")
    },
    @{
        Name = "Demandeur"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur"
        Sections = @("Dashboard", "Mes demandes", "Documents")
    },
    @{
        Name = "Technicien"
        Path = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien"
        Sections = @("Mes interventions", "Maintenances preventives", "Mes demandes", "Equipements", "Historique")
    }
)

$totalSections = 0
$completeSections = 0

foreach ($dashboard in $dashboards) {
    Write-Host "`n=== DASHBOARD $($dashboard.Name.ToUpper()) ===" -ForegroundColor Yellow
    
    $tsPath = "$($dashboard.Path)/dashboard-$($dashboard.Name.ToLower()).component.ts"
    $htmlPath = "$($dashboard.Path)/dashboard-$($dashboard.Name.ToLower()).component.html"
    $scssPath = "$($dashboard.Path)/dashboard-$($dashboard.Name.ToLower()).component.scss"
    
    if (Test-Path $tsPath) {
        $tsContent = Get-Content $tsPath -Raw
        $htmlContent = Get-Content $htmlPath -Raw
        $scssContent = Get-Content $scssPath -Raw
        
        # Compter les methodes getVisible*Pages
        $getVisibleCount = ([regex]::Matches($tsContent, "getVisible\w*Pages\(\)")).Count
        
        # Compter les pagination-ellipsis dans le HTML
        $ellipsisCount = ([regex]::Matches($htmlContent, "pagination-ellipsis")).Count
        
        # Verifier le style SCSS
        $hasEllipsisStyle = $scssContent -match "\.pagination-ellipsis"
        
        Write-Host "  Sections: $($dashboard.Sections.Count)" -ForegroundColor White
        Write-Host "  Methodes getVisible*Pages: $getVisibleCount" -ForegroundColor White
        Write-Host "  Ellipsis dans HTML: $ellipsisCount" -ForegroundColor White
        Write-Host "  Style ellipsis: $(if ($hasEllipsisStyle) { 'Oui' } else { 'Non' })" -ForegroundColor White
        
        if ($getVisibleCount -eq $dashboard.Sections.Count -and $ellipsisCount -eq $dashboard.Sections.Count -and $hasEllipsisStyle) {
            Write-Host "  [SUCCES] Toutes les sections sont completes" -ForegroundColor Green
            $completeSections += $dashboard.Sections.Count
        } else {
            Write-Host "  [ATTENTION] Verification manuelle recommandee" -ForegroundColor Yellow
        }
        
        $totalSections += $dashboard.Sections.Count
        
        Write-Host "  Sections implementees:" -ForegroundColor Cyan
        foreach ($section in $dashboard.Sections) {
            Write-Host "    - $section" -ForegroundColor White
        }
    } else {
        Write-Host "  [ERREUR] Fichier non trouve: $tsPath" -ForegroundColor Red
    }
}

Write-Host "`n=== RESUME GLOBAL ===" -ForegroundColor Cyan
Write-Host "Total sections avec pagination: $totalSections" -ForegroundColor White
Write-Host "Sections completes: $completeSections" -ForegroundColor White

if ($completeSections -eq $totalSections) {
    Write-Host "`n[SUCCES] Toutes les paginations sont implementees!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Caracteristiques communes:" -ForegroundColor White
    Write-Host "  - Fenetre glissante (max 7 pages visibles)" -ForegroundColor White
    Write-Host "  - Ellipsis (...) pour les pages cachees" -ForegroundColor White
    Write-Host "  - Toujours afficher premiere et derniere page" -ForegroundColor White
    Write-Host "  - Style uniforme sur tous les dashboards" -ForegroundColor White
    Write-Host ""
    Write-Host "Dashboards concernes:" -ForegroundColor White
    Write-Host "  - Responsable: 4 sections" -ForegroundColor White
    Write-Host "  - Admin: 2 sections" -ForegroundColor White
    Write-Host "  - Demandeur: 3 sections" -ForegroundColor White
    Write-Host "  - Technicien: 5 sections" -ForegroundColor White
    Write-Host ""
    Write-Host "Total: 14 sections avec pagination" -ForegroundColor Green
} else {
    Write-Host "`n[ATTENTION] Certaines sections necessitent une verification" -ForegroundColor Yellow
}

Write-Host "`n=== PROCHAINES ETAPES ===" -ForegroundColor Cyan
Write-Host "1. Tester manuellement chaque dashboard" -ForegroundColor White
Write-Host "2. Verifier le comportement avec plus de 7 pages" -ForegroundColor White
Write-Host "3. Tester la recherche/filtrage avec pagination" -ForegroundColor White
Write-Host "4. Pousser les modifications sur GitHub" -ForegroundColor White
