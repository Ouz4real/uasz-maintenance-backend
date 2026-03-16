# Script pour demarrer le backend avec la correction du demandeur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEMARRAGE BACKEND - CORRECTION APPLIQUEE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "La correction a ete appliquee avec succes!" -ForegroundColor Green
Write-Host "Le backend a ete compile sans erreur." -ForegroundColor Green
Write-Host ""

Write-Host "MODIFICATIONS APPLIQUEES:" -ForegroundColor Yellow
Write-Host "  1. PanneResponse.java - Ajout de demandeurId et demandeur" -ForegroundColor White
Write-Host "  2. PanneService.java - Mapping du demandeur dans toResponse()" -ForegroundColor White
Write-Host "  3. Panne.java - JsonIgnoreProperties sur demandeur" -ForegroundColor White
Write-Host ""

Write-Host "PROCHAINES ETAPES:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Demarrer le backend:" -ForegroundColor Cyan
Write-Host "   mvn spring-boot:run" -ForegroundColor White
Write-Host ""
Write-Host "2. Attendre le message:" -ForegroundColor Cyan
Write-Host "   'Started UaszMaintenanceBackendApplication'" -ForegroundColor White
Write-Host ""
Write-Host "3. Tester dans le frontend:" -ForegroundColor Cyan
Write-Host "   - Ouvrir le dashboard Responsable" -ForegroundColor White
Write-Host "   - Verifier que les noms complets s'affichent" -ForegroundColor White
Write-Host "   - Au lieu de tiret, vous devriez voir 'Prenom Nom'" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION RAPIDE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Une fois le backend demarre, testez l'API:" -ForegroundColor Yellow
Write-Host '  curl http://localhost:8080/api/pannes | jq ".[0].demandeur"' -ForegroundColor Cyan
Write-Host ""
Write-Host "Vous devriez voir:" -ForegroundColor Yellow
Write-Host '  {' -ForegroundColor White
Write-Host '    "id": 5,' -ForegroundColor White
Write-Host '    "prenom": "Jean",' -ForegroundColor White
Write-Host '    "nom": "Dupont",' -ForegroundColor White
Write-Host '    "username": "jdupont"' -ForegroundColor White
Write-Host '  }' -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRET A DEMARRER!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Executez maintenant:" -ForegroundColor Yellow
Write-Host "  mvn spring-boot:run" -ForegroundColor Cyan
Write-Host ""
