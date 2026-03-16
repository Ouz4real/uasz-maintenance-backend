Write-Host "=== PUSH VERS GITHUB ===" -ForegroundColor Cyan
Write-Host ""

# 1. Tuer tous les processus Git
Write-Host "1. Arrêt des processus Git..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*git*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# 2. Supprimer .git
Write-Host "2. Suppression de .git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Remove-Item -Path ".git" -Recurse -Force -ErrorAction SilentlyContinue
}

# 3. Initialiser Git
Write-Host "3. Initialisation Git..." -ForegroundColor Yellow
git init
git config user.name "Ousmane Mané"
git config user.email "maneouz185@gmail.com"

# 4. Ajouter remote
Write-Host "4. Ajout du remote..." -ForegroundColor Yellow
git remote add origin https://github.com/Ouz4real/uasz-maintenance-backend.git

# 5. Créer .gitignore si nécessaire
if (-not (Test-Path ".gitignore")) {
    Write-Host "5. Création .gitignore..." -ForegroundColor Yellow
    @"
target/
node_modules/
.idea/
*.log
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}

# 6. Ajouter tous les fichiers
Write-Host "6. Ajout des fichiers..." -ForegroundColor Yellow
git add .

# 7. Commit
Write-Host "7. Commit..." -ForegroundColor Yellow
git commit -m "feat: pagination avec fenêtre glissante + temps réel"

# 8. Créer et push la branche
Write-Host "8. Push vers GitHub..." -ForegroundColor Yellow
git branch -M feature/temps-reel
git push -u origin feature/temps-reel --force

Write-Host ""
Write-Host "✓ Push terminé!" -ForegroundColor Green
