# Script de réinitialisation du mot de passe admin
# Mot de passe: admin123

Write-Host "🔐 Réinitialisation du mot de passe admin..." -ForegroundColor Cyan
Write-Host ""

# Configuration PostgreSQL
$PGHOST = "localhost"
$PGPORT = "5432"
$PGDATABASE = "maintenance_db"
$PGUSER = "postgres"
$PGPASSWORD = "ouz4real"

# Hash BCrypt pour "admin123"
$hashedPassword = '$2a$10$8K1p/a0dL3.uOYLvDfKFqOXwNlkJl8n.Yh3/Qv8K5xYvZqW8mXqGO'

# Commande SQL
$sqlCommand = "UPDATE utilisateurs SET mot_de_passe = '$hashedPassword' WHERE username = 'admin';"

# Tentative 1: Avec psql si disponible
try {
    $env:PGPASSWORD = $PGPASSWORD
    $result = psql -h $PGHOST -p $PGPORT -U $PGUSER -d $PGDATABASE -c $sqlCommand 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Mot de passe admin réinitialisé avec succès!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Identifiants:" -ForegroundColor Yellow
        Write-Host "  Username: admin" -ForegroundColor White
        Write-Host "  Password: admin123" -ForegroundColor White
        exit 0
    }
} catch {
    Write-Host "⚠ psql non disponible, tentative avec une autre méthode..." -ForegroundColor Yellow
}

# Tentative 2: Avec Npgsql (bibliothèque .NET)
Write-Host "Tentative de connexion directe à PostgreSQL..." -ForegroundColor Yellow

$connectionString = "Host=$PGHOST;Port=$PGPORT;Database=$PGDATABASE;Username=$PGUSER;Password=$PGPASSWORD"

try {
    # Charger l'assembly Npgsql si disponible
    Add-Type -Path "C:\Program Files\PackageManagement\NuGet\Packages\Npgsql.*\lib\net*\Npgsql.dll" -ErrorAction Stop
    
    $connection = New-Object Npgsql.NpgsqlConnection($connectionString)
    $connection.Open()
    
    $command = $connection.CreateCommand()
    $command.CommandText = $sqlCommand
    $rowsAffected = $command.ExecuteNonQuery()
    
    $connection.Close()
    
    Write-Host "✓ Mot de passe admin réinitialisé avec succès!" -ForegroundColor Green
    Write-Host "  Lignes affectées: $rowsAffected" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Identifiants:" -ForegroundColor Yellow
    Write-Host "  Username: admin" -ForegroundColor White
    Write-Host "  Password: admin123" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "❌ Impossible de se connecter automatiquement à PostgreSQL" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez exécuter manuellement cette commande SQL:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "UPDATE utilisateurs SET mot_de_passe = '$hashedPassword' WHERE username = 'admin';" -ForegroundColor White
    Write-Host ""
    Write-Host "Vous pouvez utiliser:" -ForegroundColor Cyan
    Write-Host "  - pgAdmin" -ForegroundColor White
    Write-Host "  - DBeaver" -ForegroundColor White
    Write-Host "  - Ou tout autre client PostgreSQL" -ForegroundColor White
    Write-Host ""
    Write-Host "Connexion PostgreSQL:" -ForegroundColor Cyan
    Write-Host "  Host: $PGHOST" -ForegroundColor White
    Write-Host "  Port: $PGPORT" -ForegroundColor White
    Write-Host "  Database: $PGDATABASE" -ForegroundColor White
    Write-Host "  Username: $PGUSER" -ForegroundColor White
    Write-Host "  Password: $PGPASSWORD" -ForegroundColor White
}
