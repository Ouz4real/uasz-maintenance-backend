# Script de test pour vérifier l'unicité du nom d'utilisateur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Unicité du nom d'utilisateur" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080/api"

# Test 1: Créer un utilisateur avec un username unique
Write-Host "Test 1: Création d'un utilisateur avec username unique..." -ForegroundColor Yellow
$newUser = @{
    username = "testuser_$(Get-Date -Format 'HHmmss')"
    email = "testuser_$(Get-Date -Format 'HHmmss')@uasz.sn"
    nom = "Test"
    prenom = "User"
    motDePasse = "Test123@"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $newUser -ContentType "application/json"
    Write-Host "✅ Utilisateur créé avec succès" -ForegroundColor Green
    Write-Host "Réponse: $response`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)`n" -ForegroundColor Gray
}

# Test 2: Essayer de créer un utilisateur avec le même username
Write-Host "Test 2: Tentative de création avec le même username..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $newUser -ContentType "application/json"
    Write-Host "❌ ERREUR: L'utilisateur a été créé alors qu'il ne devrait pas!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.ErrorDetails.Message
    
    if ($statusCode -eq 409) {
        Write-Host "✅ Erreur 409 (Conflict) retournée comme attendu" -ForegroundColor Green
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Code d'erreur inattendu: $statusCode" -ForegroundColor Yellow
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    }
}

# Test 3: Essayer de créer un utilisateur avec un username existant (demandeur)
Write-Host "Test 3: Tentative avec username 'demandeur' (existant)..." -ForegroundColor Yellow
$existingUser = @{
    username = "demandeur"
    email = "nouveau@uasz.sn"
    nom = "Nouveau"
    prenom = "User"
    motDePasse = "Test123@"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $existingUser -ContentType "application/json"
    Write-Host "❌ ERREUR: L'utilisateur a été créé alors qu'il ne devrait pas!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.ErrorDetails.Message
    
    if ($statusCode -eq 409) {
        Write-Host "✅ Erreur 409 (Conflict) retournée comme attendu" -ForegroundColor Green
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Code d'erreur inattendu: $statusCode" -ForegroundColor Yellow
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    }
}

# Test 4: Essayer de créer un utilisateur avec un email existant
Write-Host "Test 4: Tentative avec email existant..." -ForegroundColor Yellow
$existingEmail = @{
    username = "nouveauuser"
    email = "demandeur@uasz.sn"
    nom = "Nouveau"
    prenom = "User"
    motDePasse = "Test123@"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $existingEmail -ContentType "application/json"
    Write-Host "❌ ERREUR: L'utilisateur a été créé alors qu'il ne devrait pas!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.ErrorDetails.Message
    
    if ($statusCode -eq 409) {
        Write-Host "✅ Erreur 409 (Conflict) retournée comme attendu" -ForegroundColor Green
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Code d'erreur inattendu: $statusCode" -ForegroundColor Yellow
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Tests terminés!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
