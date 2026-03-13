#!/usr/bin/env pwsh
# Test des corrections : notifications cliquables + noms complets des techniciens

Write-Host "🧪 Test des corrections apportées" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host ""
Write-Host "✅ CORRECTION 1 : Notifications cliquables" -ForegroundColor Green
Write-Host "   - Responsable : onNotificationClicked() implémenté" -ForegroundColor White
Write-Host "   - Demandeur : onNotificationClicked() implémenté" -ForegroundColor White
Write-Host "   - Comportement : Clic sur notification → ouvre la modale de la demande" -ForegroundColor White
Write-Host ""

Write-Host "✅ CORRECTION 2 : Noms complets des techniciens" -ForegroundColor Green
Write-Host "   - Liste des techniciens : {{ t.prenom }} {{ t.nom }}" -ForegroundColor White
Write-Host "   - Modale détails technicien : {{ tech.prenom }} {{ tech.nom }}" -ForegroundColor White
Write-Host "   - Affiche maintenant : Prénom + Nom (au lieu de juste Nom)" -ForegroundColor White
Write-Host ""

Write-Host "📋 FICHIERS MODIFIÉS :" -ForegroundColor Yellow
Write-Host "   1. dashboard-responsable.component.html (2 emplacements)" -ForegroundColor White
Write-Host "      - Ligne ~458 : Liste des techniciens" -ForegroundColor Gray
Write-Host "      - Ligne ~2049 : Modale détails technicien" -ForegroundColor Gray
Write-Host ""

Write-Host "🔍 VÉRIFICATION DES IMPLÉMENTATIONS :" -ForegroundColor Yellow
Write-Host ""

# Vérifier les fichiers TypeScript
$responsableTs = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"
$demandeurTs = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardDemandeur/dashboard-demandeur.component.ts"

if (Test-Path $responsableTs) {
    $content = Get-Content $responsableTs -Raw
    if ($content -match "onNotificationClicked\(notification: any\): void") {
        Write-Host "   ✓ Responsable : onNotificationClicked() trouvé" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Responsable : onNotificationClicked() manquant" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier Responsable TS introuvable" -ForegroundColor Yellow
}

if (Test-Path $demandeurTs) {
    $content = Get-Content $demandeurTs -Raw
    if ($content -match "onNotificationClicked\(notification: any\): void") {
        Write-Host "   ✓ Demandeur : onNotificationClicked() trouvé" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Demandeur : onNotificationClicked() manquant" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier Demandeur TS introuvable" -ForegroundColor Yellow
}

# Vérifier le HTML
$responsableHtml = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html"

if (Test-Path $responsableHtml) {
    $content = Get-Content $responsableHtml -Raw
    
    # Vérifier l'affichage du nom complet dans la liste
    if ($content -match "t\.prenom.*t\.nom") {
        Write-Host "   ✓ Liste techniciens : affichage prénom + nom" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Liste techniciens : affichage incomplet" -ForegroundColor Red
    }
    
    # Vérifier l'affichage du nom complet dans la modale
    if ($content -match "tech\.prenom.*tech\.nom") {
        Write-Host "   ✓ Modale technicien : affichage prénom + nom" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Modale technicien : affichage incomplet" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier Responsable HTML introuvable" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60
Write-Host "🎯 COMMENT TESTER :" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. NOTIFICATIONS CLIQUABLES :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant que Responsable ou Demandeur" -ForegroundColor White
Write-Host "   b) Cliquez sur la cloche de notification" -ForegroundColor White
Write-Host "   c) Cliquez sur une notification de demande" -ForegroundColor White
Write-Host "   d) Vérifiez que la modale de la demande s'ouvre automatiquement" -ForegroundColor White
Write-Host ""

Write-Host "2. NOMS COMPLETS DES TECHNICIENS :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant que Responsable" -ForegroundColor White
Write-Host "   b) Allez dans la section 'Techniciens'" -ForegroundColor White
Write-Host "   c) Vérifiez que chaque carte affiche 'Prénom Nom'" -ForegroundColor White
Write-Host "   d) Cliquez sur un technicien pour ouvrir les détails" -ForegroundColor White
Write-Host "   e) Vérifiez que le titre de la modale affiche 'Prénom Nom'" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "✅ Test terminé" -ForegroundColor Green
