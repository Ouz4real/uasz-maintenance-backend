# Script PowerShell pour tester complètement le système de notifications

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLET SYSTEME DE NOTIFICATIONS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$env:PGPASSWORD = "ouz4real"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "maintenance_db"
$dbUser = "postgres"
$apiUrl = "http://localhost:8080"

# Fonction pour exécuter une requête SQL
function Invoke-SQL {
    param([string]$Query)
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $Query
}

Write-Host "ETAPE 1: Vérification des administrateurs" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Invoke-SQL "SELECT id, username, nom, prenom, role, enabled FROM utilisateurs WHERE role = 'ADMINISTRATEUR';"
Write-Host ""

Write-Host "ETAPE 2: Comptage des notifications existantes" -ForegroundColor Yellow
Write-Host "===============================================" -ForegroundColor Yellow
Invoke-SQL "SELECT COUNT(*) as total_notifications FROM notifications;"
Write-Host ""

Write-Host "ETAPE 3: Création d'un nouvel utilisateur via API" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow

$timestamp = Get-Date -Format "HHmmss"
$newUser = @{
    username = "testuser_$timestamp"
    motDePasse = "Test123@"
    email = "testuser_$timestamp@uasz.sn"
    nom = "Test"
    prenom = "User"
    telephone = "771234567"
    departement = "Test Department"
    serviceUnite = "Test Service"
} | ConvertTo-Json

Write-Host "Données utilisateur:" -ForegroundColor Gray
Write-Host $newUser -ForegroundColor Gray
Write-Host ""

try {
    Write-Host "Envoi de la requête POST /api/auth/register..." -ForegroundColor Gray
    $response = Invoke-RestMethod -Uri "$apiUrl/api/auth/register" `
        -Method POST `
        -ContentType "application/json; charset=utf-8" `
        -Body $newUser
    
    Write-Host "✅ Utilisateur créé avec succès!" -ForegroundColor Green
    Write-Host "Réponse: $response" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur lors de la création de l'utilisateur:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host $_.ErrorDetails.Message -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "⚠️ Vérifiez que le backend est démarré sur le port 8080" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

Write-Host "ETAPE 4: Attente de 3 secondes pour la création des notifications..." -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "ETAPE 5: Vérification des nouvelles notifications" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Yellow
Invoke-SQL "SELECT n.id, n.titre, n.message, n.type, n.lu, n.entity_type, n.entity_id, n.date_creation, u.username as admin_username FROM notifications n LEFT JOIN utilisateurs u ON n.utilisateur_id = u.id WHERE n.entity_type = 'UTILISATEUR' ORDER BY n.date_creation DESC LIMIT 5;"
Write-Host ""

Write-Host "ETAPE 6: Comptage des notifications non lues par administrateur" -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
Invoke-SQL "SELECT u.id, u.username, COUNT(n.id) as nb_non_lues FROM utilisateurs u LEFT JOIN notifications n ON u.id = n.utilisateur_id AND n.lu = false WHERE u.role = 'ADMINISTRATEUR' GROUP BY u.id, u.username ORDER BY u.username;"
Write-Host ""

Write-Host "ETAPE 7: Test de l'endpoint /api/notifications/count" -ForegroundColor Yellow
Write-Host "=====================================================" -ForegroundColor Yellow

# Récupérer l'ID de l'admin pour tester
$adminIdQuery = "SELECT id FROM utilisateurs WHERE role = 'ADMINISTRATEUR' LIMIT 1;"
$adminIdResult = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $adminIdQuery
$adminId = $adminIdResult.Trim()

if ($adminId) {
    Write-Host "Test avec admin ID: $adminId" -ForegroundColor Gray
    
    # D'abord, se connecter pour obtenir un token
    Write-Host "Connexion en tant qu'admin..." -ForegroundColor Gray
    $loginData = @{
        usernameOrEmail = "admin"
        motDePasse = "admin123"
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $loginData
        
        $token = $loginResponse.token
        Write-Host "✅ Connexion réussie, token obtenu" -ForegroundColor Green
        
        # Tester l'endpoint de comptage
        Write-Host "Test de l'endpoint /api/notifications/count..." -ForegroundColor Gray
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        
        $countResponse = Invoke-RestMethod -Uri "$apiUrl/api/notifications/count" `
            -Method GET `
            -Headers $headers
        
        Write-Host "✅ Réponse de l'API:" -ForegroundColor Green
        Write-Host ($countResponse | ConvertTo-Json) -ForegroundColor Gray
        
        # Tester l'endpoint de liste des notifications
        Write-Host ""
        Write-Host "Test de l'endpoint /api/notifications..." -ForegroundColor Gray
        $notificationsResponse = Invoke-RestMethod -Uri "$apiUrl/api/notifications" `
            -Method GET `
            -Headers $headers
        
        Write-Host "✅ Nombre de notifications récupérées: $($notificationsResponse.Count)" -ForegroundColor Green
        if ($notificationsResponse.Count -gt 0) {
            Write-Host "Dernière notification:" -ForegroundColor Gray
            Write-Host ($notificationsResponse[0] | ConvertTo-Json) -ForegroundColor Gray
        }
        
    } catch {
        Write-Host "❌ Erreur lors du test de l'API:" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
    }
} else {
    Write-Host "❌ Aucun administrateur trouvé dans la base de données" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIN DU TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "RESUME:" -ForegroundColor Yellow
Write-Host "- Si vous voyez des notifications dans l'ETAPE 5, le backend fonctionne correctement" -ForegroundColor White
Write-Host "- Si l'ETAPE 7 montre un compteur > 0, l'API fonctionne correctement" -ForegroundColor White
Write-Host "- Si aucune notification n'apparaît, vérifiez les logs du backend" -ForegroundColor White
Write-Host ""
