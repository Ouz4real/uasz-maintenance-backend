# Vérification rapide: Un technicien crée une demande et reçoit la notification de résolution

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Vérification: Notification Résolution" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080/api"

# Test avec un TECHNICIEN qui crée sa propre demande
Write-Host "Scénario: Un technicien crée une demande pour lui-même" -ForegroundColor Yellow
Write-Host ""

# 1. Login Technicien
Write-Host "1. Login Technicien..." -ForegroundColor Cyan
$loginTech = @{
    username = "technicien2"
    password = "password"
} | ConvertTo-Json

$techResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginTech -ContentType "application/json"
$techToken = $techResponse.token
$techId = $techResponse.id
Write-Host "   ✓ Technicien connecté (ID: $techId)" -ForegroundColor Green

# 2. Créer une demande
Write-Host "2. Création d'une demande par le technicien..." -ForegroundColor Cyan
$nouvelleDemande = @{
    titre = "Vérif Notif Technicien"
    description = "Le technicien crée sa propre demande"
    localisation = "Bureau Technicien"
    priorite = "MOYENNE"
    equipementId = 1
} | ConvertTo-Json

$headersTech = @{
    "Authorization" = "Bearer $techToken"
    "Content-Type" = "application/json"
}

$demande = Invoke-RestMethod -Uri "$baseUrl/pannes" -Method Post -Body $nouvelleDemande -Headers $headersTech
$demandeId = $demande.id
Write-Host "   ✓ Demande créée (ID: $demandeId)" -ForegroundColor Green
Write-Host "   Demandeur ID: $($demande.demandeur.id)" -ForegroundColor Gray

# 3. Login Responsable
Write-Host "3. Login Responsable..." -ForegroundColor Cyan
$loginResp = @{
    username = "responsable1"
    password = "password"
} | ConvertTo-Json

$respResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginResp -ContentType "application/json"
$respToken = $respResponse.token
Write-Host "   ✓ Responsable connecté" -ForegroundColor Green

# 4. Affecter à un autre technicien
Write-Host "4. Affectation à un autre technicien..." -ForegroundColor Cyan
$affectation = @{
    technicienId = 37
    prioriteResponsable = "MOYENNE"
} | ConvertTo-Json

$headersResp = @{
    "Authorization" = "Bearer $respToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/traiter" -Method Post -Body $affectation -Headers $headersResp | Out-Null
Write-Host "   ✓ Demande affectée au technicien 37" -ForegroundColor Green

# 5. Login technicien affecté
Write-Host "5. Technicien affecté traite la demande..." -ForegroundColor Cyan
$loginTech1 = @{
    username = "technicien1"
    password = "password"
} | ConvertTo-Json

$tech1Response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginTech1 -ContentType "application/json"
$tech1Token = $tech1Response.token

$headersTech1 = @{
    "Authorization" = "Bearer $tech1Token"
    "Content-Type" = "application/json"
}

# Démarrer
Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/demarrer-intervention" -Method Patch -Headers $headersTech1 | Out-Null

# Terminer
$terminer = @{
    noteTechnicien = "Intervention terminée"
    pieces = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/terminer-intervention" -Method Patch -Body $terminer -Headers $headersTech1 | Out-Null
Write-Host "   ✓ Intervention terminée" -ForegroundColor Green

# 6. Vérifier notifications du technicien créateur AVANT résolution
Write-Host "6. Notifications du technicien créateur AVANT résolution..." -ForegroundColor Cyan
$notifsBefore = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersTech
Write-Host "   Nombre: $($notifsBefore.Count)" -ForegroundColor Gray

# 7. Responsable marque comme RESOLUE
Write-Host "7. Responsable marque comme RESOLUE..." -ForegroundColor Cyan
$marquerResolue = @{
    marquerResolue = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/marquer-resolue" -Method Patch -Body $marquerResolue -Headers $headersResp | Out-Null
Write-Host "   ✓ Demande marquée RESOLUE" -ForegroundColor Green

# 8. Attendre
Start-Sleep -Seconds 2

# 9. Vérifier notifications APRÈS résolution
Write-Host "8. Notifications du technicien créateur APRÈS résolution..." -ForegroundColor Cyan
$notifsAfter = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersTech
Write-Host "   Nombre: $($notifsAfter.Count)" -ForegroundColor Gray

$notifResolue = $notifsAfter | Where-Object { $_.titre -eq "Demande résolue" }

Write-Host ""
if ($notifResolue) {
    Write-Host "✅ SUCCÈS: Le technicien créateur a reçu la notification!" -ForegroundColor Green
    Write-Host "   Titre: $($notifResolue.titre)" -ForegroundColor Green
    Write-Host "   Message: $($notifResolue.message)" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ La fonctionnalité fonctionne pour TOUS les rôles!" -ForegroundColor Green
} else {
    Write-Host "❌ ÉCHEC: Notification NON reçue!" -ForegroundColor Red
    Write-Host "   Notifications reçues:" -ForegroundColor Yellow
    foreach ($n in $notifsAfter) {
        Write-Host "   - $($n.titre): $($n.message)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
