# Script pour créer une demande de test déclinée

Write-Host "🧪 Création d'une demande de test déclinée" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "`n📋 Instructions pour créer une demande déclinée de test:" -ForegroundColor Yellow

Write-Host "`n1. Via l'interface utilisateur:" -ForegroundColor Green
Write-Host "   a) Se connecter en tant que demandeur" -ForegroundColor White
Write-Host "   b) Créer une nouvelle demande" -ForegroundColor White
Write-Host "   c) Se connecter en tant que responsable" -ForegroundColor White
Write-Host "   d) Affecter la demande à un technicien" -ForegroundColor White
Write-Host "   e) Se connecter en tant que technicien" -ForegroundColor White
Write-Host "   f) Décliner la demande avec une raison" -ForegroundColor White

Write-Host "`n2. Via SQL direct (plus rapide):" -ForegroundColor Green

$sqlScript = @"
-- Script SQL pour créer une demande déclinée de test
-- À exécuter dans votre base de données

-- 1. Créer une panne de test
INSERT INTO pannes (titre, description, lieu, type_equipement, statut, priorite, date_signalement, signale_par)
VALUES ('Test Demande Déclinée', 'Demande créée pour tester la modale des demandes déclinées', 'Bureau Test', 'ORDINATEUR', 'EN_COURS', 'MOYENNE', NOW(), 'Test User');

-- 2. Récupérer l'ID de la panne créée
SET @panne_id = LAST_INSERT_ID();

-- 3. Affecter à un technicien (remplacez 1 par un ID technicien valide)
UPDATE pannes SET technicien_id = 1, priorite_responsable = 'HAUTE' WHERE id = @panne_id;

-- 4. Créer une intervention déclinée
INSERT INTO interventions (panne_id, technicien_id, statut, date_creation, raison_refus, date_refus)
VALUES (@panne_id, 1, 'DECLINEE', NOW(), 'Équipement défaillant nécessitant une pièce non disponible en stock. Intervention reportée en attente de réapprovisionnement.', NOW());

-- 5. Mettre à jour le statut de l'intervention dans la panne
UPDATE pannes SET statut_interventions = 'DECLINEE' WHERE id = @panne_id;

-- Vérifier la création
SELECT p.id, p.titre, p.statut, p.statut_interventions, i.raison_refus, i.date_refus
FROM pannes p 
LEFT JOIN interventions i ON p.id = i.panne_id 
WHERE p.id = @panne_id;
"@

Write-Host $sqlScript -ForegroundColor Gray

Write-Host "`n3. Vérification via API:" -ForegroundColor Green

$apiTest = @"
# Test de l'API pour vérifier les données
curl -X GET "http://localhost:8080/api/pannes-responsable/my-pannes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Chercher dans la réponse une panne avec:
# - "statutInterventions": "DECLINEE"
# - "raisonRefus": "..."
# - "dateRefus": "..."
"@

Write-Host $apiTest -ForegroundColor Gray

Write-Host "`n4. Alternative: Modifier une demande existante:" -ForegroundColor Green

$modifyExisting = @"
-- Modifier une panne existante pour la rendre déclinée
-- Remplacez 123 par l'ID d'une panne existante

UPDATE pannes 
SET statut_interventions = 'DECLINEE' 
WHERE id = 123;

-- Ajouter les informations de déclin
UPDATE interventions 
SET statut = 'DECLINEE',
    raison_refus = 'Test de déclin pour vérifier la modale',
    date_refus = NOW()
WHERE panne_id = 123;
"@

Write-Host $modifyExisting -ForegroundColor Gray

Write-Host "`n🎯 Après avoir créé la demande de test:" -ForegroundColor Cyan
Write-Host "   1. Redémarrer le frontend si nécessaire" -ForegroundColor White
Write-Host "   2. Se connecter en tant que responsable maintenance" -ForegroundColor White
Write-Host "   3. Aller dans 'Mes demandes'" -ForegroundColor White
Write-Host "   4. Filtrer par 'Déclinées'" -ForegroundColor White
Write-Host "   5. Vérifier qu'une demande apparaît" -ForegroundColor White
Write-Host "   6. Cliquer sur 'Voir détails'" -ForegroundColor White
Write-Host "   7. Observer les logs dans la console" -ForegroundColor White

Write-Host "`n📋 Données attendues dans les logs:" -ForegroundColor Cyan
Write-Host "   statutInterventions: 'DECLINEE'" -ForegroundColor Gray
Write-Host "   raisonRefus: 'Raison du déclin...'" -ForegroundColor Gray
Write-Host "   dateRefus: '2026-03-10T...'" -ForegroundColor Gray
Write-Host "   statut mappé: 'ANNULEE'" -ForegroundColor Gray

Write-Host "`n✅ Script de création de test prêt!" -ForegroundColor Green