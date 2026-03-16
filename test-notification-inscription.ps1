# Script pour tester la notification d'inscription

$env:PGPASSWORD = "ouz4real"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TEST - Notification d'inscription utilisateur           ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Création d'une notification de test..." -ForegroundColor Yellow
& $psql -U postgres -d maintenance_db -f test-notification-inscription.sql | Out-Null

Write-Host "✅ Notification créée!" -ForegroundColor Green
Write-Host ""

Write-Host "Vérification..." -ForegroundColor Yellow
& $psql -U postgres -d maintenance_db -c "SELECT n.id, n.titre, n.type, n.lu, n.entity_type, n.entity_id FROM notifications n JOIN utilisateurs u ON n.utilisateur_id = u.id WHERE u.role = 'ADMINISTRATEUR' AND n.entity_type = 'UTILISATEUR' ORDER BY n.date_creation DESC LIMIT 1;"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   INSTRUCTIONS DE TEST                                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Assurez-vous que le backend et frontend sont démarrés" -ForegroundColor Yellow
Write-Host ""

Write-Host "2. Connectez-vous en tant qu'admin :" -ForegroundColor Yellow
Write-Host "   - Ouvrez http://localhost:4200" -ForegroundColor White
Write-Host "   - Username : admin" -ForegroundColor White
Write-Host "   - Password : votre mot de passe" -ForegroundColor White
Write-Host ""

Write-Host "3. Vérifiez la notification :" -ForegroundColor Yellow
Write-Host "   ✓ Le badge doit afficher le nouveau compteur" -ForegroundColor White
Write-Host "   ✓ Cliquez sur la cloche 🔔" -ForegroundColor White
Write-Host "   ✓ Vous voyez 'Nouvel utilisateur inscrit'" -ForegroundColor White
Write-Host "   ✓ Cliquez sur la notification" -ForegroundColor White
Write-Host "   ✓ Vous êtes redirigé vers la page Utilisateurs" -ForegroundColor White
Write-Host "   ✓ Le modal de détails s'ouvre automatiquement" -ForegroundColor White
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TEST RÉEL                                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pour tester avec une vraie inscription :" -ForegroundColor Yellow
Write-Host "1. Ouvrez http://localhost:4200" -ForegroundColor White
Write-Host "2. Cliquez sur 'S'inscrire'" -ForegroundColor White
Write-Host "3. Remplissez le formulaire :" -ForegroundColor White
Write-Host "   - Username : testuser" -ForegroundColor Gray
Write-Host "   - Email : test@uasz.sn" -ForegroundColor Gray
Write-Host "   - Nom : Test" -ForegroundColor Gray
Write-Host "   - Prénom : Utilisateur" -ForegroundColor Gray
Write-Host "   - Mot de passe : Test123@" -ForegroundColor Gray
Write-Host "4. Cliquez sur 'S'inscrire'" -ForegroundColor White
Write-Host "5. Connectez-vous en tant qu'admin" -ForegroundColor White
Write-Host "6. Vérifiez la nouvelle notification !" -ForegroundColor White
Write-Host ""

Write-Host "📚 Documentation : NOTIFICATION_INSCRIPTION_UTILISATEUR.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
