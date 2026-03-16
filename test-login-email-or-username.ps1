# Script de test pour vérifier le login avec email ou username

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Login avec Email ou Username" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080/api/auth"

# Test 1: Login avec username
Write-Host "Test 1: Login avec username 'demandeur'..." -ForegroundColor Yellow
$loginUsername = @{
    usernameOrEmail = "demandeur"
    motDePasse = "dem123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginUsername -ContentType "application/json"
    Write-Host "✅ Login réussi avec username" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "Username: $($response.username)" -ForegroundColor Gray
    Write-Host "Email: $($response.email)" -ForegroundColor Gray
    Write-Host "Rôle: $($response.role)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)`n" -ForegroundColor Gray
}

# Test 2: Login avec email
Write-Host "Test 2: Login avec email 'demandeur@uasz.sn'..." -ForegroundColor Yellow
$loginEmail = @{
    usernameOrEmail = "demandeur@uasz.sn"
    motDePasse = "dem123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginEmail -ContentType "application/json"
    Write-Host "✅ Login réussi avec email" -ForegroundColor Green
    Write-Host "Token: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host "Username: $($response.username)" -ForegroundColor Gray
    Write-Host "Email: $($response.email)" -ForegroundColor Gray
    Write-Host "Rôle: $($response.role)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)`n" -ForegroundColor Gray
}

# Test 3: Login avec username incorrect
Write-Host "Test 3: Login avec username incorrect..." -ForegroundColor Yellow
$loginWrong = @{
    usernameOrEmail = "utilisateur_inexistant"
    motDePasse = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginWrong -ContentType "application/json"
    Write-Host "❌ ERREUR: Login réussi alors qu'il ne devrait pas!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.ErrorDetails.Message
    
    if ($statusCode -eq 401) {
        Write-Host "✅ Erreur 401 (Unauthorized) retournée comme attendu" -ForegroundColor Green
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Code d'erreur inattendu: $statusCode" -ForegroundColor Yellow
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    }
}

# Test 4: Login avec mot de passe incorrect
Write-Host "Test 4: Login avec mot de passe incorrect..." -ForegroundColor Yellow
$loginWrongPassword = @{
    usernameOrEmail = "demandeur"
    motDePasse = "mauvais_mot_de_passe"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginWrongPassword -ContentType "application/json"
    Write-Host "❌ ERREUR: Login réussi alors qu'il ne devrait pas!" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    $errorMessage = $_.ErrorDetails.Message
    
    if ($statusCode -eq 401) {
        Write-Host "✅ Erreur 401 (Unauthorized) retournée comme attendu" -ForegroundColor Green
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Code d'erreur inattendu: $statusCode" -ForegroundColor Yellow
        Write-Host "Message: $errorMessage`n" -ForegroundColor Gray
    }
}

# Test 5: Tester avec d'autres utilisateurs
Write-Host "Test 5: Login admin avec username..." -ForegroundColor Yellow
$loginAdmin = @{
    usernameOrEmail = "admin"
    motDePasse = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginAdmin -ContentType "application/json"
    Write-Host "✅ Login admin réussi" -ForegroundColor Green
    Write-Host "Rôle: $($response.role)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)`n" -ForegroundColor Gray
}

Write-Host "Test 6: Login responsable avec email..." -ForegroundColor Yellow
$loginResp = @{
    usernameOrEmail = "responsable@uasz.sn"
    motDePasse = "resp123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginResp -ContentType "application/json"
    Write-Host "✅ Login responsable réussi avec email" -ForegroundColor Green
    Write-Host "Rôle: $($response.role)`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Détails: $($_.ErrorDetails.Message)`n" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Tests terminés!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nRésumé:" -ForegroundColor Cyan
Write-Host "- Le login accepte maintenant l'email OU le nom d'utilisateur" -ForegroundColor White
Write-Host "- Le champ dans le frontend est libellé 'Email ou Nom d'utilisateur'" -ForegroundColor White
Write-Host "- Le backend utilise la méthode findByUsernameOrEmail()" -ForegroundColor White
