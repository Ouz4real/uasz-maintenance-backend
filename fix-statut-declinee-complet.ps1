# Script complet pour corriger le statut DECLINEE

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FIX COMPLET: Statut DECLINEE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Étapes à suivre:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣  ARRÊTER LE BACKEND" -ForegroundColor Green
Write-Host "   - Allez dans le terminal où tourne Spring Boot" -ForegroundColor White
Write-Host "   - Appuyez sur Ctrl+C pour arrêter" -ForegroundColor White
Write-Host ""

$step1 = Read-Host "Backend arrêté ? (o/n)"

if ($step1 -eq "o" -or $step1 -eq "O") {
    Write-Host ""
    Write-Host "2️⃣  METTRE À JOUR LA BASE DE DONNÉES" -ForegroundColor Green
    Write-Host "   - Ouvrez votre client MySQL/MariaDB" -ForegroundColor White
    Write-Host "   - Connectez-vous à la base 'uasz_maintenance'" -ForegroundColor White
    Write-Host "   - Exécutez cette commande SQL:" -ForegroundColor White
    Write-Host ""
    Write-Host "   ALTER TABLE panne" -ForegroundColor Cyan
    Write-Host "   MODIFY COLUMN statut_interventions VARCHAR(20);" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   Cette commande change le type de ENUM à VARCHAR" -ForegroundColor Gray
    Write-Host "   pour accepter n'importe quelle valeur d'enum." -ForegroundColor Gray
    Write-Host ""
    
    $step2 = Read-Host "SQL exécuté ? (o/n)"
    
    if ($step2 -eq "o" -or $step2 -eq "O") {
        Write-Host ""
        Write-Host "3️⃣  RECOMPILER LE BACKEND" -ForegroundColor Green
        Write-Host "   - Dans le terminal, exécutez:" -ForegroundColor White
        Write-Host ""
        Write-Host "   mvn clean compile" -ForegroundColor Cyan
        Write-Host ""
        
        $step3 = Read-Host "Compilation terminée ? (o/n)"
        
        if ($step3 -eq "o" -or $step3 -eq "O") {
            Write-Host ""
            Write-Host "4️⃣  REDÉMARRER LE BACKEND" -ForegroundColor Green
            Write-Host "   - Exécutez:" -ForegroundColor White
            Write-Host ""
            Write-Host "   mvn spring-boot:run" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "   Attendez que le serveur démarre complètement" -ForegroundColor Gray
            Write-Host "   (vous devriez voir 'Started Application in X seconds')" -ForegroundColor Gray
            Write-Host ""
            
            $step4 = Read-Host "Backend redémarré ? (o/n)"
            
            if ($step4 -eq "o" -or $step4 -eq "O") {
                Write-Host ""
                Write-Host "5️⃣  TESTER" -ForegroundColor Green
                Write-Host "   - Rafraîchissez le frontend (F5)" -ForegroundColor White
                Write-Host "   - Connectez-vous en tant que technicien" -ForegroundColor White
                Write-Host "   - Déclinez une intervention" -ForegroundColor White
                Write-Host "   - Vérifiez qu'elle disparaît de 'À faire'" -ForegroundColor White
                Write-Host ""
                
                Write-Host "✅ Configuration terminée!" -ForegroundColor Green
                Write-Host ""
                Write-Host "Si ça ne marche toujours pas:" -ForegroundColor Yellow
                Write-Host "  1. Vérifiez les logs du backend pour voir les erreurs" -ForegroundColor White
                Write-Host "  2. Vérifiez la console du navigateur (F12)" -ForegroundColor White
                Write-Host "  3. Faites un hard refresh (Ctrl+Shift+R)" -ForegroundColor White
                Write-Host ""
            }
        }
    }
} else {
    Write-Host ""
    Write-Host "⚠️  Veuillez d'abord arrêter le backend." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 Résumé des fichiers modifiés:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:" -ForegroundColor Yellow
Write-Host "  ✓ StatutInterventions.java (ajout de DECLINEE)" -ForegroundColor Green
Write-Host "  ✓ PanneService.java (utilise DECLINEE au lieu de ANNULEE)" -ForegroundColor Green
Write-Host ""
Write-Host "Frontend:" -ForegroundColor Yellow
Write-Host "  ✓ dashboard-technicien.component.ts (gestion de DECLINEE)" -ForegroundColor Green
Write-Host "  ✓ dashboard-technicien.component.html (modale conditionnelle)" -ForegroundColor Green
Write-Host ""
Write-Host "Base de données:" -ForegroundColor Yellow
Write-Host "  ✓ Colonne statut_interventions en VARCHAR(20)" -ForegroundColor Green
Write-Host ""
