# Script pour redémarrer le backend proprement après modifications

Write-Host "=== REDÉMARRAGE DU BACKEND ===" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Arrêter les processus Java en cours
Write-Host "1. Arrêt des processus Java..." -ForegroundColor Yellow
$javaProcesses = Get-Process -Name "java" -ErrorAction SilentlyContinue
if ($javaProcesses) {
    $javaProcesses | Stop-Process -Force
    Start-Sleep -Seconds 2
    Write-Host "✓ Processus Java arrêtés" -ForegroundColor Green
} else {
    Write-Host "✓ Aucun processus Java en cours" -ForegroundColor Green
}

# Étape 2: Nettoyer le dossier target
Write-Host ""
Write-Host "2. Nettoyage du dossier target..." -ForegroundColor Yellow
if (Test-Path "target") {
    Remove-Item -Path "target" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Dossier target nettoyé" -ForegroundColor Green
} else {
    Write-Host "✓ Dossier target déjà propre" -ForegroundColor Green
}

# Étape 3: Compiler le projet
Write-Host ""
Write-Host "3. Compilation du projet..." -ForegroundColor Yellow
$compileResult = mvn clean compile -DskipTests 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Compilation réussie" -ForegroundColor Green
} else {
    Write-Host "✗ Erreur de compilation" -ForegroundColor Red
    Write-Host $compileResult
    exit 1
}

# Étape 4: Démarrer le backend
Write-Host ""
Write-Host "4. Démarrage du backend..." -ForegroundColor Yellow
Write-Host "Le backend démarre en arrière-plan..." -ForegroundColor White
Write-Host "Utilisez Ctrl+C pour arrêter" -ForegroundColor White
Write-Host ""

mvn spring-boot:run
