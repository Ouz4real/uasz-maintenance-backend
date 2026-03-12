# Script PowerShell pour tester la création de notification lors de l'inscription

Write-Host "=== TEST CREATION NOTIFICATION INSCRIPTION ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier les administrateurs existants
Write-Host "1. Vérification des administrateurs..." -ForegroundColor Yellow
$env:PGPASSWORD = "ouz4real"
psql -h localhost -p 5432 -U postgres -d maintenance_db -c "SELECT id, username, nom, prenom, role FROM utilisateurs WHERE role = 'ADMINISTRATEUR';"
Write-Host ""

# 2. Créer un nouvel utilisateur via l'API
Write-Host "2. Création d'un nouvel utilisateur..." -ForegroundColor Yellow
$newUser = @{
    username = "test_notif_$(Get-Date -Format 'HHmmss')"
    motDePasse = "Test123@"
    email = "test_notif_$(Get-Date -Format 'HHmmss')@uasz.sn"
    nom = "TestNotif"
    prenom = "User"
    telephone = "771234567"
    departement = "Test"
    serviceUnite = "Test"
} | ConvertTo-Json

Write-Host "Données envoyées:" -ForegroundColor Gray
Write-Host $newUser -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body $newUser
    
    Write-Host "✅ Utilisateur créé avec succès" -ForegroundColor Green
    Write-Host "Réponse: $response" -ForegroundColor Gray
} catch {
    Write-Host "❌ Erreur lors deire la création:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.ErrorDetails.Message -ForegroundColor Red
}

Write-Host ""

# 3. Attendre un peu pour que la notification soit créée
Write-Host "3. Attente de 2 secondes..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# 4. Vérifier les notifications créées
Write-Host "4. Vérification des notifications créées..." -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d maintenance_db -c "SELECT n.id, n.titre, n.message, n.type, n.lu, n.entity_type, n.entity_id, u.username as admin_username FROM notifications n LEFT JOIN utilisateurs u ON n.utilisateur_id = u.id WHERE n.entity_type = 'UTILISATEUR' ORDER BY n.date_creation DESC LIMIT 5;"
Write-Host ""

# 5. Compter les notifications non lues par admin
Write-Host "5. Comptage des notifications non lues par admin..." -ForegroundColor Yellow
psql -h localhost -p 5432 -U postgres -d maintenance_db -c "SELECT u.username, COUNT(n.id) as nb_non_lues FROM utilisateurs u LEFT JOIN notifications n ON u.id = n.utilisateur_id AND n.lu = false WHERE u.role = 'ADMINISTRATEUR' GROUP BY u.username;"
Write-Host ""

Write-Host "=== FIN DU TEST ===" -ForegroundColor Cyan
