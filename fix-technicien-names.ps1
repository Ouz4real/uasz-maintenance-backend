# Script PowerShell pour corriger les noms des techniciens

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORRECTION DES NOMS DES TECHNICIENS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "ouz4real"
$dbHost = "localhost"
$dbPort = "5432"
$dbName = "maintenance_db"
$dbUser = "postgres"

function Invoke-SQL {
    param([string]$Query)
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $Query
}

Write-Host "1. Vérification des techniciens sans prénom/nom..." -ForegroundColor Yellow
Write-Host ""
Invoke-SQL "SELECT id, username, nom, prenom, email FROM utilisateurs WHERE role = 'TECHNICIEN' AND (nom IS NULL OR nom = '' OR prenom IS NULL OR prenom = '');"
Write-Host ""

Write-Host "2. Correction du technicien par défaut..." -ForegroundColor Yellow
Invoke-SQL "UPDATE utilisateurs SET nom = 'Technicien', prenom = 'Service' WHERE username = 'technicien' AND role = 'TECHNICIEN' AND (nom IS NULL OR nom = '' OR prenom IS NULL OR prenom = '');"
Write-Host ""

Write-Host "3. Vérification après correction..." -ForegroundColor Yellow
Write-Host ""
Invoke-SQL "SELECT id, username, nom, prenom, email FROM utilisateurs WHERE role = 'TECHNICIEN';"
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CORRECTION TERMINEE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Si vous avez d'autres techniciens sans nom/prénom," -ForegroundColor Yellow
Write-Host "vous pouvez les corriger manuellement avec:" -ForegroundColor Yellow
Write-Host ""
Write-Host "UPDATE utilisateurs" -ForegroundColor Gray
Write-Host "SET nom = 'NomDuTechnicien', prenom = 'PrenomDuTechnicien'" -ForegroundColor Gray
Write-Host "WHERE username = 'username_du_technicien';" -ForegroundColor Gray
Write-Host ""
