# Script pour debugger la reponse API et voir ce qui est retourne pour le demandeur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEBUG API - STRUCTURE DEMANDEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Tester l'API pour voir la structure des donnees
Write-Host "Test de l'API /api/pannes-responsable..." -ForegroundColor Yellow
Write-Host ""

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes-responsable" -Method Get -Headers @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
} -ErrorAction SilentlyContinue

if ($response) {
    Write-Host "Reponse recue! Analysons la structure..." -ForegroundColor Green
    Write-Host ""
    
    $firstPanne = $response[0]
    
    Write-Host "Structure de la premiere panne:" -ForegroundColor Yellow
    Write-Host "ID: $($firstPanne.id)" -ForegroundColor White
    Write-Host "Titre: $($firstPanne.titre)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Champ 'demandeur':" -ForegroundColor Yellow
    if ($firstPanne.demandeur) {
        Write-Host "  Type: Objet" -ForegroundColor Green
        Write-Host "  Contenu:" -ForegroundColor White
        $firstPanne.demandeur | ConvertTo-Json -Depth 3
    } else {
        Write-Host "  ABSENT ou NULL" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "Champ 'signaleePar':" -ForegroundColor Yellow
    if ($firstPanne.signaleePar) {
        Write-Host "  Valeur: $($firstPanne.signaleePar)" -ForegroundColor White
    } else {
        Write-Host "  ABSENT ou NULL" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "Champ 'demandeurNom':" -ForegroundColor Yellow
    if ($firstPanne.demandeurNom) {
        Write-Host "  Valeur: $($firstPanne.demandeurNom)" -ForegroundColor White
    } else {
        Write-Host "  ABSENT ou NULL" -ForegroundColor Red
    }
    Write-Host ""
    
    Write-Host "Structure complete de la premiere panne:" -ForegroundColor Yellow
    $firstPanne | ConvertTo-Json -Depth 5
    
} else {
    Write-Host "Impossible de contacter l'API" -ForegroundColor Red
    Write-Host "Veuillez verifier que le backend est demarre" -ForegroundColor Yellow
}
