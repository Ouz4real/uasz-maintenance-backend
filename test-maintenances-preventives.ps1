# Test de chargement des maintenances préventives

Write-Host "=== TEST MAINTENANCES PREVENTIVES ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier le backend
Write-Host "1. Test Backend API..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/maintenances-preventives" -Method Get
    Write-Host "✓ Backend OK - $($response.Count) maintenances trouvées" -ForegroundColor Green
    Write-Host ""
    Write-Host "Détails des maintenances:" -ForegroundColor Cyan
    $response | ForEach-Object {
        Write-Host "  - ID: $($_.id) | Equipement: $($_.equipementReference) | Statut: $($_.statut) | Prochaine date: $($_.prochaineDate)" -ForegroundColor White
    }
} catch {
    Write-Host "✗ Erreur Backend: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Vérifications à faire dans le navigateur:" -ForegroundColor Yellow
Write-Host "   - Ouvrir la console (F12)" -ForegroundColor White
Write-Host "   - Aller dans l'onglet Network" -ForegroundColor White
Write-Host "   - Recharger la page du dashboard responsable" -ForegroundColor White
Write-Host "   - Chercher la requête 'maintenances-preventives'" -ForegroundColor White
Write-Host "   - Vérifier le statut (doit être 200)" -ForegroundColor White
Write-Host "   - Vérifier la réponse (doit contenir les données)" -ForegroundColor White
Write-Host ""
Write-Host "3. Vérifier dans la console:" -ForegroundColor Yellow
Write-Host "   - Chercher des erreurs en rouge" -ForegroundColor White
Write-Host "   - Chercher 'Erreur chargement maintenances préventives'" -ForegroundColor White
Write-Host ""
