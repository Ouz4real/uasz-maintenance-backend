# Test de performance avec email asynchrone

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST PERFORMANCE - EMAIL ASYNCHRONE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  IMPORTANT: Redémarrez le backend avant ce test!" -ForegroundColor Yellow
Write-Host ""
$continue = Read-Host "Avez-vous redémarré le backend ? (o/n)"

if ($continue -ne "o" -and $continue -ne "O") {
    Write-Host ""
    Write-Host "Redémarrez d'abord le backend :" -ForegroundColor Yellow
    Write-Host "  1. Ctrl+C dans le terminal du backend" -ForegroundColor White
    Write-Host "  2. mvn spring-boot:run" -ForegroundColor White
    Write-Host ""
    exit
}

Write-Host ""
Write-Host "1. Connexion en tant que demandeur..." -ForegroundColor Yellow

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"usernameOrEmail":"demandeur","motDePasse":"dem123"}' `
        -ErrorAction Stop

    $token = $loginResponse.token
    $demandeurId = $loginResponse.userId
    Write-Host "   ✓ Connecté" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend est démarré" -ForegroundColor Yellow
    exit
}

Write-Host "2. Test de création de demande..." -ForegroundColor Yellow
Write-Host "   ⏱️  Mesure du temps de réponse..." -ForegroundColor Gray
Write-Host ""

# Créer un fichier temporaire vide pour l'image
$tempFile = [System.IO.Path]::GetTempFileName()
"" | Out-File -FilePath $tempFile -Encoding ASCII

$boundary = [System.Guid]::NewGuid().ToString()
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"demandeurId`"",
    "",
    "$demandeurId",
    "--$boundary",
    "Content-Disposition: form-data; name=`"titre`"",
    "",
    "Test Performance Async - $(Get-Date -Format 'HH:mm:ss')",
    "--$boundary",
    "Content-Disposition: form-data; name=`"description`"",
    "",
    "Test de performance avec email asynchrone",
    "--$boundary",
    "Content-Disposition: form-data; name=`"lieu`"",
    "",
    "Salle test",
    "--$boundary",
    "Content-Disposition: form-data; name=`"typeEquipement`"",
    "",
    "Ordinateur",
    "--$boundary",
    "Content-Disposition: form-data; name=`"priorite`"",
    "",
    "MOYENNE",
    "--$boundary--"
)

$body = $bodyLines -join "`r`n"

$startTime = Get-Date

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
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
        Write-Host "   ✅ EXCELLENT - Email asynchrone fonctionne!" -ForegroundColor Green
        Write-Host "   La création est instantanée." -ForegroundColor Gray
        Write-Host "   L'email sera envoyé en arrière-plan." -ForegroundColor Gray
    } elseif ($duration -lt 5) {
        Write-Host "   ⚠️  MOYEN - Légère amélioration" -ForegroundColor Yellow
        Write-Host "   Vérifiez que le backend a bien été redémarré." -ForegroundColor Gray
    } else {
        Write-Host "   ❌ LENT - Email toujours synchrone!" -ForegroundColor Red
        Write-Host "   Le backend n'a probablement pas été redémarré." -ForegroundColor Gray
        Write-Host ""
        Write-Host "   Solution:" -ForegroundColor Yellow
        Write-Host "   1. Arrêtez le backend (Ctrl+C)" -ForegroundColor White
        Write-Host "   2. Relancez : mvn spring-boot:run" -ForegroundColor White
        Write-Host "   3. Relancez ce test" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "VÉRIFICATION DE L'EMAIL" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "L'email devrait être envoyé en arrière-plan." -ForegroundColor White
    Write-Host ""
    Write-Host "Vérifiez :" -ForegroundColor Yellow
    Write-Host "  1. Les logs du backend pour :" -ForegroundColor White
    Write-Host "     'Email de confirmation envoyé au demandeur: [email]'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. Votre boîte email dans quelques secondes" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "   ✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Nettoyer
Remove-Item $tempFile -ErrorAction SilentlyContinue
