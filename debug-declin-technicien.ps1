# Script pour débugger le déclin d'une intervention

$baseUrl = "http://localhost:8080/api"

Write-Host "=== DEBUG DÉCLIN TECHNICIEN ===" -ForegroundColor Cyan
Write-Host ""

# Login Technicien
Write-Host "1. Login Technicien..." -ForegroundColor Yellow
$login = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"technicien","password":"technicien123"}'

$token = $login.token
$technicienId = $login.id
Write-Host "✓ Token obtenu (Technicien ID: $technicienId)" -ForegroundColor Green

# Récupérer les interventions
Write-Host ""
Write-Host "2. Récupération des interventions..." -ForegroundColor Yellow
$interventions = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/$technicienId/affectees" -Method Get `
    -Headers @{Authorization="Bearer $token"}

Write-Host "✓ $($interventions.Count) intervention(s) trouvée(s)" -ForegroundColor Green

# Afficher les détails de chaque intervention
foreach ($intervention in $interventions) {
    Write-Host ""
    Write-Host "Intervention #$($intervention.id): $($intervention.titre)" -ForegroundColor White
    Write-Host "  - Statut Interventions: $($intervention.statutInterventions)" -ForegroundColor White
    Write-Host "  - Statut Panne: $($intervention.statut)" -ForegroundColor White
    Write-Host "  - Technicien ID: $($intervention.technicien.id)" -ForegroundColor White
    Write-Host "  - Technicien Déclinant ID: $($intervention.technicienDeclinantId)" -ForegroundColor White
    Write-Host "  - Raison Refus: $($intervention.raisonRefus)" -ForegroundColor White
    Write-Host "  - Date Refus: $($intervention.dateRefus)" -ForegroundColor White
}

Write-Host ""
Write-Host "=== FIN DU DEBUG ===" -ForegroundColor Cyan
