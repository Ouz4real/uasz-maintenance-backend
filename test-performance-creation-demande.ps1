# Test de performance de création de demande

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST PERFORMANCE - CRÉATION DE DEMANDE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier la configuration
Write-Host "1. Vérification de la configuration email..." -ForegroundColor Yellow
$propsContent = Get-Content "src/main/resources/application.properties" -Raw

if ($propsContent -match "app.email.enabled=false") {
    Write-Host "   ✓ Emails désactivés (app.email.enabled=false)" -ForegroundColor Green
    Write-Host "   → Performance optimale attendue" -ForegroundColor Gray
} elseif ($propsContent -match "app.email.enabled=true") {
    Write-Host "   ⚠️  Emails activés (app.email.enabled=true)" -ForegroundColor Yellow
    
    if ($propsContent -match "votre-email@gmail.com" -or $propsContent -match "votre-mot-de-passe-application") {
        Write-Host "   ⚠️  ATTENTION: Identifiants SMTP non configurés!" -ForegroundColor Red
        Write-Host "   → Cela causera un délai de 5-10 secondes" -ForegroundColor Red
        Write-Host ""
        Write-Host "   Solution: Mettez app.email.enabled=false dans application.properties" -ForegroundColor Yellow
        Write-Host "   Puis redémarrez le backend" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "   ✓ Identifiants SMTP configurés" -ForegroundColor Green
    }
}
Write-Host ""

# 2. Login
Write-Host "2. Connexion en tant que demandeur..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"username":"demandeur","password":"password123"}'

    $token = $loginResponse.token
    $demandeurId = $loginResponse.id
    Write-Host "   ✓ Connecté" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ✗ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend est démarré" -ForegroundColor Yellow
    exit
}

# 3. Test de performance
Write-Host "3. Test de création de demande..." -ForegroundColor Yellow
Write-Host "   ⏱️  Mesure du temps de réponse..." -ForegroundColor Gray

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$demandeData = @{
    demandeurId = $demandeurId
    titre = "Test Performance - $(Get-Date -Format 'HH:mm:ss')"
    description = "Test de performance de création"
    lieu = "Salle test"
    typeEquipement = "Ordinateur"
    priorite = "MOYENNE"
} | ConvertTo-Json

$startTime = Get-Date

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes" `
        -Method POST `
        -Headers $headers `
        -Body $demandeData
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host ""
    Write-Host "   ✓ Demande créée avec succès!" -ForegroundColor Green
    Write-Host "   ID: $($createResponse.id)" -ForegroundColor Gray
    Write-Host ""
    
    # Analyse de la performance
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "RÉSULTAT DE PERFORMANCE" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   ⏱️  Temps de réponse: $([math]::Round($duration, 2)) secondes" -ForegroundColor White
    Write-Host ""
    
    if ($duration -lt 2) {
        Write-Host "   ✅ EXCELLENT - Performance optimale!" -ForegroundColor Green
        Write-Host "   La création est instantanée." -ForegroundColor Gray
    } elseif ($duration -lt 5) {
        Write-Host "   ⚠️  MOYEN - Légère latence détectée" -ForegroundColor Yellow
        Write-Host "   Vérifiez la configuration email." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ LENT - Problème de performance!" -ForegroundColor Red
        Write-Host "   Cause probable: Timeout SMTP" -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Solution:" -ForegroundColor Yellow
        Write-Host "   1. Mettez app.email.enabled=false dans application.properties" -ForegroundColor White
        Write-Host "   2. Redémarrez le backend" -ForegroundColor White
        Write-Host "   3. Relancez ce test" -ForegroundColor White
    }
    
} catch {
    Write-Host "   ✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
