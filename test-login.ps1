# Script de test de connexion pour UASZ Maintenance (PowerShell)
# Usage: .\test-login.ps1 [username] [password]

$API_URL = "http://localhost:8080/api/auth/login"

Write-Host "🔐 Test de connexion - UASZ Maintenance" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Login {
    param(
        [string]$Username,
        [string]$Password,
        [string]$Role = ""
    )
    
    if ($Role) {
        Write-Host "Test: $Username ($Role)" -ForegroundColor Yellow
    } else {
        Write-Host "Test de connexion pour: $Username" -ForegroundColor Yellow
    }
    
    $body = @{
        usernameOrEmail = $Username
        motDePasse = $Password
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri $API_URL -Method Post -Body $body -ContentType "application/json"
        
        Write-Host "✓ Connexion réussie!" -ForegroundColor Green
        if ($response.token) {
            $shortToken = $response.token.Substring(0, [Math]::Min(50, $response.token.Length))
            Write-Host "  Token: $shortToken..." -ForegroundColor Gray
            Write-Host "  User ID: $($response.userId)" -ForegroundColor Gray
            Write-Host "  Username: $($response.username)" -ForegroundColor Gray
            Write-Host "  Role: $($response.role)" -ForegroundColor Gray
        }
        Write-Host ""
        return $true
    }
    catch {
        Write-Host "✗ Échec de connexion" -ForegroundColor Red
        Write-Host "  Erreur: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host ""
        return $false
    }
}

# Si des arguments sont fournis, tester cet utilisateur
if ($args.Count -eq 2) {
    $username = $args[0]
    $password = $args[1]
    Test-Login -Username $username -Password $password
    exit
}

# Sinon, tester tous les comptes
Write-Host "Test de tous les comptes utilisateurs..." -ForegroundColor Cyan
Write-Host ""

$users = @(
    @{Username="admin"; Password="admin123"; Role="ADMINISTRATEUR"},
    @{Username="superviseur"; Password="super123"; Role="SUPERVISEUR"},
    @{Username="responsable"; Password="resp123"; Role="RESPONSABLE_MAINTENANCE"},
    @{Username="technicien"; Password="tech123"; Role="TECHNICIEN"},
    @{Username="demandeur"; Password="dem123"; Role="DEMANDEUR"}
)

$successCount = 0
$failCount = 0

foreach ($user in $users) {
    $result = Test-Login -Username $user.Username -Password $user.Password -Role $user.Role
    if ($result) {
        $successCount++
    } else {
        $failCount++
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Résumé:" -ForegroundColor Cyan
Write-Host "  Réussis: $successCount" -ForegroundColor Green
Write-Host "  Échoués: $failCount" -ForegroundColor Red
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "✓ Tous les tests ont réussi!" -ForegroundColor Green
} else {
    Write-Host "⚠ Certains tests ont échoué. Vérifiez que le backend est démarré." -ForegroundColor Yellow
}
