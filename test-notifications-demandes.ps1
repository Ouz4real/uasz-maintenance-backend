# Script PowerShell pour tester les notifications de changement de statut des demandes

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST NOTIFICATIONS STATUT DEMANDES" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$env:PGPASSWORD = "ouz4real"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "maintenance_db"
$dbUser = "postgres"
$apiUrl = "http://localhost:8080"

# Fonction pour exécuter une requête SQL
function Invoke-SQL {
    param([string]$Query)
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $Query
}

Write-Host "ETAPE 1: Vérification des utilisateurs" -ForegroundColor Yellow
Write-Host "=======================================" -ForegroundColor Yellow
Write-Host "Demandeurs:" -ForegroundColor Gray
Invoke-SQL "SELECT id, username, nom, prenom FROM utilisateurs WHERE role = 'DEMANDEUR' LIMIT 3;"
Write-Host ""
Write-Host "Techniciens:" -ForegroundColor Gray
Invoke-SQL "SELECT id, username, nom, prenom FROM utilisateurs WHERE role = 'TECHNICIEN' LIMIT 3;"
Write-Host ""

Write-Host "ETAPE 2: Vérification des demandes existantes" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow
Invoke-SQL "SELECT id, titre, statut, statut_interventions, demandeur_id, technicien_id FROM pannes WHERE statut != 'RESOLUE' ORDER BY date_signalement DESC LIMIT 5;"
Write-Host ""

Write-Host "ETAPE 3: Comptage des notifications actuelles" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Yellow
Invoke-SQL "SELECT COUNT(*) as total_notifications FROM notifications WHERE entity_type = 'PANNE';"
Write-Host ""

Write-Host "ETAPE 4: Instructions pour le test manuel" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pour tester les notifications de changement de statut:" -ForegroundColor White
Write-Host ""
Write-Host "1. Se connecter en tant que DEMANDEUR" -ForegroundColor Cyan
Write-Host "   - Créer une nouvelle demande d'intervention" -ForegroundColor Gray
Write-Host "   - Noter l'ID de la demande créée" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Se connecter en tant que RESPONSABLE" -ForegroundColor Cyan
Write-Host "   - Affecter la demande à un technicien" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Se connecter en tant que TECHNICIEN" -ForegroundColor Cyan
Write-Host "   - Aller dans 'Mes interventions'" -ForegroundColor Gray
Write-Host "   - Cliquer sur 'Démarrer l'intervention'" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Se reconnecter en tant que DEMANDEUR" -ForegroundColor Cyan
Write-Host "   - Vérifier le badge de notification (🔔 1)" -ForegroundColor Gray
Write-Host "   - Cliquer sur la cloche" -ForegroundColor Gray
Write-Host "   - Vérifier la notification 'Intervention en cours'" -ForegroundColor Gray
Write-Host "   - Cliquer sur la notification" -ForegroundColor Gray
Write-Host "   - Vérifier la redirection vers les détails" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Se reconnecter en tant que TECHNICIEN" -ForegroundColor Cyan
Write-Host "   - Cliquer sur 'Terminer l'intervention'" -ForegroundColor Gray
Write-Host "   - Remplir le formulaire et valider" -ForegroundColor Gray
Write-Host ""
Write-Host "6. Se reconnecter en tant que DEMANDEUR" -ForegroundColor Cyan
Write-Host "   - Vérifier le badge de notification (🔔 1)" -ForegroundColor Gray
Write-Host "   - Cliquer sur la cloche" -ForegroundColor Gray
Write-Host "   - Vérifier la notification 'Intervention terminée'" -ForegroundColor Gray
Write-Host "   - Cliquer sur la notification" -ForegroundColor Gray
Write-Host "   - Vérifier la redirection vers les détails" -ForegroundColor Gray
Write-Host ""

Write-Host "ETAPE 5: Vérification des notifications après test" -ForegroundColor Yellow
Write-Host "===================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "Exécutez cette commande après avoir effectué le test:" -ForegroundColor White
Write-Host ""
Write-Host "psql -h localhost -p 5432 -U postgres -d maintenance_db -c \"" -ForegroundColor Gray
Write-Host "SELECT n.id, n.titre, n.message, n.type, n.lu, n.entity_type, n.entity_id," -ForegroundColor Gray
Write-Host "       u.username as demandeur_username, p.titre as panne_titre" -ForegroundColor Gray
Write-Host "FROM notifications n" -ForegroundColor Gray
Write-Host "LEFT JOIN utilisateurs u ON n.utilisateur_id = u.id" -ForegroundColor Gray
Write-Host "LEFT JOIN pannes p ON n.entity_id = p.id" -ForegroundColor Gray
Write-Host "WHERE n.entity_type = 'PANNE'" -ForegroundColor Gray
Write-Host "ORDER BY n.date_creation DESC LIMIT 10;\"" -ForegroundColor Gray
Write-Host ""

Write-Host "ETAPE 6: Requêtes SQL utiles" -ForegroundColor Yellow
Write-Host "============================" -ForegroundColor Yellow
Write-Host ""
Write-Host "# Voir toutes les notifications de type PANNE" -ForegroundColor Cyan
Write-Host "SELECT * FROM notifications WHERE entity_type = 'PANNE' ORDER BY date_creation DESC;" -ForegroundColor Gray
Write-Host ""
Write-Host "# Compter les notifications non lues par demandeur" -ForegroundColor Cyan
Write-Host "SELECT u.username, COUNT(n.id) as nb_non_lues" -ForegroundColor Gray
Write-Host "FROM utilisateurs u" -ForegroundColor Gray
Write-Host "LEFT JOIN notifications n ON u.id = n.utilisateur_id AND n.lu = false" -ForegroundColor Gray
Write-Host "WHERE u.role = 'DEMANDEUR'" -ForegroundColor Gray
Write-Host "GROUP BY u.username;" -ForegroundColor Gray
Write-Host ""
Write-Host "# Voir les détails d'une demande spécifique" -ForegroundColor Cyan
Write-Host "SELECT * FROM pannes WHERE id = [ID_DEMANDE];" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FIN DU SCRIPT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "RESUME:" -ForegroundColor Yellow
Write-Host "- Les notifications sont créées automatiquement lors du démarrage et de la fin d'intervention" -ForegroundColor White
Write-Host "- Le demandeur reçoit une notification INFO (bleu) quand l'intervention démarre" -ForegroundColor White
Write-Host "- Le demandeur reçoit une notification SUCCESS (vert) quand l'intervention se termine" -ForegroundColor White
Write-Host "- Les notifications sont cliquables et redirigent vers les détails de la demande" -ForegroundColor White
Write-Host ""
