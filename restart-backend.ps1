# Script PowerShell pour redémarrer le backend automatiquement

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "REDEMARRAGE DU BACKEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Arrêter le processus sur le port 8080 s'il existe
Write-Host "1. Arrêt du processus existant..." -ForegroundColor Yellow
$process = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    if ($processInfo) {
        Write-Host "   Arrêt du processus: $($processInfo.ProcessName) (PID: $process)" -ForegroundColor Gray
        Stop-Process -Id $process -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "   ✅ Processus arrêté" -ForegroundColor Green
    }
} else {
    Write-Host "   ℹ️ Aucun processus à arrêter" -ForegroundColor Gray
}

Write-Host ""

# 2. Démarrer le backend
Write-Host "2. Démarrage du backend..." -ForegroundColor Yellow
Write-Host "   Commande: mvn spring-boot:run" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Lancer Maven
mvn spring-boot:run
