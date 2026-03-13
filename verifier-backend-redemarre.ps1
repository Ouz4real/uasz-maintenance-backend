# Script simple pour verifier si le backend a ete redemarre avec la nouvelle version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION BACKEND REDEMARRE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test de connexion au backend..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes" -Method Get -ErrorAction Stop
    
    if ($response -and $response.Count -gt 0) {
        $firstPanne = $response[0]
        
        Write-Host "OK Backend accessible" -ForegroundColor Green
        Write-Host ""
        
        if ($firstPanne.demandeur) {
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "SUCCES! BACKEND REDEMARRE CORRECTEMENT" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "L'objet demandeur est present dans la reponse:" -ForegroundColor Green
            Write-Host "  Prenom: $($firstPanne.demandeur.prenom)" -ForegroundColor White
            Write-Host "  Nom: $($firstPanne.demandeur.nom)" -ForegroundColor White
            Write-Host ""
            
            if ($firstPanne.demandeur.prenom -and $firstPanne.demandeur.nom) {
                Write-Host "Le frontend devrait afficher:" -ForegroundColor Green
                Write-Host "  $($firstPanne.demandeur.prenom) $($firstPanne.demandeur.nom)" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "Si vous voyez toujours un tiret dans le frontend:" -ForegroundColor Yellow
                Write-Host "  1. Rafraichissez le navigateur (Ctrl+Shift+R)" -ForegroundColor White
                Write-Host "  2. Videz le cache du navigateur" -ForegroundColor White
                Write-Host "  3. Ouvrez les outils dev (F12) > Network > Disable cache" -ForegroundColor White
            } else {
                Write-Host "ATTENTION: prenom ou nom est vide dans la base" -ForegroundColor Red
                Write-Host "Verifiez la table utilisateurs" -ForegroundColor Yellow
            }
        } else {
            Write-Host "========================================" -ForegroundColor Red
            Write-Host "PROBLEME: BACKEND PAS REDEMARRE" -ForegroundColor Red
            Write-Host "========================================" -ForegroundColor Red
            Write-Host ""
            Write-Host "L'objet demandeur est ABSENT de la reponse" -ForegroundColor Red
            Write-Host "Le backend utilise encore l'ancienne version" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "SOLUTION:" -ForegroundColor Yellow
            Write-Host "  1. Arretez le backend (Ctrl+C dans son terminal)" -ForegroundColor White
            Write-Host "  2. Redemarrez avec: mvn spring-boot:run" -ForegroundColor White
            Write-Host "  3. Attendez 'Started UaszMaintenanceBackendApplication'" -ForegroundColor White
            Write-Host "  4. Relancez ce script pour verifier" -ForegroundColor White
        }
    } else {
        Write-Host "ERREUR: Aucune panne dans la base" -ForegroundColor Red
    }
    
} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "BACKEND NON ACCESSIBLE" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Le backend n'est pas demarre ou pas accessible" -ForegroundColor Red
    Write-Host ""
    Write-Host "SOLUTION:" -ForegroundColor Yellow
    Write-Host "  1. Ouvrez un terminal dans le dossier backend" -ForegroundColor White
    Write-Host "  2. Executez: mvn spring-boot:run" -ForegroundColor White
    Write-Host "  3. Attendez le message de demarrage" -ForegroundColor White
    Write-Host "  4. Relancez ce script" -ForegroundColor White
}

Write-Host ""
