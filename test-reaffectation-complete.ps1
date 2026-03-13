# Test complet de la réaffectation des demandes déclinées
# Ce script teste que:
# 1. Le technicien A décline une demande → Statut DECLINEE
# 2. Le responsable réaffecte au technicien B → Statut NON_DEMARREE pour B
# 3. Le technicien A voit toujours sa demande déclinée
# 4. Le technicien B voit la demande comme A_FAIRE
# 5. Le demandeur voit toujours sa demande

$baseUrl = "http://localhost:8080/api"

Write-Host "=== TEST DE RÉAFFECTATION COMPLÈTE ===" -ForegroundColor Cyan
Write-Host ""

# Étape 1: Login Responsable
Write-Host "1. Login Responsable..." -ForegroundColor Yellow
$loginResp = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"responsable","password":"responsable123"}' `
    -ErrorAction Stop

$tokenResp = $loginResp.token
Write-Host "✓ Token responsable obtenu" -ForegroundColor Green

# Étape 2: Login Demandeur pour créer une demande
Write-Host ""
Write-Host "2. Login Demandeur..." -ForegroundColor Yellow
$loginDemandeur = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"demandeur","password":"demandeur123"}'

$tokenDemandeur = $loginDemandeur.token
$demandeurId = $loginDemandeur.id
Write-Host "✓ Token demandeur obtenu (ID: $demandeurId)" -ForegroundColor Green

# Étape 3: Créer une demande
Write-Host ""
Write-Host "3. Création d'une demande de test..." -ForegroundColor Yellow
$demande = @{
    titre = "Test Réaffectation - $(Get-Date -Format 'HH:mm:ss')"
    description = "Demande pour tester la réaffectation après déclin"
    priorite = "MOYENNE"
    lieu = "Salle Test"
    typeEquipement = "ORDINATEUR"
    signaleePar = "Test User"
} | ConvertTo-Json

$demandeCreee = Invoke-RestMethod -Uri "$baseUrl/pannes" -Method Post `
    -Headers @{Authorization="Bearer $tokenDemandeur"} `
    -ContentType "application/json" `
    -Body $demande

$panneId = $demandeCreee.id
Write-Host "✓ Demande créée avec ID: $panneId" -ForegroundColor Green
Write-Host ""
Write-Host "3. Affectation au Technicien A (ID 3)..." -ForegroundColor Yellow
$affectation = @{
    technicienId = 3
    prioriteResponsable = "HAUTE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId/affecter-technicien-urgence" -Method Post `
    -Headers @{Authorization="Bearer $tokenResp"} `
    -ContentType "application/json" `
    -Body $affectation | Out-Null

Write-Host "✓ Demande affectée au Technicien A" -ForegroundColor Green

# Étape 4: Login Technicien A
Write-Host ""
Write-Host "4. Login Technicien A..." -ForegroundColor Yellow
$loginTechA = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"technicien","password":"technicien123"}'

$tokenTechA = $loginTechA.token
Write-Host "✓ Token Technicien A obtenu" -ForegroundColor Green

