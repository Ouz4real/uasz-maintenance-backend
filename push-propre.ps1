# Script pour push propre vers GitHub
Write-Host "=== PUSH PROPRE VERS GITHUB ===" -ForegroundColor Cyan

# 1. Tuer tous les processus Git
Write-Host "`n1. Arrêt de tous les processus Git..." -ForegroundColor Yellow
Get-Process | Where-Object {$_.ProcessName -like "*git*"} | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   Processus Git arrêtés" -ForegroundColor Green

# 2. Supprimer complètement .git
Write-Host "`n2. Suppression complète du dossier .git..." -ForegroundColor Yellow
$gitPath = ".git"
if (Test-Path $gitPath) {
    # Retirer l'attribut readonly récursivement
    Get-ChildItem -Path $gitPath -Recurse -Force | ForEach-Object {
        $_.Attributes = 'Normal'
    }
    Remove-Item -Path $gitPath -Recurse -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}
Write-Host "   Dossier .git supprimé" -ForegroundColor Green

# 3. Initialiser Git
Write-Host "`n3. Initialisation de Git..." -ForegroundColor Yellow
git init
git config user.name "Ousmane Mané"
git config user.email "maneouz185@gmail.com"
Write-Host "   Git initialisé" -ForegroundColor Green

# 4. Ajouter le remote
Write-Host "`n4. Ajout du remote..." -ForegroundColor Yellow
git remote add origin https://github.com/Ouz4real/uasz-maintenance-backend.git
Write-Host "   Remote ajouté" -ForegroundColor Green

# 5. Créer .gitignore si nécessaire
Write-Host "`n5. Vérification .gitignore..." -ForegroundColor Yellow
if (-not (Test-Path ".gitignore")) {
    @"
target/
.idea/
*.iml
node_modules/
dist/
.angular/
*.log
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8
}
Write-Host "   .gitignore OK" -ForegroundColor Green

# 6. Ajouter les fichiers
Write-Host "`n6. Ajout des fichiers (cela peut prendre un moment)..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERREUR lors de l'ajout des fichiers" -ForegroundColor Red
    exit 1
}
Write-Host "   Fichiers ajoutés" -ForegroundColor Green

# 7. Créer le commit
Write-Host "`n7. Création du commit..." -ForegroundColor Yellow
git commit -m "feat: Fonctionnalités temps réel - notifications et statuts automatiques"
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERREUR lors du commit" -ForegroundColor Red
    exit 1
}
Write-Host "   Commit créé" -ForegroundColor Green

# 8. Créer la branche
Write-Host "`n8. Création de la branche feature/temps-reel..." -ForegroundColor Yellow
git branch -M feature/temps-reel
Write-Host "   Branche créée" -ForegroundColor Green

# 9. Push
Write-Host "`n9. Push vers GitHub..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre plusieurs minutes selon la taille du projet)" -ForegroundColor Cyan
git push -u origin feature/temps-reel

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║       PUSH RÉUSSI !                    ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host "`nVotre code est maintenant sur:" -ForegroundColor Cyan
    Write-Host "https://github.com/Ouz4real/uasz-maintenance-backend/tree/feature/temps-reel" -ForegroundColor White
} else {
    Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Red
    Write-Host "║       ERREUR LORS DU PUSH              ║" -ForegroundColor Red
    Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Red
}
