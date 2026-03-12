# Script de test pour le système de refus d'intervention

Write-Host "🧪 Test du Système de Refus d'Intervention" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$baseUrl = "http://localhost:8080/api"
$technicienUsername = "technicien"
$technicienPassword = "password123"

Write-Host "📋 Étape 1: Connexion du technicien..." -ForegroundColor Yellow

# Connexion
$loginBody = @{
    username = $technicienUsername
    password = $technicienPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Connexion réussie! Token obtenu." -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur de connexion: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Étape 2: Récupération des interventions du technicien..." -ForegroundColor Yellow

# Headers avec token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $interventions = Invoke-RestMethod -Uri "$baseUrl/interventions/mes-interventions" -Method Get -Headers $headers
    Write-Host "✅ $($interventions.Count) intervention(s) trouvée(s)" -ForegroundColor Green
    
    if ($interventions.Count -eq 0) {
        Write-Host "⚠️  Aucune intervention à tester. Créez d'abord une intervention via le responsable." -ForegroundColor Yellow
        exit 0
    }
    
    # Afficher les interventions
    Write-Host ""
    Write-Host "Interventions disponibles:" -ForegroundColor Cyan
    for ($i = 0; $i -lt $interventions.Count; $i++) {
        $intervention = $interventions[$i]
        Write-Host "  [$i] ID: $($intervention.id) - $($intervention.titre) - Statut: $($intervention.statut)" -ForegroundColor White
    }
    
} catch {
    Write-Host "❌ Erreur lors de la récupération des interventions: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Étape 3: Sélection d'une intervention à refuser..." -ForegroundColor Yellow

# Trouver une intervention PLANIFIEE
$interventionARefuser = $interventions | Where-Object { $_.statut -eq "PLANIFIEE" } | Select-Object -First 1

if ($null -eq $interventionARefuser) {
    Write-Host "⚠️  Aucune intervention PLANIFIEE trouvée. Créez d'abord une intervention via le responsable." -ForegroundColor Yellow
    exit 0
}

Write-Host "✅ Intervention sélectionnée: ID $($interventionARefuser.id) - $($interventionARefuser.titre)" -ForegroundColor Green

Write-Host ""
Write-Host "📋 Étape 4: Refus de l'intervention..." -ForegroundColor Yellow

$raisonRefus = "Test automatique - Je ne peux pas prendre en charge cette intervention car je suis déjà occupé sur une autre tâche urgente."

$refusBody = @{
    raisonRefus = $raisonRefus
} | ConvertTo-Json

try {
    $refusResponse = Invoke-RestMethod -Uri "$baseUrl/interventions/$($interventionARefuser.id)/refuser" -Method Post -Body $refusBody -Headers $headers
    Write-Host "✅ Intervention refusée avec succès!" -ForegroundColor Green
    Write-Host "   Statut: $($refusResponse.statut)" -ForegroundColor White
    Write-Host "   Raison: $($refusResponse.raisonRefus)" -ForegroundColor White
    Write-Host "   Date refus: $($refusResponse.dateRefus)" -ForegroundColor White
} catch {
    Write-Host "❌ Erreur lors du refus: $_" -ForegroundColor Red
    Write-Host "   Détails: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📋 Étape 5: Vérification de l'intervention refusée..." -ForegroundColor Yellow

try {
    $interventionVerif = Invoke-RestMethod -Uri "$baseUrl/interventions/$($interventionARefuser.id)" -Method Get -Headers $headers
    
    if ($interventionVerif.statut -eq "REFUSEE") {
        Write-Host "✅ Statut vérifié: REFUSEE" -ForegroundColor Green
    } else {
        Write-Host "❌ Statut incorrect: $($interventionVerif.statut)" -ForegroundColor Red
    }
    
    if ($interventionVerif.raisonRefus -eq $raisonRefus) {
        Write-Host "✅ Raison du refus vérifiée" -ForegroundColor Green
    } else {
        Write-Host "❌ Raison du refus incorrecte" -ForegroundColor Red
    }
    
    if ($null -ne $interventionVerif.dateRefus) {
        Write-Host "✅ Date du refus enregistrée: $($interventionVerif.dateRefus)" -ForegroundColor Green
    } else {
        Write-Host "❌ Date du refus manquante" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erreur lors de la vérification: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Test terminé avec succès!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Connectez-vous en tant que responsable" -ForegroundColor White
Write-Host "  2. Vérifiez la notification de refus (cloche 🔔)" -ForegroundColor White
Write-Host "  3. Consultez le détail de l'intervention refusée" -ForegroundColor White
Write-Host "  4. (À implémenter) Réaffectez l'intervention à un autre technicien" -ForegroundColor White
Write-Host ""
