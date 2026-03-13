# Test complet de toutes les corrections du dashboard Responsable
# Ce script vérifie que toutes les corrections de la conversation précédente sont bien appliquées

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLET - DASHBOARD RESPONSABLE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allTestsPassed = $true

# Test 1: Vérifier que NotificationBellComponent est importé
Write-Host "Test 1: Vérification de l'import NotificationBellComponent..." -ForegroundColor Yellow
$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts" -Raw
if ($tsContent -match "import.*NotificationBellComponent") {
    Write-Host "✓ NotificationBellComponent est importé" -ForegroundColor Green
} else {
    Write-Host "✗ NotificationBellComponent n'est PAS importé" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 2: Vérifier que la cloche de notification est dans le HTML
Write-Host "`nTest 2: Vérification de la cloche de notification dans le HTML..." -ForegroundColor Yellow
$htmlContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html" -Raw
if ($htmlContent -match "<app-notification-bell") {
    Write-Host "✓ La cloche de notification est présente dans le HTML" -ForegroundColor Green
} else {
    Write-Host "✗ La cloche de notification n'est PAS présente dans le HTML" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 3: Vérifier que onNotificationClicked() existe
Write-Host "`nTest 3: Vérification de la méthode onNotificationClicked()..." -ForegroundColor Yellow
if ($tsContent -match "onNotificationClicked\(") {
    Write-Host "✓ La méthode onNotificationClicked() existe" -ForegroundColor Green
} else {
    Write-Host "✗ La méthode onNotificationClicked() n'existe PAS" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 4: Vérifier l'affichage du nom complet du technicien (prénom + nom)
Write-Host "`nTest 4: Vérification de l'affichage du nom complet du technicien..." -ForegroundColor Yellow
if ($htmlContent -match "\{\{\s*t\.prenom\s*\}\}\s*\{\{\s*t\.nom\s*\}\}") {
    Write-Host "✓ Le nom complet du technicien est affiché (prénom + nom)" -ForegroundColor Green
} else {
    Write-Host "✗ Le nom complet du technicien n'est PAS affiché correctement" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 5: Vérifier le style CSS pour les techniciens désactivés
Write-Host "`nTest 5: Vérification du style CSS pour les techniciens désactivés..." -ForegroundColor Yellow
$scssContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.scss" -Raw
if ($scssContent -match "\.resp-tech-card\.disabled") {
    Write-Host "✓ Le style CSS pour les techniciens désactivés existe" -ForegroundColor Green
} else {
    Write-Host "✗ Le style CSS pour les techniciens désactivés n'existe PAS" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 6: Vérifier le binding [class.disabled] dans le HTML
Write-Host "`nTest 6: Vérification du binding [class.disabled] dans le HTML..." -ForegroundColor Yellow
if ($htmlContent -match "\[class\.disabled\]=""!t\.enabled""") {
    Write-Host "✓ Le binding [class.disabled] est présent" -ForegroundColor Green
} else {
    Write-Host "✗ Le binding [class.disabled] n'est PAS présent" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 7: Vérifier le mapping de la propriété 'enabled' dans mapUserToTechnicienUI
Write-Host "`nTest 7: Vérification du mapping de la propriété 'enabled'..." -ForegroundColor Yellow
if ($tsContent -match "enabled.*typeof.*u\?\.enabled.*boolean") {
    Write-Host "✓ Le mapping de la propriété 'enabled' est correct" -ForegroundColor Green
} else {
    Write-Host "✗ Le mapping de la propriété 'enabled' n'est PAS correct" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 8: Vérifier la pagination des maintenances préventives
Write-Host "`nTest 8: Vérification de la pagination des maintenances préventives..." -ForegroundColor Yellow
if ($tsContent -match "paginatedMaintenancesPreventives" -and 
    $tsContent -match "updatePreventivePagination" -and
    $tsContent -match "goToPreventivePage" -and
    $tsContent -match "nextPreventivePage" -and
    $tsContent -match "previousPreventivePage") {
    Write-Host "✓ La pagination des maintenances préventives est implémentée" -ForegroundColor Green
} else {
    Write-Host "✗ La pagination des maintenances préventives n'est PAS complète" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 9: Vérifier l'affichage du nom complet du demandeur (prénom + nom)
Write-Host "`nTest 9: Vérification de l'affichage du nom complet du demandeur..." -ForegroundColor Yellow
$demandeurMappingCount = ([regex]::Matches($tsContent, "demandeur\.prenom.*demandeur\.nom")).Count
if ($demandeurMappingCount -ge 4) {
    Write-Host "✓ Le nom complet du demandeur est mappé dans $demandeurMappingCount endroits" -ForegroundColor Green
} else {
    Write-Host "✗ Le nom complet du demandeur n'est mappé que dans $demandeurMappingCount endroits (attendu: 4+)" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 10: Vérifier que demandeurNom est affiché dans le HTML
Write-Host "`nTest 10: Vérification de l'affichage de demandeurNom dans le HTML..." -ForegroundColor Yellow
if ($htmlContent -match "demandeurNom") {
    Write-Host "✓ demandeurNom est affiché dans le HTML" -ForegroundColor Green
} else {
    Write-Host "✗ demandeurNom n'est PAS affiché dans le HTML" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 11: Vérifier que le modèle Demande a le champ demandeurNom
Write-Host "`nTest 11: Vérification du champ demandeurNom dans le modèle Demande..." -ForegroundColor Yellow
$demandeModelContent = Get-Content "uasz-maintenance-frontend/src/app/core/models/demande.model.ts" -Raw
if ($demandeModelContent -match "demandeurNom:\s*string") {
    Write-Host "✓ Le champ demandeurNom existe dans le modèle Demande" -ForegroundColor Green
} else {
    Write-Host "✗ Le champ demandeurNom n'existe PAS dans le modèle Demande" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 12: Vérifier que le PDF utilise demandeurNom
Write-Host "`nTest 12: Vérification de l'utilisation de demandeurNom dans le PDF..." -ForegroundColor Yellow
if ($tsContent -match "Signalée par:.*selectedDemande\.demandeurNom") {
    Write-Host "✓ Le PDF utilise demandeurNom pour afficher le nom du demandeur" -ForegroundColor Green
} else {
    Write-Host "✗ Le PDF n'utilise PAS demandeurNom correctement" -ForegroundColor Red
    $allTestsPassed = $false
}

# Test 13: Vérifier le style flexbox pour .topbar-right
Write-Host "`nTest 13: Vérification du style flexbox pour .topbar-right..." -ForegroundColor Yellow
if ($scssContent -match "\.topbar-right" -and $scssContent -match "display:\s*flex") {
    Write-Host "✓ Le style flexbox pour .topbar-right est présent" -ForegroundColor Green
} else {
    Write-Host "✗ Le style flexbox pour .topbar-right n'est PAS présent" -ForegroundColor Red
    $allTestsPassed = $false
}

# Résumé final
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($allTestsPassed) {
    Write-Host "✓ TOUS LES TESTS SONT PASSÉS!" -ForegroundColor Green
    Write-Host "`nToutes les corrections de la conversation précédente sont bien appliquées:" -ForegroundColor Green
    Write-Host "  1. Notification bell ajoutée et fonctionnelle" -ForegroundColor White
    Write-Host "  2. Nom complet du technicien affiché (prénom + nom)" -ForegroundColor White
    Write-Host "  3. Techniciens désactivés affichés en gris" -ForegroundColor White
    Write-Host "  4. Pagination des maintenances préventives" -ForegroundColor White
    Write-Host "  5. Nom complet du demandeur affiché (prénom + nom)" -ForegroundColor White
    Write-Host "  6. Style flexbox pour la topbar" -ForegroundColor White
} else {
    Write-Host "✗ CERTAINS TESTS ONT ÉCHOUÉ" -ForegroundColor Red
    Write-Host "`nVeuillez vérifier les erreurs ci-dessus." -ForegroundColor Yellow
}

Write-Host ""
