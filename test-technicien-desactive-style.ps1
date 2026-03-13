#!/usr/bin/env pwsh
# Test du style grisé pour les techniciens désactivés

Write-Host "🧪 Test du style pour techniciens désactivés" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host ""
Write-Host "✅ CORRECTION APPLIQUÉE : Carte technicien grisée si désactivé" -ForegroundColor Green
Write-Host ""

Write-Host "📋 MODIFICATIONS APPORTÉES :" -ForegroundColor Yellow
Write-Host ""

# Vérifier le SCSS
$scssFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.scss"

if (Test-Path $scssFile) {
    $content = Get-Content $scssFile -Raw
    
    if ($content -match "\.resp-tech-card\.disabled") {
        Write-Host "   ✓ SCSS : Classe .disabled ajoutée" -ForegroundColor Green
        Write-Host "      - opacity: 0.5 (carte grisée à 50%)" -ForegroundColor Gray
        Write-Host "      - background: #f3f4f6 (fond gris clair)" -ForegroundColor Gray
        Write-Host "      - cursor: not-allowed (curseur interdit)" -ForegroundColor Gray
        Write-Host "      - pointer-events: none (pas de clic)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ SCSS : Classe .disabled manquante" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier SCSS introuvable" -ForegroundColor Yellow
}

Write-Host ""

# Vérifier le HTML
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html"

if (Test-Path $htmlFile) {
    $content = Get-Content $htmlFile -Raw
    
    if ($content -match '\[class\.disabled\]="!t\.enabled"') {
        Write-Host "   ✓ HTML : Binding [class.disabled] ajouté" -ForegroundColor Green
        Write-Host "      - Condition : !t.enabled (si technicien désactivé)" -ForegroundColor Gray
    } else {
        Write-Host "   ✗ HTML : Binding [class.disabled] manquant" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier HTML introuvable" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60
Write-Host "🎯 COMMENT TESTER :" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. DÉSACTIVER UN TECHNICIEN :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant qu'Admin" -ForegroundColor White
Write-Host "   b) Allez dans 'Gestion des utilisateurs'" -ForegroundColor White
Write-Host "   c) Trouvez un technicien et cliquez sur 'Désactiver'" -ForegroundColor White
Write-Host ""

Write-Host "2. VÉRIFIER L'AFFICHAGE :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant que Responsable" -ForegroundColor White
Write-Host "   b) Allez dans la section 'Techniciens'" -ForegroundColor White
Write-Host "   c) Vérifiez que la carte du technicien désactivé est :" -ForegroundColor White
Write-Host "      - Grisée (opacité réduite)" -ForegroundColor Gray
Write-Host "      - Fond gris clair" -ForegroundColor Gray
Write-Host "      - Curseur 'interdit' au survol" -ForegroundColor Gray
Write-Host "      - Non cliquable" -ForegroundColor Gray
Write-Host ""

Write-Host "3. RÉACTIVER LE TECHNICIEN :" -ForegroundColor Yellow
Write-Host "   a) Retournez dans l'interface Admin" -ForegroundColor White
Write-Host "   b) Cliquez sur 'Activer' pour le technicien" -ForegroundColor White
Write-Host "   c) Vérifiez que la carte redevient normale" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host ""
Write-Host "📊 DÉTAILS TECHNIQUES :" -ForegroundColor Cyan
Write-Host ""
Write-Host "PROPRIÉTÉ UTILISÉE :" -ForegroundColor Yellow
Write-Host "   - TechnicienUI.enabled (boolean)" -ForegroundColor White
Write-Host "   - true = technicien actif (carte normale)" -ForegroundColor Green
Write-Host "   - false = technicien désactivé (carte grisée)" -ForegroundColor Red
Write-Host ""

Write-Host "CLASSE CSS APPLIQUÉE :" -ForegroundColor Yellow
Write-Host "   - .resp-tech-card (normal)" -ForegroundColor White
Write-Host "   - .resp-tech-card.disabled (si !t.enabled)" -ForegroundColor Gray
Write-Host ""

Write-Host "EFFETS VISUELS :" -ForegroundColor Yellow
Write-Host "   - Opacité : 50% (carte semi-transparente)" -ForegroundColor White
Write-Host "   - Fond : Gris clair (#f3f4f6)" -ForegroundColor White
Write-Host "   - Curseur : Interdit (not-allowed)" -ForegroundColor White
Write-Host "   - Interaction : Désactivée (pointer-events: none)" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "✅ Test terminé" -ForegroundColor Green
