# Script pour réinitialiser le mot de passe du superviseur à "super123"

$baseUrl = "http://localhost:8080/api/auth"

Write-Host "🔄 Réinitialisation du mot de passe du superviseur..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/reset-superviseur-password" -Method Post -ContentType "application/json"
    Write-Host "✅ $response" -ForegroundColor Green
    Write-Host ""
    Write-Host "Vous pouvez maintenant vous connecter avec:" -ForegroundColor Yellow
    Write-Host "  Username: superviseur" -ForegroundColor White
    Write-Host "  Password: super123" -ForegroundColor White
}
catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Assurez-vous que le backend est démarré sur le port 8080" -ForegroundColor Yellow
}
