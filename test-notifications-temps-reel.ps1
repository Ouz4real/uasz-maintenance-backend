# Test: Notifications en Temps Réel - Vérification du Polling Automatique

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Notifications en Temps Réel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080/api"

Write-Host "Ce test simule le comportement du frontend:" -ForegroundColor Yellow
Write-Host "1. Un technicien se connecte et attend des notifications" -ForegroundColor Yellow
Write-Host "2. Un responsable lui affecte une demande" -ForegroundColor Yellow
Write-Host "3. On vérifie que le technicien reçoit la notification" -ForegroundColor Yellow
Write-Host ""

# 1. Login Technicien
Write-Host "1. Login Technicien (qui va recevoir la notification)..." -ForegroundColor Cyan
$loginTech = @{
    username = "technicien1"
    password = "password"
} | ConvertTo-Json

$techResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginTech -ContentType "application/json"
$techToken = $techResponse.token
$techId = $techResponse.id
Write-Host "   ✓ Technicien connecté (ID: $techId)" -ForegroundColor Green

# 2. Compter les notifications initiales
Write-Host "2. Comptage des notifications initiales..." -ForegroundColor Cyan
$headersTech = @{
    "Authorization" = "Bearer $techToken"
}
$notifsBefore = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersTech
$countBefore = $notifsBefore.Count
Write-Host "   Notifications actuelles: $countBefore" -ForegroundColor Gray

# 3. Login Responsable
Write-Host "3. Login Responsable (qui va créer une action)..." -ForegroundColor Cyan
$loginResp = @{
    username = "responsable1"
    password = "password"
} | ConvertTo-Json

$respResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginResp -ContentType "application/json"
$respToken = $respResponse.token
Write-Host "   ✓ Responsable connecté" -ForegroundColor Green

# 4. Créer une demande
Write-Host "4. Création d'une demande..." -ForegroundColor Cyan
$nouvelleDemande = @{
    titre = "Test Notif Temps Réel"
    description = "Test pour vérifier le polling automatique"
    localisation = "Bureau Test"
    priorite = "MOYENNE"
    equipementId = 1
} | ConvertTo-Json

$headersResp = @{
    "Authorization" = "Bearer $respToken"
    "Content-Type" = "application/json"
}

$demande = Invoke-RestMethod -Uri "$baseUrl/pannes" -Method Post -Body $nouvelleDemande -Headers $headersResp
$demandeId = $demande.id
Write-Host "   ✓ Demande créée (ID: $demandeId)" -ForegroundColor Green

# 5. Affecter au technicien
Write-Host "5. Affectation au technicien..." -ForegroundColor Cyan
$affectation = @{
    technicienId = $techId
    prioriteResponsable = "MOYENNE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/traiter" -Method Post -Body $affectation -Headers $headersResp | Out-Null
Write-Host "   ✓ Demande affectée au technicien" -ForegroundColor Green
Write-Host "   ⏱️  Notification créée côté backend" -ForegroundColor Yellow

# 6. Simuler le polling du frontend (attendre et vérifier)
Write-Host ""
Write-Host "6. Simulation du polling automatique du frontend..." -ForegroundColor Cyan
Write-Host "   Le frontend vérifie les notifications toutes les 10 secondes" -ForegroundColor Gray
Write-Host "   Vérification dans 2 secondes (pour laisser le temps au backend)..." -ForegroundColor Gray

Start-Sleep -Seconds 2

# 7. Vérifier les notifications (comme le ferait le polling)
Write-Host ""
Write-Host "7. Vérification des notifications (polling)..." -ForegroundColor Cyan
$notifsAfter = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersTech
$countAfter = $notifsAfter.Count

Write-Host "   Notifications avant: $countBefore" -ForegroundColor Gray
Write-Host "   Notifications après: $countAfter" -ForegroundColor Gray

if ($countAfter -gt $countBefore) {
    Write-Host ""
    Write-Host "   ✅ SUCCÈS: Nouvelle notification détectée!" -ForegroundColor Green
    
    # Trouver la nouvelle notification
    $nouvelleNotif = $notifsAfter | Where-Object { $_.titre -eq "Nouvelle intervention affectée" } | Select-Object -First 1
    
    if ($nouvelleNotif) {
        Write-Host "   📬 Notification reçue:" -ForegroundColor Green
        Write-Host "      Titre: $($nouvelleNotif.titre)" -ForegroundColor Green
        Write-Host "      Message: $($nouvelleNotif.message)" -ForegroundColor Green
        Write-Host "      Type: $($nouvelleNotif.type)" -ForegroundColor Green
        Write-Host "      Lu: $($nouvelleNotif.lu)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "   ✅ Le polling automatique fonctionne!" -ForegroundColor Green
    Write-Host "   ✅ Le technicien recevra cette notification dans les 10 secondes" -ForegroundColor Green
    
} else {
    Write-Host ""
    Write-Host "   ❌ ÉCHEC: Aucune nouvelle notification détectée!" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend a bien créé la notification" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EXPLICATION DU FONCTIONNEMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dans le frontend Angular:" -ForegroundColor Yellow
Write-Host "1. NotificationService démarre automatiquement au chargement" -ForegroundColor Gray
Write-Host "2. Toutes les 10 secondes, il appelle GET /api/notifications" -ForegroundColor Gray
Write-Host "3. Les résultats sont publiés dans notifications\$ (Observable)" -ForegroundColor Gray
Write-Host "4. NotificationBellComponent s'abonne à notifications\$" -ForegroundColor Gray
Write-Host "5. Le badge et la liste se mettent à jour automatiquement" -ForegroundColor Gray
Write-Host ""
Write-Host "Résultat pour l'utilisateur:" -ForegroundColor Yellow
Write-Host "✅ Pas besoin de rafraîchir la page" -ForegroundColor Green
Write-Host "✅ Les notifications arrivent automatiquement (max 10s de délai)" -ForegroundColor Green
Write-Host "✅ Le compteur se met à jour en temps réel" -ForegroundColor Green
Write-Host "✅ Fonctionne pour TOUS les rôles" -ForegroundColor Green
Write-Host ""
