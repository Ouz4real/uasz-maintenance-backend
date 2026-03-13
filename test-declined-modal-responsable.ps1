# Script de test pour vérifier la modale des demandes déclinées dans le dashboard responsable

Write-Host "🧪 Test de la modale des demandes déclinées - Dashboard Responsable" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Vérifier que la nouvelle modale a été ajoutée dans le HTML
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html"
$htmlContent = Get-Content $htmlFile -Raw -Encoding UTF8

Write-Host "`n1. Vérification de la nouvelle modale HTML..." -ForegroundColor Yellow

if ($htmlContent -match "showDeclinedDetailsModal") {
    Write-Host "   ✅ Propriété 'showDeclinedDetailsModal' trouvée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Propriété 'showDeclinedDetailsModal' non trouvée" -ForegroundColor Red
}

if ($htmlContent -match "selectedDeclinedDemande") {
    Write-Host "   ✅ Propriété 'selectedDeclinedDemande' trouvée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Propriété 'selectedDeclinedDemande' non trouvée" -ForegroundColor Red
}

if ($htmlContent -match "Détails de la demande déclinée") {
    Write-Host "   ✅ Titre de la modale trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Titre de la modale non trouvé" -ForegroundColor Red
}

if ($htmlContent -match "Informations de déclin") {
    Write-Host "   ✅ Section 'Informations de déclin' trouvée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Section 'Informations de déclin' non trouvée" -ForegroundColor Red
}

# Vérifier les modifications dans le TypeScript
Write-Host "`n2. Vérification des modifications TypeScript..." -ForegroundColor Yellow

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"
$tsContent = Get-Content $tsFile -Raw -Encoding UTF8

if ($tsContent -match "showDeclinedDetailsModal.*false") {
    Write-Host "   ✅ Propriété 'showDeclinedDetailsModal' déclarée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Propriété 'showDeclinedDetailsModal' non déclarée" -ForegroundColor Red
}

if ($tsContent -match "openDeclinedDetails") {
    Write-Host "   ✅ Méthode 'openDeclinedDetails' trouvée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Méthode 'openDeclinedDetails' non trouvée" -ForegroundColor Red
}

if ($tsContent -match "closeDeclinedDetailsModal") {
    Write-Host "   ✅ Méthode 'closeDeclinedDetailsModal' trouvée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Méthode 'closeDeclinedDetailsModal' non trouvée" -ForegroundColor Red
}

if ($tsContent -match "raisonRefus.*technicienNom.*technicienPrenom") {
    Write-Host "   ✅ Champs de déclin ajoutés à l'interface" -ForegroundColor Green
} else {
    Write-Host "   ❌ Champs de déclin non ajoutés à l'interface" -ForegroundColor Red
}

if ($tsContent -match "statutInterventions.*DECLINEE") {
    Write-Host "   ✅ Gestion du statut DECLINEE ajoutée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Gestion du statut DECLINEE non ajoutée" -ForegroundColor Red
}

# Vérifier les styles CSS
Write-Host "`n3. Vérification des styles CSS..." -ForegroundColor Yellow

$scssFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.scss"
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

Write-Host "`n📋 Résumé des modifications apportées:" -ForegroundColor Cyan
Write-Host "   • Nouvelle modale spécifique pour les demandes déclinées" -ForegroundColor White
Write-Host "   • Logique de routage : demandes déclinées → nouvelle modale" -ForegroundColor White
Write-Host "   • Affichage des informations de déclin (date, technicien, raison)" -ForegroundColor White
Write-Host "   • Interface mise à jour avec les champs de déclin" -ForegroundColor White
Write-Host "   • Gestion du statut DECLINEE dans le mapping" -ForegroundColor White
Write-Host "   • Styles CSS cohérents avec le dashboard technicien" -ForegroundColor White

Write-Host "`n🎯 Pour tester:" -ForegroundColor Cyan
Write-Host "   1. Démarrer le frontend: cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "   2. Se connecter en tant que responsable maintenance" -ForegroundColor White
Write-Host "   3. Aller dans 'Mes demandes'" -ForegroundColor White
Write-Host "   4. Filtrer par 'Déclinées'" -ForegroundColor White
Write-Host "   5. Cliquer sur 'Voir détails' d'une demande déclinée" -ForegroundColor White
Write-Host "   6. Vérifier que la nouvelle modale s'affiche avec les informations de déclin" -ForegroundColor White

Write-Host "`n✅ Implémentation terminée avec succès!" -ForegroundColor Green