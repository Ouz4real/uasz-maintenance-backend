# Script de test pour vérifier que la notification technicien ouvre bien le modal
# Ce script teste le flux complet : création notification -> affichage -> clic -> ouverture modal

Write-Host "=== Test Notification Technicien - Ouverture Modal ===" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier qu'il y a des notifications pour un technicien
Write-Host "1. Vérification des notifications technicien..." -ForegroundColor Yellow

$query = @"
SELECT 
    n.id,
    n.titre,
    n.message,
    n.entity_type,
    n.entity_id,
    n.date_creation,
    u.nom as technicien_nom,
    u.prenom as technicien_prenom,
    p.titre as panne_titre,
    p.statut as panne_statut
FROM notifications n
JOIN utilisateurs u ON n.utilisateur_id = u.id
LEFT JOIN pannes p ON n.entity_id = p.id
WHERE u.role = 'TECHNICIEN'
  AND n.entity_type = 'PANNE'
  AND n.lu = false
ORDER BY n.date_creation DESC
LIMIT 5;
"@

$result = docker exec uasz-maintenance-db psql -U uasz_user -d uasz_maintenance_db -c $query

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Notifications trouvées" -ForegroundColor Green
    Write-Host $result
} else {
    Write-Host "✗ Erreur lors de la récupération des notifications" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Vérification que les pannes existent..." -ForegroundColor Yellow

$query2 = @"
SELECT 
    p.id,
    p.titre,
    p.statut,
    p.priorite_responsable,
    t.nom as technicien_nom,
    t.prenom as technicien_prenom
FROM pannes p
LEFT JOIN utilisateurs t ON p.technicien_affecte_id = t.id
WHERE p.technicien_affecte_id IS NOT NULL
  AND p.statut IN ('AFFECTEE', 'EN_COURS')
ORDER BY p.date_signalement DESC
LIMIT 5;
"@

$result2 = docker exec uasz-maintenance-db psql -U uasz_user -d uasz_maintenance_db -c $query2

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Pannes affectées trouvées" -ForegroundColor Green
    Write-Host $result2
} else {
    Write-Host "✗ Erreur lors de la récupération des pannes" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Instructions de Test Manuel ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Ouvrir le frontend : http://localhost:4200" -ForegroundColor White
Write-Host "2. Se connecter en tant que technicien (ex: tech1 / password123)" -ForegroundColor White
Write-Host "3. Ouvrir la console du navigateur (F12)" -ForegroundColor White
Write-Host "4. Cliquer sur la cloche de notification (en haut à droite)" -ForegroundColor White
Write-Host "5. Vérifier que les notifications s'affichent" -ForegroundColor White
Write-Host "6. Cliquer sur une notification 'Nouvelle intervention affectée'" -ForegroundColor White
Write-Host ""
Write-Host "=== Comportement Attendu ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✓ La section 'Interventions' devient active" -ForegroundColor Green
Write-Host "✓ Le modal de détails de l'intervention s'ouvre automatiquement" -ForegroundColor Green
Write-Host "✓ Les détails de l'intervention sont affichés (titre, description, urgence, etc.)" -ForegroundColor Green
Write-Host "✓ Les boutons 'Accepter' et 'Refuser' sont visibles" -ForegroundColor Green
Write-Host ""
Write-Host "=== Logs Console à Vérifier ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dans la console du navigateur, vous devriez voir :" -ForegroundColor White
Write-Host "  🔔 Notification cliquée: {entityType: 'PANNE', entityId: X, ...}" -ForegroundColor Gray
Write-Host "  🔍 Intervention trouvée: {id: X, titre: '...', ...}" -ForegroundColor Gray
Write-Host ""
Write-Host "Si l'intervention n'est pas trouvée immédiatement :" -ForegroundColor White
Write-Host "  ⚠️ Intervention non trouvée, rechargement des données..." -ForegroundColor Gray
Write-Host "  (puis après 1 seconde)" -ForegroundColor Gray
Write-Host "  🔍 Intervention trouvée: {id: X, titre: '...', ...}" -ForegroundColor Gray
Write-Host ""
Write-Host "=== Dépannage ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si le modal ne s'ouvre pas :" -ForegroundColor Yellow
Write-Host "  1. Vérifier dans la console qu'il n'y a pas d'erreur JavaScript" -ForegroundColor White
Write-Host "  2. Vérifier que l'intervention existe bien dans la liste" -ForegroundColor White
Write-Host "  3. Vérifier que l'entityId de la notification correspond à l'ID de la panne" -ForegroundColor White
Write-Host "  4. Recharger la page et réessayer" -ForegroundColor White
Write-Host ""
Write-Host "Si vous voyez '❌ Intervention toujours introuvable après rechargement' :" -ForegroundColor Yellow
Write-Host "  1. Vérifier que la panne existe dans la base de données" -ForegroundColor White
Write-Host "  2. Vérifier que le technicien est bien affecté à cette panne" -ForegroundColor White
Write-Host "  3. Vérifier l'API : GET /api/pannes/technicien/{technicienId}" -ForegroundColor White
Write-Host ""
