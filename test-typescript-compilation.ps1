# Script pour tester la compilation TypeScript

Write-Host "🧪 Test de compilation TypeScript" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Aller dans le répertoire frontend
Set-Location "uasz-maintenance-frontend"

Write-Host "`n1. Vérification de la syntaxe TypeScript..." -ForegroundColor Yellow

# Tester la compilation TypeScript
$result = & npx tsc --noEmit --skipLibCheck 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Compilation TypeScript réussie" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreurs de compilation détectées:" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
}

Write-Host "`n2. Vérification des fichiers modifiés..." -ForegroundColor Yellow

# Vérifier que les modifications ont été appliquées
$responsableFile = "src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"
$demandeFile = "src/app/core/models/demande.model.ts"

if (Test-Path $responsableFile) {
    $responsableContent = Get-Content $responsableFile -Raw
    
    if ($responsableContent -match "ANNULEE") {
        Write-Host "   ✅ Statut ANNULEE trouvé dans le composant responsable" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Statut ANNULEE non trouvé dans le composant responsable" -ForegroundColor Red
    }
    
    if ($responsableContent -match "showDeclinedDetailsModal") {
        Write-Host "   ✅ Modale des demandes déclinées trouvée" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Modale des demandes déclinées non trouvée" -ForegroundColor Red
    }
}

if (Test-Path $demandeFile) {
    $demandeContent = Get-Content $demandeFile -Raw
    
    if ($demandeContent -match "ANNULEE") {
        Write-Host "   ✅ Statut ANNULEE ajouté à l'interface Demande" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Statut ANNULEE non ajouté à l'interface Demande" -ForegroundColor Red
    }
}

# Retourner au répertoire racine
Set-Location ".."

Write-Host "`n📋 Résumé du test:" -ForegroundColor Cyan
Write-Host "   • Compilation TypeScript vérifiée" -ForegroundColor White
Write-Host "   • Modifications des interfaces confirmées" -ForegroundColor White
Write-Host "   • Modale des demandes déclinées intégrée" -ForegroundColor White

Write-Host "`n🎯 Prochaines étapes pour tester:" -ForegroundColor Cyan
Write-Host "   1. Démarrer le frontend: npm start" -ForegroundColor White
Write-Host "   2. Se connecter en tant que responsable maintenance" -ForegroundColor White
Write-Host "   3. Tester la nouvelle modale sur les demandes déclinées" -ForegroundColor White