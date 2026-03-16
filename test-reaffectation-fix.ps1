# Script pour tester la réaffectation d'une demande déclinée

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Réaffectation demande déclinée" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080/api"

# Vous devez avoir un token valide de responsable
Write-Host "⚠️  Assurez-vous d'avoir:" -ForegroundColor Yellow
Write-Host "  1. Une demande déclinée (ID de la demande)" -ForegroundColor White
Write-Host "  2. L'ID d'un nouveau technicien" -ForegroundColor White
Write-Host "  3. Un token de responsable valide`n" -ForegroundColor White

# Demander les informations
$panneId = Read-Host "ID de la demande déclinée"
$technicienId = Read-Host "ID du nouveau technicien"
$token = Read-Host "Token du responsable"

Write-Host "`n1. Vérification de l'état actuel de la demande..." -ForegroundColor Yellow

try {
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $panne = Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId" -Method Get -Headers $headers
    
    Write-Host "État actuel:" -ForegroundColor Cyan
    Write-Host "  - Titre: $($panne.titre)" -ForegroundColor White
    Write-Host "  - Statut: $($panne.statut)" -ForegroundColor White
    Write-Host "  - Statut Interventions: $($panne.statutInterventions)" -ForegroundColor White
    Write-Host "  - Raison refus: $($panne.raisonRefus)" -ForegroundColor White
    Write-Host "  - Date refus: $($panne.dateRefus)`n" -ForegroundColor White
    
} catch {
    Write-Host "❌ Erreur lors de la récupération: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host "2. Réaffectation au nouveau technicien..." -ForegroundColor Yellow

try {
    $affectation = @{
        technicienId = [int]$technicienId
    } | ConvertTo-Json
    
    $result = Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId/affecter-technicien" -Method Put -Body $affectation -Headers $headers
    
    Write-Host "✅ Réaffectation réussie!" -ForegroundColor Green
    Write-Host "`nNouvel état:" -ForegroundColor Cyan
    Write-Host "  - Titre: $($result.titre)" -ForegroundColor White
    Write-Host "  - Statut: $($result.statut)" -ForegroundColor White
    Write-Host "  - Statut Interventions: $($result.statutInterventions)" -ForegroundColor White
    Write-Host "  - Raison refus: $($result.raisonRefus)" -ForegroundColor White
    Write-Host "  - Date refus: $($result.dateRefus)" -ForegroundColor White
    Write-Host "  - Technicien: $($result.technicien.prenom) $($result.technicien.nom)`n" -ForegroundColor White
    
    # Vérification
    if ($result.statutInterventions -eq "EN_COURS" -and $null -eq $result.raisonRefus -and $null -eq $result.dateRefus) {
        Write-Host "✅ SUCCÈS: La demande a été correctement réinitialisée!" -ForegroundColor Green
        Write-Host "  - Statut: EN_COURS ✓" -ForegroundColor Green
        Write-Host "  - Raison refus: NULL ✓" -ForegroundColor Green
        Write-Host "  - Date refus: NULL ✓" -ForegroundColor Green
    } else {
        Write-Host "❌ PROBLÈME: La demande n'a pas été correctement réinitialisée" -ForegroundColor Red
        if ($result.statutInterventions -ne "EN_COURS") {
            Write-Host "  - Statut devrait être EN_COURS mais est: $($result.statutInterventions)" -ForegroundColor Red
        }
        if ($null -ne $result.raisonRefus) {
            Write-Host "  - Raison refus devrait être NULL mais est: $($result.raisonRefus)" -ForegroundColor Red
        }
        if ($null -ne $result.dateRefus) {
            Write-Host "  - Date refus devrait être NULL mais est: $($result.dateRefus)" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ Erreur lors de la réaffectation: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test terminé" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
