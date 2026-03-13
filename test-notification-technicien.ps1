# Script de test pour les notifications du technicien
# Ce script vérifie que les notifications sont bien créées et cliquables

Write-Host "=== TEST NOTIFICATIONS TECHNICIEN ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier qu'une notification existe pour un technicien
Write-Host "1. Vérification des notifications pour le technicien..." -ForegroundColor Yellow

$query = @"
SELECT 
    n.id,
    n.titre,
    n.message,
    n.entity_type,
    n.entity_id,
    n.lu,
    n.date_creation,
    u.username as destinataire
FROM notifications n
JOIN users u ON n.user_id = u.id
WHERE u.role = 'TECHNICIEN'
ORDER BY n.date_creation DESC
LIMIT 5;
"@

$env:PGPASSWORD = "ouz4real"
$result = psql -h localhost -p 5432 -U postgres -d maintenance_db -c $query

Write-Host $result
Write-Host ""

# 2. Vérifier les détails d'une notification spécifique
Write-Host "2. Détails de la dernière notification..." -ForegroundColor Yellow

$detailQuery = @"
SELECT 
    n.id as notification_id,
    n.titre,
    n.message,
    n.entity_type,
    n.entity_id,
    n.lu,
    p.id as panne_id,
    p.description as panne_description,
    p.statut as panne_statut,
    i.statut as intervention_statut,
    u.username as technicien
FROM notifications n
LEFT JOIN pannes p ON n.entity_id = p.id AND n.entity_type = 'PANNE'
LEFT JOIN interventions i ON p.id = i.panne_id
JOIN users u ON n.user_id = u.id
WHERE u.role = 'TECHNICIEN'
ORDER BY n.date_creation DESC
LIMIT 1;
"@

$detailResult = psql -h localhost -p 5432 -U postgres -d maintenance_db -c $detailQuery

Write-Host $detailResult
Write-Host ""

# 3. Instructions pour tester manuellement
Write-Host "=== INSTRUCTIONS DE TEST MANUEL ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Connectez-vous en tant que RESPONSABLE" -ForegroundColor White
Write-Host "2. Affectez une demande à un technicien" -ForegroundColor White
Write-Host "3. Connectez-vous en tant que TECHNICIEN" -ForegroundColor White
Write-Host "4. Cliquez sur la cloche de notification (en haut à droite)" -ForegroundColor White
Write-Host "5. Vous devriez voir: 'Nouvelle intervention affectée'" -ForegroundColor White
Write-Host "6. Cliquez sur la notification" -ForegroundColor White
Write-Host "7. Vérifiez dans la console du navigateur (F12):" -ForegroundColor White
Write-Host "   - 'Notification cliquée:' avec les détails" -ForegroundColor Cyan
Write-Host "8. La page devrait basculer vers 'Interventions'" -ForegroundColor White
Write-Host "9. Le modal de détails devrait s'ouvrir automatiquement" -ForegroundColor White
Write-Host ""

# 4. Vérifier que le backend crée bien les notifications
Write-Host "=== VÉRIFICATION BACKEND ===" -ForegroundColor Green
Write-Host ""
Write-Host "Pour vérifier les logs backend, cherchez:" -ForegroundColor White
Write-Host "  'Notification créée pour le technicien'" -ForegroundColor Cyan
Write-Host "  'Nouvelle intervention affectée'" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== TEST TERMINÉ ===" -ForegroundColor Cyan
