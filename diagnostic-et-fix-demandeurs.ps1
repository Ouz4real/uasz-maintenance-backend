# Script PowerShell pour diagnostiquer et corriger les demandeurs manquants

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC DEMANDEURS MANQUANTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PROBLEME IDENTIFIE:" -ForegroundColor Yellow
Write-Host "  - Un seul demandeur affiche son nom (le responsable)" -ForegroundColor White
Write-Host "  - Tous les autres affichent un tiret" -ForegroundColor White
Write-Host ""

Write-Host "CAUSES POSSIBLES:" -ForegroundColor Yellow
Write-Host "  1. Les pannes n'ont pas de demandeur_id dans la base" -ForegroundColor White
Write-Host "  2. Les utilisateurs n'ont pas de prenom/nom renseignes" -ForegroundColor White
Write-Host "  3. Le champ demandeur_id est NULL" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPE 1: DIAGNOSTIC BASE DE DONNEES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Executez ce script SQL pour diagnostiquer:" -ForegroundColor Yellow
Write-Host "  psql -U postgres -d uasz_maintenance -f diagnostic-base-donnees-demandeurs.sql" -ForegroundColor Cyan
Write-Host ""
Write-Host "OU avec MySQL:" -ForegroundColor Yellow
Write-Host "  mysql -u root -p uasz_maintenance < diagnostic-base-donnees-demandeurs.sql" -ForegroundColor Cyan
Write-Host ""

Write-Host "Ce script va afficher:" -ForegroundColor Yellow
Write-Host "  - Toutes les pannes avec leurs demandeurs" -ForegroundColor White
Write-Host "  - Le nombre de pannes SANS demandeur_id" -ForegroundColor White
Write-Host "  - Le nombre de pannes AVEC demandeur_id" -ForegroundColor White
Write-Host "  - Les utilisateurs sans prenom/nom" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPE 2: IDENTIFIER LE PROBLEME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Apres avoir execute le diagnostic, identifiez:" -ForegroundColor Yellow
Write-Host ""

Write-Host "CAS 1: Les pannes n'ont pas de demandeur_id" -ForegroundColor Yellow
Write-Host "  Symptome: demandeur_id est NULL dans la table pannes" -ForegroundColor White
Write-Host "  Solution: Lier les pannes aux utilisateurs via signalee_par" -ForegroundColor White
Write-Host ""

Write-Host "CAS 2: Les utilisateurs n'ont pas de prenom/nom" -ForegroundColor Yellow
Write-Host "  Symptome: prenom ou nom est NULL/vide dans la table utilisateurs" -ForegroundColor White
Write-Host "  Solution: Ajouter les prenoms et noms manquants" -ForegroundColor White
Write-Host ""

Write-Host "CAS 3: Les deux problemes combines" -ForegroundColor Yellow
Write-Host "  Solution: Corriger les deux" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "ETAPE 3: CORRECTION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Le fichier fix-demandeurs-manquants.sql contient:" -ForegroundColor Yellow
Write-Host "  - Des requetes pour lier pannes et utilisateurs" -ForegroundColor White
Write-Host "  - Des requetes pour ajouter prenom/nom aux utilisateurs" -ForegroundColor White
Write-Host ""

Write-Host "ATTENTION:" -ForegroundColor Red
Write-Host "  - Lisez et adaptez les requetes avant de les executer" -ForegroundColor White
Write-Host "  - Faites une sauvegarde de la base avant toute modification" -ForegroundColor White
Write-Host "  - Les requetes UPDATE sont commentees par securite" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SOLUTION RAPIDE (SI VOUS CONNAISSEZ SQL)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Connectez-vous a la base de donnees" -ForegroundColor Yellow
Write-Host ""

Write-Host "2. Verifiez les pannes sans demandeur:" -ForegroundColor Yellow
Write-Host "   SELECT id, titre, demandeur_id, signalee_par FROM pannes WHERE demandeur_id IS NULL;" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Si signalee_par contient des usernames, liez-les:" -ForegroundColor Yellow
Write-Host "   UPDATE pannes p" -ForegroundColor Cyan
Write-Host "   SET demandeur_id = (SELECT id FROM utilisateurs WHERE username = p.signalee_par)" -ForegroundColor Cyan
Write-Host "   WHERE demandeur_id IS NULL AND signalee_par IS NOT NULL;" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Verifiez les utilisateurs sans prenom/nom:" -ForegroundColor Yellow
Write-Host "   SELECT id, username, prenom, nom FROM utilisateurs WHERE prenom IS NULL OR nom IS NULL;" -ForegroundColor Cyan
Write-Host ""

Write-Host "5. Ajoutez les prenoms/noms manquants:" -ForegroundColor Yellow
Write-Host "   UPDATE utilisateurs SET prenom='Prenom', nom='Nom' WHERE id=X;" -ForegroundColor Cyan
Write-Host ""

Write-Host "6. Redemarrez le backend et testez" -ForegroundColor Yellow
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FICHIERS CREES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  - diagnostic-base-donnees-demandeurs.sql (diagnostic)" -ForegroundColor White
Write-Host "  - fix-demandeurs-manquants.sql (correction)" -ForegroundColor White
Write-Host ""
