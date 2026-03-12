# Script pour récupérer les fichiers dashboard demandeur depuis GitHub
# Repository: https://github.com/Ouz4real/uasz-maintenance-backend.git

Write-Host "🔄 Récupération des fichiers dashboard demandeur depuis GitHub..." -ForegroundColor Cyan

# Créer un dossier temporaire
$tempDir = "temp-github-recovery-demandeur"
if (Test-Path $tempDir) {
    Remove-Item -Recurse -Force $tempDir
}

# Cloner le repository dans un dossier temporaire
Write-Host "📥 Clonage du repository..." -ForegroundColor Yellow
git clone https://github.com/Ouz4real/uasz-maintenance-backend.git $tempDir

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Repository cloné avec succès" -ForegroundColor Green
    
    # Copier les fichiers dashboard demandeur
    $sourceHtml = "$tempDir/uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.html"
    $sourceTs = "$tempDir/uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.ts"
    $sourceScss = "$tempDir/uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.scss"
    
    $destDir = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur"
    
    if (Test-Path $sourceHtml) {
        Copy-Item $sourceHtml "$destDir/dashboard-demandeur.component.html" -Force
        Write-Host "✅ HTML récupéré" -ForegroundColor Green
    }
    
    if (Test-Path $sourceTs) {
        Copy-Item $sourceTs "$destDir/dashboard-demandeur.component.ts" -Force
        Write-Host "✅ TypeScript récupéré" -ForegroundColor Green
    }
    
    if (Test-Path $sourceScss) {
        Copy-Item $sourceScss "$destDir/dashboard-demandeur.component.scss" -Force
        Write-Host "✅ SCSS récupéré" -ForegroundColor Green
    }
    
    # Nettoyer le dossier temporaire
    Remove-Item -Recurse -Force $tempDir
    Write-Host "🧹 Nettoyage terminé" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "✅ RÉCUPÉRATION TERMINÉE!" -ForegroundColor Green
    Write-Host "Les fichiers dashboard demandeur ont été restaurés depuis GitHub" -ForegroundColor Cyan
} else {
    Write-Host "❌ Erreur lors du clonage du repository" -ForegroundColor Red
    Write-Host "Vérifiez votre connexion internet et vos identifiants GitHub" -ForegroundColor Yellow
}
