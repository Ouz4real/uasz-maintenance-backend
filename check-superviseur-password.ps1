# Script pour vérifier le mot de passe du superviseur
# Ce script teste différents mots de passe possibles

$baseUrl = "http://localhost:8080/api/auth"
$passwords = @("super123", "Passer123@", "superviseur123", "admin123")

Write-Host "🔍 Test des mots de passe possibles pour le superviseur..." -ForegroundColor Cyan
Write-Host ""

foreach ($password in $passwords) {
    Write-Host "Essai avec le mot de passe: $password" -ForegroundColor Yellow
    
    $body = @{
        usernameOrEmail = "superviseur"
        motDePasse = $password
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $body -ContentType "application/json"
        Write-Host "✅ SUCCÈS! Le mot de passe est: $password" -ForegroundColor Green
        Write-Host "Token: $($response.token.Substring(0, 20))..." -ForegroundColor Gray
        Write-Host "UserId: $($response.userId)" -ForegroundColor Gray
        Write-Host ""
        exit 0
    }
    catch {
        Write-Host "❌ Échec avec ce mot de passe" -ForegroundColor Red
        Write-Host ""
    }
}

Write-Host "⚠️ Aucun des mots de passe testés ne fonctionne." -ForegroundColor Red
Write-Host "Vous devrez peut-être réinitialiser le mot de passe dans la base de données." -ForegroundColor Yellow
