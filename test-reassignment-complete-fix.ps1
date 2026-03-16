# Script de test complet pour la réaffectation des demandes déclinées
# Ce script teste que:
# 1. Le technicien A peut décliner une demande
# 2. Le responsable peut réaffecter à technicien B
# 3. Le technicien A voit toujours sa demande déclinée
# 4. Le technicien B voit la demande comme nouvelle (sans infos de déclin)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST: Réaffectation demandes déclinées" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:8080/api"

# Étape 1: Appliquer la migration SQL
Write-Host "Étape 1: Application de la migration SQL..." -ForegroundColor Yellow
Write-Host "Veuillez exécuter le fichier: add-technicien-declinant-column.sql" -ForegroundColor White
Write-Host "dans votre base de données MySQL avant de continuer." -ForegroundColor White
Write-Host ""
$continue = Read-Host "Migration appliquée? (o/n)"
if ($continue -ne "o") {
    Write-Host "Test annulé. Veuillez appliquer la migration d'abord." -ForegroundColor Red
    exit
}

# Étape 2: Redémarrer le backend
Write-Host ""
Write-Host "Étape 2: Redémarrage du backend..." -ForegroundColor Yellow
Write-Host "Veuillez redémarrer le backend Spring Boot pour charger les modifications." -ForegroundColor White
Write-Host ""
$continue = Read-Host "Backend redémarré? (o/n)"
if ($continue -ne "o") {
    Write-Host "Test annulé. Veuillez redémarrer le backend d'abord." -ForegroundColor Red
    exit
}

# Étape 3: Login Responsable
Write-Host ""
Write-Host "Étape 3: Connexion en tant que Responsable..." -ForegroundColor Yellow
$loginResp = @{
    username = "responsable"
    password = "password123"
} | ConvertTo-Json

try {
    $respAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginResp -ContentType "application/json"
    $tokenResp = $respAuth.token
    Write-Host "✓ Connexion responsable réussie" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur connexion responsable: $_" -ForegroundColor Red
    exit
}

# Étape 4: Créer une nouvelle demande
Write-Host ""
Write-Host "Étape 4: Création d'une nouvelle demande..." -ForegroundColor Yellow
$nouvelleDemande = @{
    titre = "Test Réaffectation - $(Get-Date -Format 'HH:mm:ss')"
    description = "Demande de test pour vérifier la réaffectation après déclin"
    lieu = "Salle de test"
    typeEquipement = "Ordinateur"
    priorite = "MOYENNE"
    demandeurId = 1
} | ConvertTo-Json

try {
    $headers = @{ "Authorization" = "Bearer $tokenResp" }
    $demande = Invoke-RestMethod -Uri "$baseUrl/pannes" -Method Post -Body $nouvelleDemande -ContentType "application/json" -Headers $headers
    $demandeId = $demande.id
    Write-Host "✓ Demande créée avec ID: $demandeId" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur création demande: $_" -ForegroundColor Red
    exit
}

# Étape 5: Affecter à Technicien A (ID 3)
Write-Host ""
Write-Host "Étape 5: Affectation à Technicien A (ID 3)..." -ForegroundColor Yellow
$affectation = @{
    technicienId = 3
    prioriteResponsable = "HAUTE"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/traiter" -Method Post -Body $affectation -ContentType "application/json" -Headers $headers
    Write-Host "✓ Demande affectée au technicien A" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur affectation: $_" -ForegroundColor Red
    exit
}

# Étape 6: Login Technicien A
Write-Host ""
Write-Host "Étape 6: Connexion en tant que Technicien A..." -ForegroundColor Yellow
$loginTechA = @{
    username = "technicien"
    password = "password123"
} | ConvertTo-Json

try {
    $techAAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginTechA -ContentType "application/json"
    $tokenTechA = $techAAuth.token
    Write-Host "✓ Connexion technicien A réussie" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur connexion technicien A: $_" -ForegroundColor Red
    exit
}

# Étape 7: Technicien A décline la demande
Write-Host ""
Write-Host "Étape 7: Technicien A décline la demande..." -ForegroundColor Yellow
$declin = @{
    raisonRefus = "Je suis occupé sur une autre intervention urgente"
} | ConvertTo-Json

try {
    $headersTechA = @{ "Authorization" = "Bearer $tokenTechA" }
    $result = Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/refuser" -Method Post -Body $declin -ContentType "application/json" -Headers $headersTechA
    Write-Host "✓ Demande déclinée par technicien A" -ForegroundColor Green
    Write-Host "  - Raison: $($result.raisonRefus)" -ForegroundColor Gray
    Write-Host "  - Technicien déclinant ID: $($result.technicienDeclinantId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur déclin: $_" -ForegroundColor Red
    exit
}

