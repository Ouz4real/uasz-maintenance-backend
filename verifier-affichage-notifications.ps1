# Script de vérification visuelle des notifications

$env:PGPASSWORD = "ouz4real"
$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   VÉRIFICATION VISUELLE DES NOTIFICATIONS                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Notifications pour l'admin :" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray
& $psql -U postgres -d maintenance_db -c "SELECT id, titre, message, type, lu FROM notifications WHERE utilisateur_id = (SELECT id FROM utilisateurs WHERE username = 'admin') ORDER BY date_creation DESC;"
Write-Host ""

Write-Host "✅ Vérifications :" -ForegroundColor Yellow
Write-Host "─────────────────────────────────────────────────────────────" -ForegroundColor Gray

# Vérifier l'absence de caractères bizarres
$badChars = & $psql -U postgres -d maintenance_db -t -c "SELECT COUNT(*) FROM notifications WHERE titre LIKE '%Ã%' OR message LIKE '%Ã%';"
if ($badChars -eq 0) {
    Write-Host "   ✅ Aucun caractère mal encodé trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ $badChars notifications avec mauvais encodage" -ForegroundColor Red
    Write-Host "   Exécutez: .\fix-notifications-display.ps1" -ForegroundColor Yellow
}

# Vérifier le nombre de notifications
$totalNotifs = & $psql -U postgres -d maintenance_db -t -c "SELECT COUNT(*) FROM notifications;"
if ($totalNotifs -ge 12) {
    Write-Host "   ✅ $totalNotifs notifications créées" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Seulement $totalNotifs notifications" -ForegroundColor Yellow
}

# Vérifier les notifications non lues
$unreadNotifs = & $psql -U postgres -d maintenance_db -t -c "SELECT COUNT(*) FROM notifications WHERE lu = false;"
if ($unreadNotifs -gt 0) {
    Write-Host "   ✅ $unreadNotifs notifications non lues (badge visible)" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Aucune notification non lue (badge invisible)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   INSTRUCTIONS DE TEST                                     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Redémarrez le frontend :" -ForegroundColor Yellow
Write-Host "   cd uasz-maintenance-frontend && npm start" -ForegroundColor White
Write-Host ""

Write-Host "2. Videz le cache du navigateur :" -ForegroundColor Yellow
Write-Host "   Ctrl + Shift + R" -ForegroundColor White
Write-Host ""

Write-Host "3. Connectez-vous en admin" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. Vérifiez visuellement :" -ForegroundColor Yellow
Write-Host "   ✓ La cloche est visible (bleue avec fond bleu clair)" -ForegroundColor White
Write-Host "   ✓ Le badge rouge affiche '2'" -ForegroundColor White
Write-Host "   ✓ Cliquez sur la cloche → panel s'ouvre" -ForegroundColor White
Write-Host "   ✓ Les textes sont lisibles (sans Ã, Ã©, etc.)" -ForegroundColor White
Write-Host "   ✓ Les icônes sont correctes (ℹ️, ✓, ⚠️)" -ForegroundColor White
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   APPARENCE ATTENDUE                                       ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Dashboard Admin                              [🔔²] [≡]" -ForegroundColor White
Write-Host "                                                      " -ForegroundColor White
Write-Host "  Tableau de bord · Administrateur                   " -ForegroundColor White
Write-Host ""
Write-Host "  Clique sur 🔔 →" -ForegroundColor Yellow
Write-Host ""
Write-Host "  ┌─ Notifications ──────────────────────────────┐" -ForegroundColor White
Write-Host "  │                                          [X] │" -ForegroundColor White
Write-Host "  │  Tout marquer comme lu                       │" -ForegroundColor White
Write-Host "  ├──────────────────────────────────────────────┤" -ForegroundColor White
Write-Host "  │  ℹ️  Nouveau compte cree              [x]  │" -ForegroundColor Cyan
Write-Host "  │     Un nouveau compte technicien...         │" -ForegroundColor Gray
Write-Host "  │     Il y a 11 min                      ●    │" -ForegroundColor Gray
Write-Host "  ├──────────────────────────────────────────────┤" -ForegroundColor White
Write-Host "  │  ✓  Systeme mis a jour                [x]  │" -ForegroundColor Green
Write-Host "  │     Le systeme de notifications...          │" -ForegroundColor Gray
Write-Host "  │     Il y a 1h                          ●    │" -ForegroundColor Gray
Write-Host "  └──────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation : README_NOTIFICATIONS_FINAL.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Appuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
