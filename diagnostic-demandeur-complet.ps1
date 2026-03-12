# Diagnostic complet pour comprendre pourquoi le tiret s'affiche

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC COMPLET - AFFICHAGE DEMANDEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier que le backend est demarre
Write-Host "1. VERIFICATION BACKEND" -ForegroundColor Yellow
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -Method Get -ErrorAction Stop
    Write-Host "  OK Backend est demarre" -ForegroundColor Green
} catch {
    Write-Host "  ERREUR Backend n'est pas demarre ou pas accessible" -ForegroundColor Red
    Write-Host "  Veuillez demarrer le backend avec: mvn spring-boot:run" -ForegroundColor Yellow
    Write-Host ""
    exit
}

Write-Host ""

# 2. Tester l'API /api/pannes
Write-Host "2. TEST API /api/pannes" -ForegroundColor Yellow
Write-Host ""

try {
    # Essayer sans authentification d'abord
    $pannes = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes" -Method Get -ErrorAction Stop
    
    if ($pannes -and $pannes.Count -gt 0) {
        $firstPanne = $pannes[0]
        
        Write-Host "  Premiere panne trouvee:" -ForegroundColor Green
        Write-Host "  ID: $($firstPanne.id)" -ForegroundColor White
        Write-Host "  Titre: $($firstPanne.titre)" -ForegroundColor White
        Write-Host ""
        
        # Verifier si demandeur existe
        if ($firstPanne.demandeur) {
            Write-Host "  OBJET DEMANDEUR PRESENT:" -ForegroundColor Green
            Write-Host "    ID: $($firstPanne.demandeur.id)" -ForegroundColor White
            Write-Host "    Prenom: $($firstPanne.demandeur.prenom)" -ForegroundColor White
            Write-Host "    Nom: $($firstPanne.demandeur.nom)" -ForegroundColor White
            Write-Host "    Username: $($firstPanne.demandeur.username)" -ForegroundColor White
            Write-Host ""
            
            if ($firstPanne.demandeur.prenom -and $firstPanne.demandeur.nom) {
                Write-Host "  RESULTAT: Le backend retourne bien prenom et nom!" -ForegroundColor Green
                Write-Host "  Le frontend devrait afficher: $($firstPanne.demandeur.prenom) $($firstPanne.demandeur.nom)" -ForegroundColor Green
            } else {
                Write-Host "  PROBLEME: prenom ou nom est vide dans la base de donnees" -ForegroundColor Red
            }
        } else {
            Write-Host "  PROBLEME: Objet demandeur ABSENT dans la reponse" -ForegroundColor Red
            Write-Host "  Le backend n'a pas ete redemarre ou la modification n'a pas ete appliquee" -ForegroundColor Yellow
        }
        
        Write-Host ""
        Write-Host "  Structure complete de la premiere panne:" -ForegroundColor Yellow
        $firstPanne | ConvertTo-Json -Depth 3
        
    } else {
        Write-Host "  ERREUR: Aucune panne trouvee dans la base" -ForegroundColor Red
    }
    
} catch {
    Write-Host "  ERREUR: Impossible d'acceder a l'API" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  L'API necessite peut-etre une authentification" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DIAGNOSTIC FRONTEND" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 3. Verifier le code frontend
Write-Host "3. VERIFICATION CODE FRONTEND" -ForegroundColor Yellow
Write-Host ""

$tsContent = Get-Content "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts" -Raw

$mappingCount = ([regex]::Matches($tsContent, "demandeur\.prenom.*demandeur\.nom")).Count

if ($mappingCount -ge 4) {
    Write-Host "  OK Frontend mappe bien demandeur.prenom + demandeur.nom ($mappingCount endroits)" -ForegroundColor Green
} else {
    Write-Host "  PROBLEME: Frontend ne mappe pas correctement" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CONCLUSION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Si l'objet demandeur est ABSENT dans la reponse API:" -ForegroundColor Yellow
Write-Host "  1. Le backend n'a pas ete redemarre" -ForegroundColor White
Write-Host "  2. Arretez le backend (Ctrl+C)" -ForegroundColor White
Write-Host "  3. Redemarrez avec: mvn spring-boot:run" -ForegroundColor White
Write-Host "  4. Attendez le message 'Started UaszMaintenanceBackendApplication'" -ForegroundColor White
Write-Host "  5. Rafraichissez le frontend (Ctrl+Shift+R)" -ForegroundColor White
Write-Host ""

Write-Host "Si l'objet demandeur est PRESENT mais prenom/nom sont vides:" -ForegroundColor Yellow
Write-Host "  1. Le probleme vient de la base de donnees" -ForegroundColor White
Write-Host "  2. Les utilisateurs n'ont pas de prenom/nom renseignes" -ForegroundColor White
Write-Host "  3. Verifiez la table utilisateurs" -ForegroundColor White
Write-Host ""
