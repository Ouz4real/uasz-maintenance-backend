# Script de test complet du système de notifications

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   TEST COMPLET DU SYSTÈME DE NOTIFICATIONS                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "ouz4real"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$allGood = $true

# Test 1 : Table existe
Write-Host "📋 Test 1 : Vérification de la table notifications..." -ForegroundColor Yellow
$tableExists = & $psql -U postgres -d maintenance_db -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications');"
if ($tableExists -match "t") {
    Write-Host "   ✅ PASS - Table existe" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL - Table n'existe pas" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Test 2 : Index créés
Write-Host "📋 Test 2 : Vérification des index..." -ForegroundColor Yellow
$indexCount = & $psql -U postgres -d maintenance_db -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'notifications';"
if ($indexCount -ge 3) {
    Write-Host "   ✅ PASS - $indexCount index trouvés" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL - Seulement $indexCount index trouvés (attendu: 3+)" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Test 3 : Notifications créées
Write-Host "📋 Test 3 : Vérification des notifications de test..." -ForegroundColor Yellow
$notifCount = & $psql -U postgres -d maintenance_db -t -c "SELECT COUNT(*) FROM notifications;"
if ($notifCount -ge 10) {
    Write-Host "   ✅ PASS - $notifCount notifications trouvées" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARN - Seulement $notifCount notifications (attendu: 12+)" -ForegroundColor Yellow
    Write-Host "   Exécutez: .\create-test-notifications.ps1" -ForegroundColor Yellow
}
Write-Host ""

# Test 4 : Notifications non lues
Write-Host "📋 Test 4 : Vérification des notifications non lues..." -ForegroundColor Yellow
$unreadCount = & $psql -U postgres -d maintenance_db -t -c "SELECT COUNT(*) FROM notifications WHERE lu = false;"
if ($unreadCount -gt 0) {
    Write-Host "   ✅ PASS - $unreadCount notifications non lues" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARN - Aucune notification non lue" -ForegroundColor Yellow
}
Write-Host ""

# Test 5 : Utilisateurs avec notifications
Write-Host "📋 Test 5 : Utilisateurs avec notifications..." -ForegroundColor Yellow
$usersWithNotifs = & $psql -U postgres -d maintenance_db -t -c "SELECT COUNT(DISTINCT utilisateur_id) FROM notifications;"
if ($usersWithNotifs -ge 3) {
    Write-Host "   ✅ PASS - $usersWithNotifs utilisateurs ont des notifications" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARN - Seulement $usersWithNotifs utilisateurs" -ForegroundColor Yellow
}
Write-Host ""

# Test 6 : Backend compilé
Write-Host "📋 Test 6 : Vérification de la compilation backend..." -ForegroundColor Yellow
if (Test-Path "target\classes\sn\uasz\uasz_maintenance_backend\controllers\NotificationController.class") {
    Write-Host "   ✅ PASS - NotificationController compilé" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  WARN - Backend non compilé" -ForegroundColor Yellow
    Write-Host "   Exécutez: mvn compile" -ForegroundColor Yellow
}
Write-Host ""

# Test 7 : Fichiers frontend
Write-Host "📋 Test 7 : Vérification des fichiers frontend..." -ForegroundColor Yellow
$frontendFiles = @(
    "uasz-maintenance-frontend\src\app\core\services\notification.service.ts",
    "uasz-maintenance-frontend\src\app\shared\components\notification-bell\notification-bell.component.ts",
    "uasz-maintenance-frontend\src\app\shared\components\notification-bell\notification-bell.component.html",
    "uasz-maintenance-frontend\src\app\shared\components\notification-bell\notification-bell.component.scss"
)
$missingFiles = 0
foreach ($file in $frontendFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles++
    }
}
if ($missingFiles -eq 0) {
    Write-Host "   ✅ PASS - Tous les fichiers frontend présents" -ForegroundColor Green
} else {
    Write-Host "   ❌ FAIL - $missingFiles fichiers manquants" -ForegroundColor Red
    $allGood = $false
}
Write-Host ""

# Résumé
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "║   ✅ TOUS LES TESTS SONT PASSÉS !                         ║" -ForegroundColor Green
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "║   Le système de notifications est prêt à l'emploi !       ║" -ForegroundColor Green
} else {
    Write-Host "║   ⚠️  CERTAINS TESTS ONT ÉCHOUÉ                           ║" -ForegroundColor Yellow
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "║   Consultez les messages ci-dessus pour corriger          ║" -ForegroundColor Yellow
}
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Afficher les statistiques
Write-Host "📊 STATISTIQUES DES NOTIFICATIONS" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
& $psql -U postgres -d maintenance_db -c "SELECT u.username, u.role, COUNT(n.id) as total, COUNT(CASE WHEN n.lu = false THEN 1 END) as non_lues FROM utilisateurs u LEFT JOIN notifications n ON u.id = n.utilisateur_id GROUP BY u.id, u.username, u.role HAVING COUNT(n.id) > 0 ORDER BY u.role;"
Write-Host ""

# Instructions pour tester
Write-Host "🚀 POUR TESTER MAINTENANT :" -ForegroundColor Cyan
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
Write-Host "1. Terminal 1 : mvn spring-boot:run" -ForegroundColor White
Write-Host "2. Terminal 2 : cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host "3. Navigateur : http://localhost:4200" -ForegroundColor White
Write-Host "4. Connectez-vous en tant qu'admin" -ForegroundColor White
Write-Host "5. Regardez la cloche 🔔 dans le header" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation : NOTIFICATIONS_PRET.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
