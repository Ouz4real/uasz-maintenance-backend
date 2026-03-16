# Test de l'envoi d'email au demandeur lors de la création d'une demande

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST EMAIL DEMANDEUR - NOUVELLE DEMANDE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Login en tant que demandeur
Write-Host "1. Connexion en tant que demandeur..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"usernameOrEmail":"demandeur","motDePasse":"password123"}'

    $token = $loginResponse.token
    $demandeurId = $loginResponse.id
    Write-Host "   ✓ Connecté - Token obtenu" -ForegroundColor Green
    Write-Host "   Demandeur ID: $demandeurId" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "   ✗ Erreur de connexion: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   Vérifiez que le backend est démarré" -ForegroundColor Yellow
    exit
}

# 2. Créer une nouvelle demande
Write-Host "2. Création d'une nouvelle demande..." -ForegroundColor Yellow

# Créer un fichier temporaire vide pour l'image (optionnel)
$tempFile = [System.IO.Path]::GetTempFileName()
"" | Out-File -FilePath $tempFile -Encoding ASCII

# Préparer les données en multipart/form-data
$boundary = [System.Guid]::NewGuid().ToString()
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "multipart/form-data; boundary=$boundary"
}

# Construire le body multipart
$bodyLines = @(
    "--$boundary",
    "Content-Disposition: form-data; name=`"demandeurId`"",
    "",
    "$demandeurId",
    "--$boundary",
    "Content-Disposition: form-data; name=`"titre`"",
    "",
    "Test Email - Panne Ordinateur Bureau",
    "--$boundary",
    "Content-Disposition: form-data; name=`"description`"",
    "",
    "Test d'envoi d'email automatique lors de la création d'une demande",
    "--$boundary",
    "Content-Disposition: form-data; name=`"lieu`"",
    "",
    "Salle informatique B12",
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

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "   ✓ Demande créée avec succès!" -ForegroundColor Green
    Write-Host "   ID Demande: $($createResponse.id)" -ForegroundColor Gray
    Write-Host "   Titre: $($createResponse.titre)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "3. Vérification de l'envoi d'email..." -ForegroundColor Yellow
    Write-Host "   ⚠️  Vérifiez les logs du backend pour confirmer:" -ForegroundColor Cyan
    Write-Host "   - 'Email de confirmation envoyé au demandeur: [email]'" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "4. Vérifiez votre boîte email..." -ForegroundColor Yellow
    Write-Host "   📧 Un email devrait être envoyé à l'adresse du demandeur" -ForegroundColor Cyan
    Write-Host "   Sujet: 'Confirmation de votre demande de maintenance - UASZ'" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "   ✗ Erreur lors de la création: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "NOTES IMPORTANTES:" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "1. Configurez d'abord les paramètres SMTP dans application.properties:" -ForegroundColor White
Write-Host "   - spring.mail.username=votre-email@gmail.com" -ForegroundColor Gray
Write-Host "   - spring.mail.password=votre-mot-de-passe-application" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Pour Gmail, créez un mot de passe d'application:" -ForegroundColor White
Write-Host "   - Compte Google > Sécurité > Validation en 2 étapes" -ForegroundColor Gray
Write-Host "   - Mots de passe des applications" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Pour désactiver temporairement les emails:" -ForegroundColor White
Write-Host "   - Mettez app.email.enabled=false dans application.properties" -ForegroundColor Gray
Write-Host ""
