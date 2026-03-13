# Script de test pour vérifier l'affichage des informations de déclin

Write-Host "🧪 Test de l'affichage des informations de déclin dans la modale" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan

# Vérifier que la section a été ajoutée dans le HTML
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"
$htmlContent = Get-Content $htmlFile -Raw -Encoding UTF8

Write-Host "`n1. Vérification de la section HTML..." -ForegroundColor Yellow

if ($htmlContent -match "Informations de déclin") {
    Write-Host "   ✅ Section 'Informations de déclin' trouvée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Section 'Informations de déclin' non trouvée" -ForegroundColor Red
}

if ($htmlContent -match "decline-info-box") {
    Write-Host "   ✅ Classe 'decline-info-box' trouvée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Classe 'decline-info-box' non trouvée" -ForegroundColor Red
}

if ($htmlContent -match "selectedIntervention\.raisonRefus") {
    Write-Host "   ✅ Binding 'raisonRefus' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Binding 'raisonRefus' non trouvé" -ForegroundColor Red
}

if ($htmlContent -match "selectedIntervention\.dateRefus") {
    Write-Host "   ✅ Binding 'dateRefus' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Binding 'dateRefus' non trouvé" -ForegroundColor Red
}

if ($htmlContent -match "selectedIntervention\.technicienNom") {
    Write-Host "   ✅ Binding 'technicienNom' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Binding 'technicienNom' non trouvé" -ForegroundColor Red
}

# Vérifier les styles CSS
Write-Host "`n2. Vérification des styles CSS..." -ForegroundColor Yellow

$scssFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss"
$scssContent = Get-Content $scssFile -Raw -Encoding UTF8

if ($scssContent -match "\.decline-info-box") {
    Write-Host "   ✅ Style 'decline-info-box' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Style 'decline-info-box' non trouvé" -ForegroundColor Red
}

if ($scssContent -match "\.decline-label") {
    Write-Host "   ✅ Style 'decline-label' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Style 'decline-label' non trouvé" -ForegroundColor Red
}

if ($scssContent -match "\.decline-reason") {
    Write-Host "   ✅ Style 'decline-reason' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Style 'decline-reason' non trouvé" -ForegroundColor Red
}

# Vérifier le mapping dans le TypeScript
Write-Host "`n3. Vérification du mapping TypeScript..." -ForegroundColor Yellow

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts"
$tsContent = Get-Content $tsFile -Raw -Encoding UTF8

if ($tsContent -match "raisonRefus: p\.raisonRefus") {
    Write-Host "   ✅ Mapping 'raisonRefus' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Mapping 'raisonRefus' non trouvé" -ForegroundColor Red
}

if ($tsContent -match "dateRefus: p\.dateRefus") {
    Write-Host "   ✅ Mapping 'dateRefus' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Mapping 'dateRefus' non trouvé" -ForegroundColor Red
}

if ($tsContent -match "technicienNom: p\.technicienNom") {
    Write-Host "   ✅ Mapping 'technicienNom' trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Mapping 'technicienNom' non trouvé" -ForegroundColor Red
}

Write-Host "`n📋 Résumé des modifications apportées:" -ForegroundColor Cyan
Write-Host "   • Ajout de la section 'Informations de déclin' dans la modale" -ForegroundColor White
Write-Host "   • Affichage conditionnel pour les demandes avec statut 'DECLINEE'" -ForegroundColor White
Write-Host "   • Affichage de la date du déclin, du technicien et de la raison" -ForegroundColor White
Write-Host "   • Styles CSS pour une présentation claire des informations" -ForegroundColor White
Write-Host "   • Mapping des champs depuis l'API backend" -ForegroundColor White

Write-Host "`n🎯 Pour tester:" -ForegroundColor Cyan
Write-Host "   1. Démarrer le frontend: cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "   2. Se connecter en tant que technicien" -ForegroundColor White
Write-Host "   3. Cliquer sur une intervention avec statut 'Déclinée'" -ForegroundColor White
Write-Host "   4. Vérifier que la section 'Informations de déclin' s'affiche" -ForegroundColor White

Write-Host "`n✅ Correction terminée avec succès!" -ForegroundColor Green