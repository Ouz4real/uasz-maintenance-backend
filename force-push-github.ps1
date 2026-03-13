# Script pour forcer le push vers GitHub
Write-Host "=== FORCE PUSH VERS GITHUB ===" -ForegroundColor Cyan

# 1. Supprimer le dossier .git corrompu
Write-Host "`n1. Suppression du dossier .git corrompu..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Remove-Item -Path ".git" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   Dossier .git supprimé" -ForegroundColor Green
}

# 2. Réinitialiser Git
Write-Host "`n2. Réinitialisation de Git..." -ForegroundColor Yellow
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
feat: Implémentation des fonctionnalités temps réel

- Notifications automatiques pour tous les utilisateurs (polling 10s)
- Mise à jour automatique des statuts de demandes (polling 15s)
- Fix réaffectation: nouveau technicien voit 'À faire' au lieu de 'Déclinée'
- Fix réaffectation: technicien déclinant garde sa demande dans 'Déclinées'
- Fix notification demandeur: reçoit notification uniquement quand RESOLUE
- Service DemandesPollingService pour Technicien, Responsable, Demandeur
- Amélioration UX: plus besoin de rafraîchir la page
"@

git commit -m $commitMessage
Write-Host "   Commit créé" -ForegroundColor Green

# 6. Force push vers main
Write-Host "`n6. Force push vers GitHub..." -ForegroundColor Yellow
Write-Host "   ATTENTION: Ceci va écraser le contenu distant!" -ForegroundColor Red
git push -u origin main --force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== PUSH RÉUSSI ===" -ForegroundColor Green
    Write-Host "Votre code est maintenant sur GitHub!" -ForegroundColor Green
} else {
    Write-Host "`n=== ERREUR LORS DU PUSH ===" -ForegroundColor Red
    Write-Host "Code d'erreur: $LASTEXITCODE" -ForegroundColor Red
}
