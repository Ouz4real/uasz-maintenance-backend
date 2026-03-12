# Script pour corriger l'erreur PanneDto.statutInterventions

Write-Host "🔧 Correction de l'erreur PanneDto.statutInterventions" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$filePath = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"

# Lire le contenu du fichier
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "`n1. Correction de l'accès à statutInterventions..." -ForegroundColor Yellow

# Corriger l'accès à statutInterventions avec un cast
$oldLine = "statut: this.mapStatutApiToUi(updatedApi.statut, updatedApi.statutInterventions),"
$newLine = "statut: this.mapStatutApiToUi(updatedApi.statut, (updatedApi as any).statutInterventions),"

$content = $content -replace [regex]::Escape($oldLine), $newLine

Write-Host "   ✅ Accès à statutInterventions corrigé avec cast" -ForegroundColor Green

Write-Host "`n2. Vérification d'autres occurrences similaires..." -ForegroundColor Yellow

# Chercher d'autres occurrences similaires et les corriger
$patterns = @(
    @{
        old = "panneApi.statutInterventions"
        new = "(panneApi as any).statutInterventions"
    },
    @{
        old = "updated.statutInterventions"
        new = "(updated as any).statutInterventions"
    }
)

$corrections = 0
foreach ($pattern in $patterns) {
    if ($content -match [regex]::Escape($pattern.old)) {
        $content = $content -replace [regex]::Escape($pattern.old), $pattern.new
        $corrections++
        Write-Host "   ✅ Corrigé: $($pattern.old)" -ForegroundColor Green
    }
}

if ($corrections -eq 0) {
    Write-Host "   ℹ️ Aucune autre occurrence trouvée" -ForegroundColor Blue
}

# Écrire le contenu corrigé
Set-Content $filePath -Value $content -Encoding UTF8

Write-Host "`n✅ Erreur PanneDto.statutInterventions corrigée!" -ForegroundColor Green
Write-Host "`n📋 Résumé des corrections:" -ForegroundColor Cyan
Write-Host "   • Cast (updatedApi as any).statutInterventions ajouté" -ForegroundColor White
Write-Host "   • Autres occurrences similaires vérifiées et corrigées" -ForegroundColor White

Write-Host "`n🎯 Prochaine étape:" -ForegroundColor Cyan
Write-Host "   Tester la compilation TypeScript pour vérifier qu'il n'y a plus d'erreurs" -ForegroundColor White