# Script pour vérifier les demandes via l'API backend

Write-Host "🔍 Vérification des demandes via l'API..." -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier toutes les pannes
Write-Host "1️⃣ Récupération de toutes les pannes..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes" -Method Get
    Write-Host "✅ Total de pannes dans la base: $($response.Count)" -ForegroundColor Green
    
    if ($response.Count -gt 0) {
        Write-Host ""
        Write-Host "Détails des pannes:" -ForegroundColor Cyan
        $response | ForEach-Object {
            Write-Host "  - ID: $($_.id) | Titre: $($_.titre) | Demandeur: $($_.demandeurNom) | Statut: $($_.statut)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Erreur lors de la récupération des pannes: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

# 2. Vérifier les utilisateurs
Write-Host "2️⃣ Vérification de l'utilisateur ousmnane..." -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "http://localhost:8080/api/utilisateurs" -Method Get
    $ousmnane = $users | Where-Object { $_.username -eq "ousmnane" }
    
    if ($ousmnane) {
        Write-Host "✅ Utilisateur trouvé:" -ForegroundColor Green
        Write-Host "  - ID: $($ousmnane.id)" -ForegroundColor White
        Write-Host "  - Username: $($ousmnane.username)" -ForegroundColor White
        Write-Host "  - Nom: $($ousmnane.nom)" -ForegroundColor White
        Write-Host "  - Prénom: $($ousmnane.prenom)" -ForegroundColor White
        Write-Host "  - Rôle: $($ousmnane.role)" -ForegroundColor White
        
        # Filtrer les pannes de ousmnane
        Write-Host ""
        Write-Host "3️⃣ Filtrage des demandes de ousmnane..." -ForegroundColor Yellow
        $response = Invoke-RestMethod -Uri "http://localhost:8080/api/pannes" -Method Get
        $demandesOusmnane = $response | Where-Object { $_.demandeurId -eq $ousmnane.id }
        
        Write-Host "✅ Nombre de demandes de ousmnane: $($demandesOusmnane.Count)" -ForegroundColor Green
        
        if ($demandesOusmnane.Count -gt 0) {
            Write-Host ""
            Write-Host "Détails des demandes de ousmnane:" -ForegroundColor Cyan
            $demandesOusmnane | ForEach-Object {
                Write-Host "  - ID: $($_.id)" -ForegroundColor White
                Write-Host "    Titre: $($_.titre)" -ForegroundColor White
                Write-Host "    Statut: $($_.statut)" -ForegroundColor White
                Write-Host "    Priorité: $($_.priorite)" -ForegroundColor White
                Write-Host "    Date: $($_.dateSignalement)" -ForegroundColor White
                Write-Host ""
            }
        } else {
            Write-Host "⚠️  Aucune demande trouvée pour ousmnane!" -ForegroundColor Yellow
            Write-Host "   Les données ont peut-être été supprimées de la base de données." -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ Utilisateur ousmnane non trouvé!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Erreur: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Vérification terminée" -ForegroundColor Green
