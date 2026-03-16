# Test: Notification de résolution pour TOUS les rôles qui créent une demande

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Notification Résolution - Tous Rôles" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:8080/api"

# Liste des utilisateurs à tester (différents rôles)
$utilisateurs = @(
    @{ username = "demandeur1"; password = "password"; role = "DEMANDEUR" },
    @{ username = "technicien1"; password = "password"; role = "TECHNICIEN" },
    @{ username = "responsable1"; password = "password"; role = "RESPONSABLE" },
    @{ username = "superviseur1"; password = "password"; role = "SUPERVISEUR" },
    @{ username = "admin"; password = "admin123"; role = "ADMIN" }
)

$resultats = @()

foreach ($user in $utilisateurs) {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "TEST POUR: $($user.role) ($($user.username))" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""
    
    try {
        # 1. Login utilisateur
        Write-Host "1. Login $($user.role)..." -ForegroundColor Cyan
        $loginBody = @{
            username = $user.username
            password = $user.password
        } | ConvertTo-Json
        
        $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
        $userToken = $loginResponse.token
        $userId = $loginResponse.id
        Write-Host "   ✓ Connecté (ID: $userId)" -ForegroundColor Green
        
        # 2. Créer une demande
        Write-Host "2. Création d'une demande..." -ForegroundColor Cyan
        $nouvelleDemande = @{
            titre = "Test Notif $($user.role)"
            description = "Test notification résolution pour $($user.role)"
            localisation = "Bureau Test"
            priorite = "MOYENNE"
            equipementId = 1
        } | ConvertTo-Json
        
        $headers = @{
            "Authorization" = "Bearer $userToken"
            "Content-Type" = "application/json"
        }
        
        $demande = Invoke-RestMethod -Uri "$baseUrl/pannes" -Method Post -Body $nouvelleDemande -Headers $headers
        $demandeId = $demande.id
        Write-Host "   ✓ Demande créée (ID: $demandeId)" -ForegroundColor Green
        
        # 3. Login Responsable (pour traiter la demande)
        Write-Host "3. Login Responsable pour traiter..." -ForegroundColor Cyan
        $loginResp = @{
            username = "responsable1"
            password = "password"
        } | ConvertTo-Json
        
        $respResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginResp -ContentType "application/json"
        $respToken = $respResponse.token
        Write-Host "   ✓ Responsable connecté" -ForegroundColor Green
        
        # 4. Affecter à un technicien
        Write-Host "4. Affectation au technicien..." -ForegroundColor Cyan
        $affectation = @{
            technicienId = 37
            prioriteResponsable = "MOYENNE"
        } | ConvertTo-Json
        
        $headersResp = @{
            "Authorization" = "Bearer $respToken"
            "Content-Type" = "application/json"
        }
        
        Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/traiter" -Method Post -Body $affectation -Headers $headersResp | Out-Null
        Write-Host "   ✓ Demande affectée" -ForegroundColor Green
        
        # 5. Login Technicien
        Write-Host "5. Technicien traite la demande..." -ForegroundColor Cyan
        $loginTech = @{
            username = "technicien1"
            password = "password"
        } | ConvertTo-Json
        
        $techResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginTech -ContentType "application/json"
        $techToken = $techResponse.token
        
        $headersTech = @{
            "Authorization" = "Bearer $techToken"
            "Content-Type" = "application/json"
        }
        
        # Démarrer
        Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/demarrer-intervention" -Method Patch -Headers $headersTech | Out-Null
        
        # Terminer
        $terminer = @{
            noteTechnicien = "Terminé"
            pieces = @()
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/terminer-intervention" -Method Patch -Body $terminer -Headers $headersTech | Out-Null
        Write-Host "   ✓ Intervention terminée" -ForegroundColor Green
        
        # 6. Compter notifications AVANT résolution
        Write-Host "6. Vérification notifications AVANT résolution..." -ForegroundColor Cyan
        $headersUser = @{
            "Authorization" = "Bearer $userToken"
        }
        $notifsBefore = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersUser
        $countBefore = $notifsBefore.Count
        Write-Host "   Notifications: $countBefore" -ForegroundColor Gray
        
        # 7. Responsable marque comme RESOLUE
        Write-Host "7. Responsable marque comme RESOLUE..." -ForegroundColor Cyan
        $marquerResolue = @{
            marquerResolue = $true
        } | ConvertTo-Json
        
        Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/marquer-resolue" -Method Patch -Body $marquerResolue -Headers $headersResp | Out-Null
        Write-Host "   ✓ Marquée RESOLUE" -ForegroundColor Green
        
        # 8. Attendre
        Start-Sleep -Seconds 2
        
        # 9. Vérifier notifications APRÈS résolution
        Write-Host "8. Vérification notifications APRÈS résolution..." -ForegroundColor Cyan
        $notifsAfter = Invoke-RestMethod -Uri "$baseUrl/notifications" -Method Get -Headers $headersUser
        $countAfter = $notifsAfter.Count
        
        $notifResolue = $notifsAfter | Where-Object { $_.titre -eq "Demande résolue" }
        
        if ($notifResolue) {
            Write-Host "   ✅ SUCCÈS: Notification reçue!" -ForegroundColor Green
            $resultats += @{
                role = $user.role
                username = $user.username
                success = $true
                message = "Notification reçue"
            }
        } else {
            Write-Host "   ❌ ÉCHEC: Notification NON reçue!" -ForegroundColor Red
            Write-Host "   Notifications ($countAfter):" -ForegroundColor Yellow
            foreach ($n in $notifsAfter) {
                Write-Host "     - $($n.titre)" -ForegroundColor Gray
            }
            $resultats += @{
                role = $user.role
                username = $user.username
                success = $false
                message = "Notification NON reçue"
            }
        }
        
    } catch {
        Write-Host "   ❌ ERREUR: $($_.Exception.Message)" -ForegroundColor Red
        $resultats += @{
            role = $user.role
            username = $user.username
            success = $false
            message = "Erreur: $($_.Exception.Message)"
        }
    }
    
    Write-Host ""
}

# Résumé final
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$success = 0
$failed = 0

foreach ($r in $resultats) {
    if ($r.success) {
        Write-Host "✅ $($r.role) ($($r.username)): $($r.message)" -ForegroundColor Green
        $success++
    } else {
        Write-Host "❌ $($r.role) ($($r.username)): $($r.message)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "Total: $($resultats.Count) | Succès: $success | Échecs: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