# Étape 8: Vérifier que Technicien A voit sa demande déclinée
Write-Host ""
Write-Host "Étape 8: Vérification - Technicien A voit sa demande déclinée..." -ForegroundColor Yellow
try {
    $demandesTechA = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/3" -Method Get -Headers $headersTechA
    $maDemande = $demandesTechA | Where-Object { $_.id -eq $demandeId }
    
    if ($maDemande) {
        Write-Host "✓ Technicien A voit la demande déclinée" -ForegroundColor Green
        Write-Host "  - Statut: $($maDemande.statutInterventions)" -ForegroundColor Gray
        Write-Host "  - Raison refus: $($maDemande.raisonRefus)" -ForegroundColor Gray
        Write-Host "  - Technicien déclinant ID: $($maDemande.technicienDeclinantId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Technicien A ne voit PAS la demande déclinée!" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erreur récupération demandes technicien A: $_" -ForegroundColor Red
}

# Étape 9: Responsable réaffecte à Technicien B (ID 4)
Write-Host ""
Write-Host "Étape 9: Responsable réaffecte à Technicien B (ID 4)..." -ForegroundColor Yellow
$reaffectation = @{
    technicienId = 4
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/pannes/$demandeId/affecter" -Method Post -Body $reaffectation -ContentType "application/json" -Headers $headers
    Write-Host "✓ Demande réaffectée au technicien B" -ForegroundColor Green
    Write-Host "  - Nouveau technicien ID: $($result.technicienId)" -ForegroundColor Gray
    Write-Host "  - Statut interventions: $($result.statutInterventions)" -ForegroundColor Gray
    Write-Host "  - Raison refus (doit rester): $($result.raisonRefus)" -ForegroundColor Gray
    Write-Host "  - Technicien déclinant ID (doit rester): $($result.technicienDeclinantId)" -ForegroundColor Gray
} catch {
    Write-Host "✗ Erreur réaffectation: $_" -ForegroundColor Red
    exit
}

# Étape 10: Login Technicien B
Write-Host ""
Write-Host "Étape 10: Connexion en tant que Technicien B..." -ForegroundColor Yellow
$loginTechB = @{
    username = "technicien2"
    password = "password123"
} | ConvertTo-Json

try {
    $techBAuth = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginTechB -ContentType "application/json"
    $tokenTechB = $techBAuth.token
    Write-Host "✓ Connexion technicien B réussie" -ForegroundColor Green
} catch {
    Write-Host "✗ Erreur connexion technicien B: $_" -ForegroundColor Red
    exit
}

# Étape 11: Vérifier que Technicien B voit la demande comme nouvelle
Write-Host ""
Write-Host "Étape 11: Vérification - Technicien B voit la demande comme nouvelle..." -ForegroundColor Yellow
try {
    $headersTechB = @{ "Authorization" = "Bearer $tokenTechB" }
    $demandesTechB = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/4" -Method Get -Headers $headersTechB
    $maDemande = $demandesTechB | Where-Object { $_.id -eq $demandeId }
    
    if ($maDemande) {
        Write-Host "✓ Technicien B voit la demande" -ForegroundColor Green
        Write-Host "  - Statut: $($maDemande.statutInterventions)" -ForegroundColor Gray
        Write-Host "  - Technicien ID: $($maDemande.technicienId)" -ForegroundColor Gray
        Write-Host "  - Technicien déclinant ID: $($maDemande.technicienDeclinantId)" -ForegroundColor Gray
        
        # Vérifier que le statut est EN_COURS (pas DECLINEE)
        if ($maDemande.statutInterventions -eq "EN_COURS") {
            Write-Host "✓ Statut correct: EN_COURS (pas DECLINEE)" -ForegroundColor Green
        } else {
            Write-Host "✗ Statut incorrect: $($maDemande.statutInterventions) (devrait être EN_COURS)" -ForegroundColor Red
        }
        
        # Vérifier que technicienDeclinantId est différent de technicienId
        if ($maDemande.technicienDeclinantId -ne $maDemande.technicienId) {
            Write-Host "✓ Technicien déclinant différent du technicien actuel" -ForegroundColor Green
        } else {
            Write-Host "✗ Technicien déclinant identique au technicien actuel" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Technicien B ne voit PAS la demande!" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erreur récupération demandes technicien B: $_" -ForegroundColor Red
}

# Étape 12: Vérifier que Technicien A voit toujours sa demande déclinée
Write-Host ""
Write-Host "Étape 12: Vérification finale - Technicien A voit toujours sa demande..." -ForegroundColor Yellow
try {
    $demandesTechA = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/3" -Method Get -Headers $headersTechA
    $maDemande = $demandesTechA | Where-Object { $_.id -eq $demandeId }
    
    if ($maDemande) {
        Write-Host "✓ Technicien A voit toujours la demande déclinée" -ForegroundColor Green
        Write-Host "  - Statut: $($maDemande.statutInterventions)" -ForegroundColor Gray
        Write-Host "  - Raison refus: $($maDemande.raisonRefus)" -ForegroundColor Gray
        Write-Host "  - Technicien déclinant ID: $($maDemande.technicienDeclinantId)" -ForegroundColor Gray
    } else {
        Write-Host "✗ Technicien A ne voit PLUS la demande déclinée!" -ForegroundColor Red
    }
} catch {
    Write-Host "✗ Erreur récupération demandes technicien A: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST TERMINÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Résumé attendu:" -ForegroundColor Yellow
Write-Host "1. Technicien A voit la demande avec statut DECLINEE" -ForegroundColor White
Write-Host "2. Technicien B voit la demande avec statut EN_COURS" -ForegroundColor White
Write-Host "3. Les infos de déclin sont conservées dans la base" -ForegroundColor White
Write-Host "4. Le frontend affiche les infos de déclin seulement à A" -ForegroundColor White
