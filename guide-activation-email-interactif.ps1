# Guide interactif pour activer les emails

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "║           📧 GUIDE D'ACTIVATION DES EMAILS                    ║" -ForegroundColor Cyan
Write-Host "║                                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Les emails sont actuellement DÉSACTIVÉS." -ForegroundColor Yellow
Write-Host "C'est pour éviter la lenteur lors de la création de demandes." -ForegroundColor Gray
Write-Host ""

Write-Host "Pour recevoir les emails, vous devez :" -ForegroundColor White
Write-Host "1. Configurer un compte Gmail" -ForegroundColor Gray
Write-Host "2. Créer un mot de passe d'application" -ForegroundColor Gray
Write-Host "3. Modifier application.properties" -ForegroundColor Gray
Write-Host "4. Redémarrer le backend" -ForegroundColor Gray
Write-Host ""

$response = Read-Host "Voulez-vous activer les emails maintenant ? (o/n)"

if ($response -eq "o" -or $response -eq "O") {
    Write-Host ""
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "ÉTAPE 1 : Mot de passe d'application Gmail" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Ouvrez ce lien dans votre navigateur :" -ForegroundColor Yellow
    Write-Host "   https://myaccount.google.com/security" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Activez 'Validation en 2 étapes' si ce n'est pas fait" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "3. Cliquez sur 'Mots de passe des applications'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "4. Sélectionnez 'Autre' et tapez 'UASZ Maintenance'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "5. Cliquez sur 'Générer'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "6. Copiez le mot de passe (16 caractères)" -ForegroundColor Yellow
    Write-Host ""
    
    Read-Host "Appuyez sur Entrée quand vous avez copié le mot de passe"
    
    Write-Host ""
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "ÉTAPE 2 : Configuration" -ForegroundColor Cyan
    Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    $email = Read-Host "Entrez votre adresse Gmail"
    $password = Read-Host "Collez le mot de passe d'application (16 caractères)"
    
    Write-Host ""
    Write-Host "Configuration à appliquer :" -ForegroundColor Yellow
    Write-Host "  Email: $email" -ForegroundColor Gray
    Write-Host "  Mot de passe: $($password.Substring(0, 4))************" -ForegroundColor Gray
    Write-Host ""
    
    $confirm = Read-Host "Confirmer ? (o/n)"
    
    if ($confirm -eq "o" -or $confirm -eq "O") {
        Write-Host ""
        Write-Host "Modification de application.properties..." -ForegroundColor Yellow
        
        $propsPath = "src/main/resources/application.properties"
        $content = Get-Content $propsPath -Raw
        
        # Remplacer l'email
        $content = $content -replace "spring\.mail\.username=.*", "spring.mail.username=$email"
        
        # Remplacer le mot de passe
        $content = $content -replace "spring\.mail\.password=.*", "spring.mail.password=$password"
        
        # Activer les emails
        $content = $content -replace "app\.email\.enabled=false", "app.email.enabled=true"
        
        Set-Content $propsPath $content
        
        Write-Host "✓ Configuration mise à jour!" -ForegroundColor Green
        Write-Host ""
        
        Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "ÉTAPE 3 : Redémarrage" -ForegroundColor Cyan
        Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Vous devez maintenant redémarrer le backend :" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Dans le terminal du backend, faites Ctrl+C" -ForegroundColor White
        Write-Host "2. Puis relancez : mvn spring-boot:run" -ForegroundColor White
        Write-Host ""
        Write-Host "3. Après redémarrage, testez avec :" -ForegroundColor White
        Write-Host "   ./test-email-demandeur.ps1" -ForegroundColor Cyan
        Write-Host ""
        
        Write-Host "✅ Configuration terminée!" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "❌ Configuration annulée" -ForegroundColor Red
    }
    
} else {
    Write-Host ""
    Write-Host "Les emails restent désactivés." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pour les activer plus tard, consultez :" -ForegroundColor White
    Write-Host "  • ACTIVER_EMAILS_MAINTENANT.md" -ForegroundColor Cyan
    Write-Host "  • README_EMAIL_DEMANDEUR.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Ou relancez ce script : ./guide-activation-email-interactif.ps1" -ForegroundColor Cyan
    Write-Host ""
}

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
