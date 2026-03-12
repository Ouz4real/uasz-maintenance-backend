# Script pour vérifier les demandes de l'utilisateur ousmnane dans la base de données

Write-Host "🔍 Vérification des demandes de ousmnane dans la base de données..." -ForegroundColor Cyan

# Connexion à PostgreSQL et vérification
$query = @"
-- Vérifier l'utilisateur ousmnane
SELECT id, username, nom, prenom, role FROM utilisateurs WHERE username = 'ousmnane';

-- Vérifier toutes les pannes/demandes de ousmnane
SELECT 
    p.id,
    p.titre,
    p.description,
    p.statut,
    p.priorite,
    p.date_signalement,
    p.demandeur_id,
    u.username as demandeur_username
FROM pannes p
LEFT JOIN utilisateurs u ON p.demandeur_id = u.id
WHERE u.username = 'ousmnane'
ORDER BY p.date_signalement DESC;

-- Compter le nombre total de demandes de ousmnane
SELECT COUNT(*) as total_demandes
FROM pannes p
LEFT JOIN utilisateurs u ON p.demandeur_id = u.id
WHERE u.username = 'ousmnane';
"@

Write-Host ""
Write-Host "Exécution de la requête SQL..." -ForegroundColor Yellow
Write-Host ""

# Sauvegarder la requête dans un fichier temporaire
$query | Out-File -FilePath "temp_query.sql" -Encoding UTF8

# Exécuter la requête
$env:PGPASSWORD = "admin"
psql -h localhost -U admin -d uasz_maintenance -f temp_query.sql

# Nettoyer
Remove-Item "temp_query.sql" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Vérification terminée" -ForegroundColor Green
