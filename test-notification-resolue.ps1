# Test: Notification au demandeur quand le responsable marque comme RESOLUE

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Notification Demandeur - Demande Résolue" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080/api"

# 1. Login Demandeur (pour créer une demande)
Write-Host "1. Login Demandeur..." -ForegroundColor Yellow
$loginDemandeur = @{
    username = "demandeur1"
    password = "password"
} | ConvertTo-Json

$demandeurResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginDemandeur -ContentType "application/json"
$demandeurToken = $demandeurResponse.token
$demandeurId = $demandeurResponse.id
Write-Host "✓ Demandeur connecté (ID: $demandeurId)" -ForegroundColor Green
Write-Host ""

# 2. Créer une demande
Write-Host "2. Création d'une demande..." -ForegroundColor Yellow
$nouvelleDemande = @{
    titre = "Test Notification Resolue"
    description = "Test pour vérifier la notification au demandeur"
    localisation = "Bureau Test"
    priorite = "MOYENNE"
    equipementId = 1
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $demandeurToken"
    "Content-Type" = "application/json"
}

$demande = Invoke-RestMethod -Uri "$baseUrl/pannes" -Method Post -Body $nouvelleDemande -Headers $headers
$demandeId = $demande.id
Write-Host "✓ Demande créée (ID: $demandeId)" -ForegroundColor Green
Write-Host ""

# 3. Login Responsable
Write-Host "3. Login Responsable..." -ForegroundColor Yellow
$loginResp = @{
    username = "responsable1"
    password = "password"
} | ConvertTo-Json

$respResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginResp -ContentType "application/json"
$respToken = $respResponse.token
Write-Host "✓ Responsable connecté" -ForegroundColor Green
Write-Host ""

# 4. Affecter à un technicien
Write-Host "4. Affectation au technicien..." -ForegroundColor Yellow
$affectation = @{
    technicienId = 37
    prioriteResponsable = "MOYENNE"
} | ConvertTo-Json

$headersResp = @{
    "Authorization" = "Bearer $respToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/traiter" -Method Post -Body $affectation -Headers $headersResp
Write-Host "✓ Demande affectée au technicien" -ForegroundColor Green
Write-Host ""

# 5. Login Technicien
Write-Host "5. Login Technicien..." -ForegroundColor Yellow
$loginTech = @{
    username = "technicien1"
    password = "password"
} | ConvertTo-Json

$techResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginTech -ContentType "application/json"
$techToken = $techResponse.token
Write-Host "✓ Technicien connecté" -ForegroundColor Green
Write-Host ""

# 6. Démarrer l'intervention
Write-Host "6. Démarrage de l'intervention..." -ForegroundColor Yellow
$headersTech = @{
    "Authorization" = "Bearer $techToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/demarrer-intervention" -Method Patch -Headers $headersTech
Write-Host "✓ Intervention démarrée" -ForegroundColor Green
Write-Host ""

# 7. Terminer l'intervention
Write-Host "7. Terminer l'intervention..." -ForegroundColor Yellow
$terminer = @{
    noteTechnicien = "Intervention terminée avec succès"
    pieces = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/terminer-intervention" -Method Patch -Body $terminer -Headers $headersTech
Write-Host "✓ Intervention terminée" -ForegroundColor Green
Write-Host ""

# 8. Vérifier les notifications du demandeur AVANT résolution
Write-Host "8. Notifications du demandeur AVANT résolution..." -ForegroundColor Yellow
$headersDemandeur = @{
    "Authorization" = "Bearer $demandeurToken"
}
$notifsBefore = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersDemandeur
Write-Host "Nombre de notifications: $($notifsBefore.Count)" -ForegroundColor Cyan
foreach ($notif in $notifsBefore) {
    Write-Host "  - $($notif.titre): $($notif.message)" -ForegroundColor Gray
}
Write-Host ""

# 9. Responsable marque comme RESOLUE
Write-Host "9. Responsable marque la demande comme RESOLUE..." -ForegroundColor Yellow
$marquerResolue = @{
    marquerResolue = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/marquer-resolue" -Method Patch -Body $marquerResolue -Headers $headersResp
Write-Host "✓ Demande marquée comme RESOLUE" -ForegroundColor Green
Write-Host ""

# 10. Attendre un peu pour la notification
Start-Sleep -Seconds 2

# 11. Vérifier les notifications du demandeur APRÈS résolution
Write-Host "10. Notifications du demandeur APRÈS résolution..." -ForegroundColor Yellow
$notifsAfter = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersDemandeur
Write-Host "Nombre de notifications: $($notifsAfter.Count)" -ForegroundColor Cyan

$notifResolue = $notifsAfter | Where-Object { $_.titre -eq "Demande résolue" }
if ($notifResolue) {
    Write-Host "✅ SUCCÈS: Notification 'Demande résolue' trouvée!" -ForegroundColor Green
    Write-Host "   Message: $($notifResolue.message)" -ForegroundColor Green
} else {
    Write-Host "❌ ÉCHEC: Notification 'Demande résolue' NON trouvée!" -ForegroundColor Red
    Write-Host "Notifications reçues:" -ForegroundColor Yellow
    foreach ($notif in $notifsAfter) {
        Write-Host "  - $($notif.titre): $($notif.message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Test terminé" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
