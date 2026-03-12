# Script PowerShell pour arrêter le processus qui utilise le port 8080

Write-Host "Recherche du processus utilisant le port 8080..." -ForegroundColor Yellow

# Trouver le processus qui utilise le port 8080
$process = Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1

if ($process) {
    Write-Host "Processus trouvé: PID $process" -ForegroundColor Cyan
    
    # Obtenir les détails du processus
    $processInfo = Get-Process -Id $process -ErrorAction SilentlyContinue
    
    if ($processInfo) {
        Write-Host "Nom du processus: $($processInfo.ProcessName)" -ForegroundColor Cyan
        Write-Host "Chemin: $($processInfo.Path)" -ForegroundColor Gray
        Write-Host ""
        
        # Demander confirmation
        $confirmation = Read-Host "Voulez-vous arrêter ce processus? (O/N)"
        
        if ($confirmation -eq 'O' -or $confirmation -eq 'o') {
            try {
                Stop-Process -Id $process -Force
                Write-Host "✅ Processus arrêté avec succès!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Vous pouvez maintenant redémarrer le backend:" -ForegroundColor Yellow
                Write-Host "mvn spring-boot:run" -ForegroundColor Cyan
            } catch {
                Write-Host "❌ Erreur lors de l'arrêt du processus: $_" -ForegroundColor Red
            }
        } else {
            Write-Host "Opération annulée." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Impossible d'obtenir les détails du processus" -ForegroundColor Red
    }
} else {
    Write-Host "✅ Aucun processus n'utilise le port 8080" -ForegroundColor Green
    Write-Host "Vous pouvez démarrer le backend:" -ForegroundColor Yellow
    Write-Host "mvn spring-boot:run" -ForegroundColor Cyan
}
