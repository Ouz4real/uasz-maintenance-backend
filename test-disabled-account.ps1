# Script pour tester la connexion avec un compte désactivé

Write-Host "=== Test de connexion avec compte désactivé ===" -ForegroundColor Cyan
Write-Host ""

# Test avec le compte technicien par défaut (tech123)
Write-Host "1. Test avec le compte 'technicien' (qui devrait être activé)..." -ForegroundColor Yellow

try {
    $body = @{
        usernameOrEmail = "technicien"
        motDePasse = "tech123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json" -ErrorVariable err
    
    Write-Host "   ✅ Login réussi (normal, compte activé)" -ForegroundColor Green
    Write-Host "   Role: $($response.role)" -ForegroundColor White
} catch {
    Write-Host "   ❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Maintenant, allez dans le dashboard Admin et désactivez le compte 'technicien'" -ForegroundColor Yellow
Write-Host "3. Puis relancez ce script pour voir le message d'erreur" -ForegroundColor Yellow
Write-Host ""
Write-Host "Appuyez sur Entrée quand vous avez désactivé le compte..." -ForegroundColor Cyan
Read-Host

Write-Host "Test avec le compte désactivé..." -ForegroundColor Yellow

try {
    $body = @{
        usernameOrEmail = "technicien"
        motDePasse = "tech123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "   ❌ PROBLÈME: Le login a réussi alors que le compte devrait être désactivé!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    
    if ($statusCode -eq 403) {
        Write-Host "   ✅ SUCCÈS: Le compte est bien bloqué (HTTP 403)" -ForegroundColor Green
        
        # Essayer de lire le message d'erreur
        try {
            $result = $_.ErrorDetails.Message
            Write-Host "   Message: $result" -ForegroundColor Cyan
        } catch {
            Write-Host "   (Message d'erreur non disponible)" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ Erreur inattendue (HTTP $statusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Fin du test ===" -ForegroundColor Cyan
