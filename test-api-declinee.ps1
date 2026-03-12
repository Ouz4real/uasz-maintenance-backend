# Script pour tester si l'API retourne bien le statut DECLINEE

Write-Host "`n=== TEST API: Vérification du statut après déclin ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Instructions:" -ForegroundColor Yellow
Write-Host "1. Ouvrez la console développeur de votre navigateur (F12)" -ForegroundColor White
Write-Host "2. Allez dans l'onglet 'Network' (Réseau)" -ForegroundColor White
Write-Host "3. Déclinez une intervention" -ForegroundColor White
Write-Host "4. Cherchez la requête POST vers '/api/pannes/{id}/refuser'" -ForegroundColor White
Write-Host "5. Regardez la réponse JSON" -ForegroundColor White
Write-Host ""

Write-Host "❓ Questions à vérifier:" -ForegroundColor Yellow
Write-Host ""
Write-Host "A. Dans la RÉPONSE de l'API après le déclin:" -ForegroundColor Green
Write-Host "   Quel est le 'statutInterventions' retourné ?" -ForegroundColor White
Write-Host "   - Si c'est 'ANNULEE' → Le backend n'a pas été redémarré" -ForegroundColor Gray
Write-Host "   - Si c'est 'DECLINEE' → Le backend est OK, problème dans le frontend" -ForegroundColor Gray
Write-Host ""

Write-Host "B. Après le rechargement de la liste:" -ForegroundColor Green
Write-Host "   Cherchez la requête GET vers '/api/pannes/technicien/{id}'" -ForegroundColor White
Write-Host "   Dans la liste des pannes, trouvez celle que vous avez déclinée" -ForegroundColor White
Write-Host "   Quel est son 'statutInterventions' ?" -ForegroundColor White
Write-Host ""

Write-Host "C. Dans la console du navigateur:" -ForegroundColor Green
Write-Host "   Y a-t-il des erreurs JavaScript ?" -ForegroundColor White
Write-Host ""

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC RAPIDE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

$choice = Read-Host "Avez-vous redémarré le backend après mes modifications ? (o/n)"

if ($choice -eq "n" -or $choice -eq "N") {
    Write-Host ""
    Write-Host "⚠️  VOUS DEVEZ REDÉMARRER LE BACKEND !" -ForegroundColor Red
    Write-Host ""
    Write-Host "Les modifications Java ne sont pas prises en compte tant que" -ForegroundColor Yellow
    Write-Host "le serveur Spring Boot n'est pas redémarré." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Commandes pour redémarrer:" -ForegroundColor Cyan
    Write-Host "  1. Arrêtez le backend (Ctrl+C dans le terminal)" -ForegroundColor White
    Write-Host "  2. Relancez avec: mvn spring-boot:run" -ForegroundColor White
    Write-Host ""
    Write-Host "Ou si vous utilisez IntelliJ/Eclipse:" -ForegroundColor Cyan
    Write-Host "  1. Arrêtez l'application" -ForegroundColor White
    Write-Host "  2. Cliquez sur 'Run' à nouveau" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✅ Backend redémarré" -ForegroundColor Green
    Write-Host ""
    Write-Host "Maintenant, vérifiez dans la console réseau:" -ForegroundColor Yellow
    Write-Host ""
    
    $statut = Read-Host "Quel statut l'API retourne-t-elle ? (ANNULEE/DECLINEE/autre)"
    
    if ($statut -eq "ANNULEE") {
        Write-Host ""
        Write-Host "❌ Le backend retourne toujours ANNULEE" -ForegroundColor Red
        Write-Host ""
        Write-Host "Cela signifie que les modifications n'ont pas été prises en compte." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Solutions possibles:" -ForegroundColor Cyan
        Write-Host "  1. Vérifiez que vous avez bien modifié le bon fichier" -ForegroundColor White
        Write-Host "  2. Recompilez le projet: mvn clean compile" -ForegroundColor White
        Write-Host "  3. Redémarrez complètement le backend" -ForegroundColor White
        Write-Host ""
    } elseif ($statut -eq "DECLINEE") {
        Write-Host ""
        Write-Host "✅ Le backend retourne DECLINEE" -ForegroundColor Green
        Write-Host ""
        Write-Host "Le problème est donc dans le FRONTEND." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Vérifications à faire:" -ForegroundColor Cyan
        Write-Host "  1. Ouvrez la console JavaScript (F12)" -ForegroundColor White
        Write-Host "  2. Cherchez des erreurs" -ForegroundColor White
        Write-Host "  3. Vérifiez que le frontend a bien été recompilé" -ForegroundColor White
        Write-Host "  4. Faites un hard refresh (Ctrl+Shift+R)" -ForegroundColor White
        Write-Host ""
        
        $frontendOk = Read-Host "Le frontend a-t-il été recompilé ? (o/n)"
        
        if ($frontendOk -eq "n" -or $frontendOk -eq "N") {
            Write-Host ""
            Write-Host "⚠️  Recompilez le frontend !" -ForegroundColor Red
            Write-Host ""
            Write-Host "Dans le dossier uasz-maintenance-frontend:" -ForegroundColor Cyan
            Write-Host "  npm run build" -ForegroundColor White
            Write-Host ""
            Write-Host "Ou si le serveur de dev tourne:" -ForegroundColor Cyan
            Write-Host "  Il devrait recompiler automatiquement" -ForegroundColor White
            Write-Host "  Faites un hard refresh (Ctrl+Shift+R)" -ForegroundColor White
            Write-Host ""
        }
    } else {
        Write-Host ""
        Write-Host "⚠️  Statut inattendu: $statut" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Vérifiez la réponse complète de l'API dans la console réseau." -ForegroundColor White
        Write-Host ""
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
