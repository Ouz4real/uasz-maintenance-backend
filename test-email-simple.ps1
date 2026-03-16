# Test simple pour vérifier l'état des emails

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST EMAIL - VÉRIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier la configuration
Write-Host "1. Vérification de la configuration..." -ForegroundColor Yellow
$propsContent = Get-Content "src/main/resources/application.properties" -Raw

$emailEnabled = $false
$emailConfigured = $false

if ($propsContent -match "app\.email\.enabled=true") {
    $emailEnabled = $true
    Write-Host "   ✓ Emails activés (app.email.enabled=true)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Emails désactivés (app.email.enabled=false)" -ForegroundColor Yellow
}

if ($propsContent -notmatch "votre-email@gmail.com" -and $propsContent -notmatch "votre-mot-de-passe-application") {
    $emailConfigured = $true
    Write-Host "   ✓ Identifiants SMTP configurés" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Identifiants SMTP non configurés" -ForegroundColor Yellow
}
Write-Host ""

# 2. Test de connexion au backend
Write-Host "2. Test de connexion au backend..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"usernameOrEmail":"demandeur","motDePasse":"password123"}' `
        -ErrorAction Stop

    Write-Host "   ✓ Backend accessible" -ForegroundColor Green
    Write-Host "   ✓ Login réussi" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ✗ Erreur: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend est démarré" -ForegroundColor Yellow
    Write-Host ""
    exit
}

# 3. Résumé et instructions
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($emailEnabled -and $emailConfigured) {
    Write-Host "✅ EMAILS ACTIVÉS ET CONFIGURÉS" -ForegroundColor Green
    Write-Host ""
    Write-Host "Pour tester l'envoi d'email :" -ForegroundColor Yellow
    Write-Host "1. Créez une demande via l'interface web" -ForegroundColor White
    Write-Host "2. Vérifiez les logs du backend pour :" -ForegroundColor White
    Write-Host "   'Email de confirmation envoyé au demandeur: [email]'" -ForegroundColor Gray
    Write-Host "3. Vérifiez votre boîte email (et les spams)" -ForegroundColor White
    Write-Host ""
    
} elseif ($emailEnabled -and -not $emailConfigured) {
    Write-Host "⚠️  EMAILS ACTIVÉS MAIS NON CONFIGURÉS" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Problème : Les identifiants SMTP ne sont pas configurés" -ForegroundColor Red
    Write-Host "Cela causera une lenteur de 10 secondes lors de la création de demandes" -ForegroundColor Red
    Write-Host ""
    Write-Host "Solutions :" -ForegroundColor Yellow
    Write-Host "Option 1 : Configurer les emails" -ForegroundColor White
    Write-Host "  ./guide-activation-email-interactif.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 2 : Désactiver temporairement" -ForegroundColor White
    Write-Host "  Mettez app.email.enabled=false dans application.properties" -ForegroundColor Gray
    Write-Host "  Puis redémarrez le backend" -ForegroundColor Gray
    Write-Host ""
    
} else {
    Write-Host "ℹ️  EMAILS DÉSACTIVÉS" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Les emails ne seront pas envoyés lors de la création de demandes." -ForegroundColor White
    Write-Host "C'est normal si vous n'avez pas encore configuré les identifiants SMTP." -ForegroundColor Gray
    Write-Host ""
    Write-Host "Pour activer les emails :" -ForegroundColor Yellow
    Write-Host "  ./guide-activation-email-interactif.ps1" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou consultez :" -ForegroundColor Yellow
    Write-Host "  ACTIVER_EMAILS_MAINTENANT.md" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