# Étape 5: Technicien A décline
Write-Host ""
Write-Host "5. Technicien A décline la demande..." -ForegroundColor Yellow
$declin = @{
    raisonRefus = "Je n'ai pas les compétences pour cette intervention"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId/decliner" -Method Post `
    -Headers @{Authorization="Bearer $tokenTechA"} `
    -ContentType "application/json" `
    -Body $declin | Out-Null

Write-Host "✓ Demande déclinée par Technicien A" -ForegroundColor Green

# Étape 6: Vérifier que Technicien A voit sa demande déclinée
Write-Host ""
Write-Host "6. Vérification: Technicien A voit sa demande déclinée..." -ForegroundColor Yellow
$demandesTechA = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/3/affectees" -Method Get `
    -Headers @{Authorization="Bearer $tokenTechA"}

$demandeTechA = $demandesTechA | Where-Object { $_.id -eq $panneId }
if ($demandeTechA) {
    Write-Host "✓ Technicien A voit la demande" -ForegroundColor Green
    Write-Host "  - Statut: $($demandeTechA.statutInterventions)" -ForegroundColor White
    Write-Host "  - Raison refus: $($demandeTechA.raisonRefus)" -ForegroundColor White
    Write-Host "  - Technicien déclinant ID: $($demandeTechA.technicienDeclinantId)" -ForegroundColor White
} else {
    Write-Host "✗ Technicien A ne voit PAS la demande!" -ForegroundColor Red
}

# Étape 7: Responsable réaffecte au Technicien B (ID 4)
Write-Host ""
Write-Host "7. Responsable réaffecte au Technicien B (ID 4)..." -ForegroundColor Yellow
$reaffectation = @{
    technicienId = 4
    prioriteResponsable = "HAUTE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId/affecter-technicien-urgence" -Method Post `
    -Headers @{Authorization="Bearer $tokenResp"} `
    -ContentType "application/json" `
    -Body $reaffectation | Out-Null

Write-Host "✓ Demande réaffectée au Technicien B" -ForegroundColor Green

# Étape 8: Vérifier l'état de la demande après réaffectation
Write-Host ""
Write-Host "8. Vérification de l'état après réaffectation..." -ForegroundColor Yellow
$demandeApres = Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId" -Method Get `
    -Headers @{Authorization="Bearer $tokenResp"}

Write-Host "État de la demande:" -ForegroundColor White
Write-Host "  - Technicien actuel ID: $($demandeApres.technicien.id)" -ForegroundColor White
Write-Host "  - Statut interventions: $($demandeApres.statutInterventions)" -ForegroundColor White
Write-Host "  - Raison refus: $($demandeApres.raisonRefus)" -ForegroundColor White
Write-Host "  - Date refus: $($demandeApres.dateRefus)" -ForegroundColor White
Write-Host "  - Technicien déclinant ID: $($demandeApres.technicienDeclinantId)" -ForegroundColor White

# Étape 9: Login Technicien B
Write-Host ""
Write-Host "9. Login Technicien B..." -ForegroundColor Yellow
$loginTechB = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"technicien2","password":"technicien123"}'

$tokenTechB = $loginTechB.token
Write-Host "✓ Token Technicien B obtenu" -ForegroundColor Green

# Étape 10: Vérifier que Technicien B voit la demande EN_COURS
Write-Host ""
Write-Host "10. Vérification: Technicien B voit la demande EN_COURS..." -ForegroundColor Yellow
$demandesTechB = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/4/affectees" -Method Get `
    -Headers @{Authorization="Bearer $tokenTechB"}

$demandeTechB = $demandesTechB | Where-Object { $_.id -eq $panneId }
if ($demandeTechB) {
    Write-Host "✓ Technicien B voit la demande" -ForegroundColor Green
    Write-Host "  - Statut: $($demandeTechB.statutInterventions)" -ForegroundColor White
    Write-Host "  - Raison refus: $($demandeTechB.raisonRefus)" -ForegroundColor White
    Write-Host "  - Date refus: $($demandeTechB.dateRefus)" -ForegroundColor White
    Write-Host "  - Technicien déclinant ID: $($demandeTechB.technicienDeclinantId)" -ForegroundColor White
    
    if ($demandeTechB.statutInterventions -eq "EN_COURS" -and 
        $demandeTechB.raisonRefus -eq $null -and 
        $demandeTechB.dateRefus -eq $null) {
        Write-Host "✓ SUCCÈS: Technicien B voit la demande comme NOUVELLE (sans infos de déclin)" -ForegroundColor Green
    } else {
        Write-Host "✗ ÉCHEC: Technicien B voit encore les infos de déclin!" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Technicien B ne voit PAS la demande!" -ForegroundColor Red
}

# Étape 11: Vérifier que Technicien A voit toujours sa demande déclinée
Write-Host ""
Write-Host "11. Vérification finale: Technicien A voit toujours sa demande déclinée..." -ForegroundColor Yellow
$demandesTechAFinal = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/3/affectees" -Method Get `
    -Headers @{Authorization="Bearer $tokenTechA"}

$demandeTechAFinal = $demandesTechAFinal | Where-Object { $_.id -eq $panneId }
if ($demandeTechAFinal) {
    Write-Host "✓ Technicien A voit toujours la demande" -ForegroundColor Green
    Write-Host "  - Statut: $($demandeTechAFinal.statutInterventions)" -ForegroundColor White
    Write-Host "  - Technicien déclinant ID: $($demandeTechAFinal.technicienDeclinantId)" -ForegroundColor White
    
    if ($demandeTechAFinal.technicienDeclinantId -eq 3) {
        Write-Host "✓ SUCCÈS: Technicien A est bien marqué comme ayant décliné" -ForegroundColor Green
    } else {
        Write-Host "✗ ÉCHEC: technicienDeclinantId incorrect!" -ForegroundColor Red
    }
} else {
    Write-Host "✗ ÉCHEC: Technicien A ne voit plus sa demande déclinée!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIN DU TEST ===" -ForegroundColor Cyan

# Étape 4: Affecter au Technicien A (ID 3)
Write-Host ""
Write-Host "4. Affectation au Technicien A (ID 3)..." -ForegroundColor Yellow
$affectation = @{
    technicienId = 3
    prioriteResponsable = "HAUTE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId/affecter-technicien-urgence" -Method Post `
    -Headers @{Authorization="Bearer $tokenResp"} `
    -ContentType "application/json" `
    -Body $affectation | Out-Null

Write-Host "✓ Demande affectée au Technicien A" -ForegroundColor Green

# Étape 5: Login Technicien A
Write-Host ""
Write-Host "5. Login Technicien A..." -ForegroundColor Yellow
$loginTechA = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"technicien","password":"technicien123"}'

$tokenTechA = $loginTechA.token
Write-Host "✓ Token Technicien A obtenu" -ForegroundColor Green

# Étape 6: Technicien A décline
Write-Host ""
Write-Host "6. Technicien A décline la demande..." -ForegroundColor Yellow
$declin = @{
    raisonRefus = "Je n'ai pas les compétences pour cette intervention"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId/decliner" -Method Post `
    -Headers @{Authorization="Bearer $tokenTechA"} `
    -ContentType "application/json" `
    -Body $declin | Out-Null

Write-Host "✓ Demande déclinée par Technicien A" -ForegroundColor Green

# Étape 7: Vérifier que Technicien A voit sa demande déclinée
Write-Host ""
Write-Host "7. Vérification: Technicien A voit sa demande déclinée..." -ForegroundColor Yellow
$demandesTechA = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/3/affectees" -Method Get `
    -Headers @{Authorization="Bearer $tokenTechA"}

$demandeTechA = $demandesTechA | Where-Object { $_.id -eq $panneId }
if ($demandeTechA) {
    Write-Host "✓ Technicien A voit la demande" -ForegroundColor Green
    Write-Host "  - Statut: $($demandeTechA.statutInterventions)" -ForegroundColor White
    Write-Host "  - Technicien déclinant ID: $($demandeTechA.technicienDeclinantId)" -ForegroundColor White
    
    if ($demandeTechA.statutInterventions -eq "DECLINEE") {
        Write-Host "✓ SUCCÈS: La demande est bien DECLINEE pour le technicien A" -ForegroundColor Green
    } else {
        Write-Host "✗ ÉCHEC: La demande devrait être DECLINEE mais est $($demandeTechA.statutInterventions)" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Technicien A ne voit PAS la demande!" -ForegroundColor Red
}

# Étape 8: Responsable réaffecte au Technicien B (ID 4)
Write-Host ""
Write-Host "8. Responsable réaffecte au Technicien B (ID 4)..." -ForegroundColor Yellow
$reaffectation = @{
    technicienId = 4
    prioriteResponsable = "HAUTE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId/affecter-technicien-urgence" -Method Post `
    -Headers @{Authorization="Bearer $tokenResp"} `
    -ContentType "application/json" `
    -Body $reaffectation | Out-Null

Write-Host "✓ Demande réaffectée au Technicien B" -ForegroundColor Green

# Étape 9: Vérifier l'état de la demande après réaffectation
Write-Host ""
Write-Host "9. Vérification de l'état après réaffectation..." -ForegroundColor Yellow
$demandeApres = Invoke-RestMethod -Uri "$baseUrl/pannes/$panneId" -Method Get `
    -Headers @{Authorization="Bearer $tokenResp"}

Write-Host "État de la demande:" -ForegroundColor White
Write-Host "  - Technicien actuel ID: $($demandeApres.technicien.id)" -ForegroundColor White
Write-Host "  - Statut interventions: $($demandeApres.statutInterventions)" -ForegroundColor White
Write-Host "  - Raison refus: $($demandeApres.raisonRefus)" -ForegroundColor White
Write-Host "  - Technicien déclinant ID: $($demandeApres.technicienDeclinantId)" -ForegroundColor White

if ($demandeApres.statutInterventions -eq "NON_DEMARREE") {
    Write-Host "✓ SUCCÈS: Le statut est bien NON_DEMARREE (A_FAIRE)" -ForegroundColor Green
} else {
    Write-Host "✗ ÉCHEC: Le statut devrait être NON_DEMARREE mais est $($demandeApres.statutInterventions)" -ForegroundColor Red
}

# Étape 10: Login Technicien B
Write-Host ""
Write-Host "10. Login Technicien B..." -ForegroundColor Yellow
$loginTechB = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post `
    -ContentType "application/json" `
    -Body '{"username":"technicien2","password":"technicien123"}'

$tokenTechB = $loginTechB.token
Write-Host "✓ Token Technicien B obtenu" -ForegroundColor Green

# Étape 11: Vérifier que Technicien B voit la demande A_FAIRE
Write-Host ""
Write-Host "11. Vérification: Technicien B voit la demande A_FAIRE..." -ForegroundColor Yellow
$demandesTechB = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/4/affectees" -Method Get `
    -Headers @{Authorization="Bearer $tokenTechB"}

$demandeTechB = $demandesTechB | Where-Object { $_.id -eq $panneId }
if ($demandeTechB) {
    Write-Host "✓ Technicien B voit la demande" -ForegroundColor Green
    Write-Host "  - Statut: $($demandeTechB.statutInterventions)" -ForegroundColor White
    Write-Host "  - Raison refus: $($demandeTechB.raisonRefus)" -ForegroundColor White
    Write-Host "  - Technicien déclinant ID: $($demandeTechB.technicienDeclinantId)" -ForegroundColor White
    
    if ($demandeTechB.statutInterventions -eq "NON_DEMARREE" -and 
        $demandeTechB.raisonRefus -eq $null) {
        Write-Host "✓ SUCCÈS: Technicien B voit la demande comme A_FAIRE (sans infos de déclin)" -ForegroundColor Green
    } else {
        Write-Host "✗ ÉCHEC: Technicien B devrait voir NON_DEMARREE sans infos de déclin" -ForegroundColor Red
    }
} else {
    Write-Host "✗ Technicien B ne voit PAS la demande!" -ForegroundColor Red
}

# Étape 12: Vérifier que Technicien A voit toujours sa demande déclinée
Write-Host ""
Write-Host "12. Vérification finale: Technicien A voit toujours sa demande déclinée..." -ForegroundColor Yellow
$demandesTechAFinal = Invoke-RestMethod -Uri "$baseUrl/pannes/technicien/3/affectees" -Method Get `
    -Headers @{Authorization="Bearer $tokenTechA"}

$demandeTechAFinal = $demandesTechAFinal | Where-Object { $_.id -eq $panneId }
if ($demandeTechAFinal) {
    Write-Host "✓ Technicien A voit toujours la demande" -ForegroundColor Green
    Write-Host "  - Technicien déclinant ID: $($demandeTechAFinal.technicienDeclinantId)" -ForegroundColor White
    
    if ($demandeTechAFinal.technicienDeclinantId -eq 3) {
        Write-Host "✓ SUCCÈS: Technicien A est bien marqué comme ayant décliné" -ForegroundColor Green
    } else {
        Write-Host "✗ ÉCHEC: technicienDeclinantId incorrect!" -ForegroundColor Red
    }
} else {
    Write-Host "✗ ÉCHEC: Technicien A ne voit plus sa demande déclinée!" -ForegroundColor Red
}

# Étape 13: Vérifier que le demandeur voit toujours sa demande
Write-Host ""
Write-Host "13. Vérification: Le demandeur voit toujours sa demande..." -ForegroundColor Yellow
$demandesDemandeur = Invoke-RestMethod -Uri "$baseUrl/pannes/mes-pannes" -Method Get `
    -Headers @{Authorization="Bearer $tokenDemandeur"}

$demandeDemandeur = $demandesDemandeur | Where-Object { $_.id -eq $panneId }
if ($demandeDemandeur) {
    Write-Host "✓ SUCCÈS: Le demandeur voit toujours sa demande" -ForegroundColor Green
    Write-Host "  - Titre: $($demandeDemandeur.titre)" -ForegroundColor White
} else {
    Write-Host "✗ ÉCHEC: Le demandeur ne voit plus sa demande!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== FIN DU TEST ===" -ForegroundColor Cyan
