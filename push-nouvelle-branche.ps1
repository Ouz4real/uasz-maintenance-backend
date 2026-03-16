# Script pour push vers une nouvelle branche GitHub
Write-Host "=== PUSH VERS NOUVELLE BRANCHE ===" -ForegroundColor Cyan

# 1. Nettoyer le fichier de verrouillage
Write-Host "`n1. Nettoyage des fichiers de verrouillage..." -ForegroundColor Yellow
if (Test-Path ".git/index.lock") {
    Remove-Item -Path ".git/index.lock" -Force
    Write-Host "   Fichier de verrouillage supprimé" -ForegroundColor Green
}

# 2. Supprimer et réinitialiser Git
Write-Host "`n2. Réinitialisation complète de Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Remove-Item -Path ".git" -Recurse -Force
}
git init
git config user.name "Ousmane Mané"
git config user.email "maneouz185@gmail.com"
Write-Host "   Git réinitialisé" -ForegroundColor Green

# 3. Ajouter le remote
Write-Host "`n3. Ajout du remote GitHub..." -ForegroundColor Yellow
git remote add origin https://github.com/Ouz4real/uasz-maintenance-backend.git
Write-Host "   Remote ajouté" -ForegroundColor Green

# 4. Ajouter tous les fichiers
Write-Host "`n4. Ajout de tous les fichiers..." -ForegroundColor Yellow
git add .
Write-Host "   Fichiers ajoutés" -ForegroundColor Green

# 5. Créer le commit
Write-Host "`n5. Création du commit..." -ForegroundColor Yellow
$commitMessage = @"
feat: Fonctionnalités temps réel complètes

✨ Nouvelles fonctionnalités:
- Notifications automatiques pour tous les utilisateurs (polling 10s)
- Mise à jour automatique des statuts de demandes (polling 15s)
- Plus besoin de rafraîchir la page pour voir les changements

🐛 Corrections:
- Fix réaffectation: nouveau technicien voit 'À faire' au lieu de 'Déclinée'
- Fix réaffectation: technicien déclinant garde sa demande dans 'Déclinées'
- Fix notification: demandeur reçoit notification uniquement quand RESOLUE

🔧 Technique:
- Service DemandesPollingService pour Technicien, Responsable
- Intégration polling dans tous les dashboards
- Amélioration UX globale
"@

git commit -m $commitMessage
Write-Host "   Commit créé" -ForegroundColor Green

# 6. Créer et push vers nouvelle branche
Write-Host "`n6. Création de la branche 'feature/temps-reel'..." -ForegroundColor Yellow
git branch -M feature/temps-reel
Write-Host "   Branche créée" -ForegroundColor Green

Write-Host "`n7. Push vers GitHub..." -ForegroundColor Yellow
git push -u origin feature/temps-reel

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== PUSH RÉUSSI ===" -ForegroundColor Green
    Write-Host "Votre code est sur GitHub dans la branche 'feature/temps-reel'!" -ForegroundColor Green
    Write-Host "`nProchaines étapes:" -ForegroundColor Cyan
    Write-Host "1. Allez sur https://github.com/Ouz4real/uasz-maintenance-backend" -ForegroundColor White
    Write-Host "2. Créez une Pull Request pour merger dans main" -ForegroundColor White
    Write-Host "3. Ou fusionnez directement si vous êtes seul sur le projet" -ForegroundColor White
} else {
    Write-Host "`n=== ERREUR LORS DU PUSH ===" -ForegroundColor Red
    Write-Host "Code d'erreur: $LASTEXITCODE" -ForegroundColor Red
}
