# Script pour redemarrer le backend et tester l'affichage du demandeur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "REDEMARRAGE BACKEND + TEST DEMANDEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "ETAPE 1: Arreter le backend en cours..." -ForegroundColor Yellow
Write-Host "Veuillez arreter manuellement le backend (Ctrl+C dans le terminal)" -ForegroundColor Yellow
Write-Host "Appuyez sur Entree une fois le backend arrete..." -ForegroundColor Yellow
$null = Read-Host

Write-Host ""
Write-Host "ETAPE 2: Compiler le backend..." -ForegroundColor Yellow
Write-Host ""

# Essayer de compiler sans clean d'abord
$compileResult = & mvn compile -DskipTests 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Compilation reussie" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Compilation echouee" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreurs:" -ForegroundColor Red
    $compileResult | Select-String -Pattern "ERROR" | ForEach-Object { Write-Host $_ -ForegroundColor Red }
    Write-Host ""
    Write-Host "Appuyez sur Entree pour continuer quand meme..." -ForegroundColor Yellow
    $null = Read-Host
}

Write-Host ""
Write-Host "ETAPE 3: Demarrer le backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Veuillez demarrer le backend manuellement avec:" -ForegroundColor Yellow
Write-Host "  mvn spring-boot:run" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur Entree une fois le backend demarre..." -ForegroundColor Yellow
$null = Read-Host

Write-Host ""
Write-Host "ETAPE 4: Tester l'API..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Pour tester, vous pouvez:" -ForegroundColor Yellow
Write-Host "  1. Ouvrir le frontend et verifier l'affichage" -ForegroundColor White
Write-Host "  2. Ou tester l'API directement avec curl/Postman" -ForegroundColor White
Write-Host ""
Write-Host "Exemple de test API:" -ForegroundColor Yellow
Write-Host '  curl http://localhost:8080/api/pannes' -ForegroundColor Cyan
Write-Host ""
Write-Host "Verifiez que la reponse contient:" -ForegroundColor Yellow
Write-Host '  "demandeur": {' -ForegroundColor Cyan
Write-Host '    "id": 1,' -ForegroundColor Cyan
Write-Host '    "prenom": "Jean",' -ForegroundColor Cyan
Write-Host '    "nom": "Dupont",' -ForegroundColor Cyan
Write-Host '    "username": "jdupont"' -ForegroundColor Cyan
Write-Host '  }' -ForegroundColor Cyan
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME DES MODIFICATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend (Java):" -ForegroundColor Green
Write-Host "  1. PanneResponse.java - Ajout de demandeurId et demandeur" -ForegroundColor White
Write-Host "  2. PanneResponse.DemandeurInfo - Nouvelle classe interne" -ForegroundColor White
Write-Host "  3. PanneService.toResponse() - Mapping du demandeur" -ForegroundColor White
Write-Host "  4. Panne.java - JsonIgnoreProperties sur demandeur" -ForegroundColor White
Write-Host ""
Write-Host "Frontend (TypeScript):" -ForegroundColor Green
Write-Host "  Deja configure pour afficher demandeur.prenom + demandeur.nom" -ForegroundColor White
Write-Host "  Aucune modification necessaire" -ForegroundColor White
Write-Host ""
