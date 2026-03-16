# Script de vérification de la configuration email

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VÉRIFICATION CONFIGURATION EMAIL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# 1. Vérifier que les fichiers existent
Write-Host "1. Vérification des fichiers..." -ForegroundColor Yellow

$files = @(
    "src/main/java/sn/uasz/uasz_maintenance_backend/services/EmailService.java",
    "src/main/java/sn/uasz/uasz_maintenance_backend/services/impl/EmailServiceImpl.java",
    "src/main/resources/application.properties",
    "pom.xml"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file - MANQUANT!" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# 2. Vérifier la dépendance dans pom.xml
Write-Host "2. Vérification de la dépendance Maven..." -ForegroundColor Yellow
$pomContent = Get-Content "pom.xml" -Raw
if ($pomContent -match "spring-boot-starter-mail") {
    Write-Host "   ✓ Dépendance spring-boot-starter-mail présente" -ForegroundColor Green
} else {
    Write-Host "   ✗ Dépendance spring-boot-starter-mail MANQUANTE!" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 3. Vérifier la configuration SMTP
Write-Host "3. Vérification de la configuration SMTP..." -ForegroundColor Yellow
$propsContent = Get-Content "src/main/resources/application.properties" -Raw

if ($propsContent -match "spring.mail.host") {
    Write-Host "   ✓ spring.mail.host configuré" -ForegroundColor Green
} else {
    Write-Host "   ✗ spring.mail.host MANQUANT!" -ForegroundColor Red
    $allGood = $false
}

if ($propsContent -match "spring.mail.username") {
    Write-Host "   ✓ spring.mail.username configuré" -ForegroundColor Green
    
    # Vérifier si c'est toujours la valeur par défaut
    if ($propsContent -match "votre-email@gmail.com") {
        Write-Host "   ⚠️  ATTENTION: Vous devez modifier spring.mail.username!" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "   ✗ spring.mail.username MANQUANT!" -ForegroundColor Red
    $allGood = $false
}

if ($propsContent -match "spring.mail.password") {
    Write-Host "   ✓ spring.mail.password configuré" -ForegroundColor Green
    
    # Vérifier si c'est toujours la valeur par défaut
    if ($propsContent -match "votre-mot-de-passe-application") {
        Write-Host "   ⚠️  ATTENTION: Vous devez modifier spring.mail.password!" -ForegroundColor Yellow
        $allGood = $false
    }
} else {
    Write-Host "   ✗ spring.mail.password MANQUANT!" -ForegroundColor Red
    $allGood = $false
}

if ($propsContent -match "app.email.enabled") {
    Write-Host "   ✓ app.email.enabled configuré" -ForegroundColor Green
    
    if ($propsContent -match "app.email.enabled=false") {
        Write-Host "   ⚠️  ATTENTION: Les emails sont désactivés (app.email.enabled=false)" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ app.email.enabled MANQUANT!" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# 4. Vérifier que le backend est démarré
Write-Host "4. Vérification du backend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"test","password":"test"}' -ErrorAction SilentlyContinue
    Write-Host "   ✓ Backend accessible sur http://localhost:8080" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 403) {
        Write-Host "   ✓ Backend accessible (erreur d'authentification normale)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Backend non accessible - Démarrez-le avec 'mvn spring-boot:run'" -ForegroundColor Red
        $allGood = $false
    }
}
Write-Host ""

# 5. Résumé
Write-Host "========================================" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✅ TOUT EST PRÊT!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "1. Vérifiez que spring.mail.username et spring.mail.password sont configurés" -ForegroundColor White
    Write-Host "2. Redémarrez le backend si vous avez modifié application.properties" -ForegroundColor White
    Write-Host "3. Lancez le test: ./test-email-demandeur.ps1" -ForegroundColor White
} else {
    Write-Host "❌ CONFIGURATION INCOMPLÈTE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Actions requises:" -ForegroundColor Yellow
    Write-Host "1. Corrigez les erreurs ci-dessus" -ForegroundColor White
    Write-Host "2. Consultez ETAPES_CONFIGURATION_EMAIL_DEMANDEUR.md" -ForegroundColor White
    Write-Host "3. Relancez ce script pour vérifier" -ForegroundColor White
}
Write-Host "========================================" -ForegroundColor Cyan
