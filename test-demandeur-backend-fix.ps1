# Test de la correction backend pour l'affichage du nom du demandeur

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST CORRECTION BACKEND - DEMANDEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Verification des modifications..." -ForegroundColor Yellow
Write-Host ""

# Verifier PanneResponse.java
Write-Host "Verification de PanneResponse.java..." -ForegroundColor Yellow
$panneResponse = Get-Content "src/main/java/sn/uasz/uasz_maintenance_backend/dtos/PanneResponse.java" -Raw

if ($panneResponse -match "private Long demandeurId" -and $panneResponse -match "private DemandeurInfo demandeur") {
    Write-Host "  OK PanneResponse contient les champs demandeur" -ForegroundColor Green
} else {
    Write-Host "  ERREUR PanneResponse ne contient pas les champs demandeur" -ForegroundColor Red
}

if ($panneResponse -match "class DemandeurInfo") {
    Write-Host "  OK Classe interne DemandeurInfo existe" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Classe interne DemandeurInfo manquante" -ForegroundColor Red
}

Write-Host ""

# Verifier PanneService.java
Write-Host "Verification de PanneService.java..." -ForegroundColor Yellow
$panneService = Get-Content "src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java" -Raw

if ($panneService -match "Utilisateur demandeur = panne\.getDemandeur\(\)") {
    Write-Host "  OK PanneService recupere le demandeur" -ForegroundColor Green
} else {
    Write-Host "  ERREUR PanneService ne recupere pas le demandeur" -ForegroundColor Red
}

if ($panneService -match "\.demandeurId\(demandeur != null \? demandeur\.getId\(\) : null\)") {
    Write-Host "  OK PanneService mappe demandeurId" -ForegroundColor Green
} else {
    Write-Host "  ERREUR PanneService ne mappe pas demandeurId" -ForegroundColor Red
}

if ($panneService -match "\.demandeur\(demandeurInfo\)") {
    Write-Host "  OK PanneService mappe l'objet demandeur" -ForegroundColor Green
} else {
    Write-Host "  ERREUR PanneService ne mappe pas l'objet demandeur" -ForegroundColor Red
}

Write-Host ""

# Verifier Panne.java
Write-Host "Verification de Panne.java..." -ForegroundColor Yellow
$panneEntity = Get-Content "src/main/java/sn/uasz/uasz_maintenance_backend/entities/Panne.java" -Raw

if ($panneEntity -match "@JsonIgnoreProperties.*demandeur_id") {
    Write-Host "  OK Panne.demandeur a JsonIgnoreProperties" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Panne.demandeur n'a pas JsonIgnoreProperties" -ForegroundColor Red
}

Write-Host ""
Write-Host "2. Compilation du backend..." -ForegroundColor Yellow
Write-Host ""

# Compiler le backend
$compileResult = & mvn clean compile -DskipTests 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK Compilation reussie" -ForegroundColor Green
} else {
    Write-Host "  ERREUR Compilation echouee" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreurs de compilation:" -ForegroundColor Red
    $compileResult | Select-String -Pattern "ERROR" | ForEach-Object { Write-Host $_ -ForegroundColor Red }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Modifications apportees:" -ForegroundColor Green
Write-Host "  1. Ajout de demandeurId et demandeur dans PanneResponse" -ForegroundColor White
Write-Host "  2. Creation de la classe interne DemandeurInfo" -ForegroundColor White
Write-Host "  3. Mapping du demandeur dans toResponse()" -ForegroundColor White
Write-Host "  4. Ajout de JsonIgnoreProperties sur Panne.demandeur" -ForegroundColor White
Write-Host ""
Write-Host "Prochaines etapes:" -ForegroundColor Yellow
Write-Host "  1. Redemarrer le backend" -ForegroundColor White
Write-Host "  2. Tester l'API /api/pannes" -ForegroundColor White
Write-Host "  3. Verifier que l'objet demandeur est present dans la reponse" -ForegroundColor White
Write-Host ""
