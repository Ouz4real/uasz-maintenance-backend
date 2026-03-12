# Script de test pour vérifier le comportement des demandes déclinées dans le dashboard technicien

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "TEST: Demandes déclinées - Dashboard Technicien" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📋 Vérifications à effectuer manuellement:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1️⃣  AVANT DE DÉCLINER:" -ForegroundColor Green
Write-Host "   ✓ Connectez-vous en tant que technicien" -ForegroundColor White
Write-Host "   ✓ Allez dans 'Mes interventions'" -ForegroundColor White
Write-Host "   ✓ Cliquez sur une demande 'À faire'" -ForegroundColor White
Write-Host "   ✓ Vérifiez que vous voyez:" -ForegroundColor White
Write-Host "     - Statut: 'À faire'" -ForegroundColor Gray
Write-Host "     - Bouton 'Décliner l'intervention'" -ForegroundColor Gray
Write-Host "     - Bouton 'Accepter l'intervention et démarrer'" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  DÉCLINER UNE DEMANDE:" -ForegroundColor Green
Write-Host "   ✓ Cliquez sur 'Décliner l'intervention'" -ForegroundColor White
Write-Host "   ✓ Entrez une raison (minimum 10 caractères)" -ForegroundColor White
Write-Host "   ✓ Cliquez sur 'Confirmer le refus'" -ForegroundColor White
Write-Host "   ✓ Vérifiez le message de succès" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  APRÈS LE DÉCLIN:" -ForegroundColor Green
Write-Host "   ✓ La demande NE DOIT PLUS apparaître dans 'À faire'" -ForegroundColor White
Write-Host "   ✓ Cliquez sur le filtre 'Toutes'" -ForegroundColor White
Write-Host "   ✓ La demande déclinée doit être visible" -ForegroundColor White
Write-Host "   ✓ Cliquez sur le filtre 'Déclinées'" -ForegroundColor White
Write-Host "   ✓ La demande déclinée doit être visible" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  MODALE EN LECTURE SEULE:" -ForegroundColor Green
Write-Host "   ✓ Cliquez sur la demande déclinée" -ForegroundColor White
Write-Host "   ✓ Vérifiez que la modale affiche:" -ForegroundColor White
Write-Host "     - Statut: 'Déclinée' (en rouge/gris)" -ForegroundColor Gray
Write-Host "     - Section 'Informations de déclin' avec:" -ForegroundColor Gray
Write-Host "       • Déclinée par: [Votre nom]" -ForegroundColor Gray
Write-Host "       • Date du déclin: [Date et heure]" -ForegroundColor Gray
Write-Host "       • Raison: [Votre raison]" -ForegroundColor Gray
Write-Host "     - PAS de boutons 'Décliner' ou 'Accepter'" -ForegroundColor Gray
Write-Host "     - Seulement un bouton 'Fermer'" -ForegroundColor Gray
Write-Host ""

Write-Host "5️⃣  STATISTIQUES:" -ForegroundColor Green
Write-Host "   ✓ Vérifiez que le compteur 'À faire' a diminué de 1" -ForegroundColor White
Write-Host "   ✓ Vérifiez que le compteur 'Déclinées' a augmenté de 1" -ForegroundColor White
Write-Host ""

Write-Host "📊 Vérification des fichiers modifiés:" -ForegroundColor Yellow
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts"
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"

if (Test-Path $tsFile) {
    $tsContent = Get-Content $tsFile -Raw
    
    Write-Host "✅ Fichier TypeScript:" -ForegroundColor Green
    
    if ($tsContent -match "statut: 'A_FAIRE' \| 'EN_COURS' \| 'TERMINEE' \| 'ANNULEE' \| 'DECLINEE'") {
        Write-Host "   ✓ Interface Intervention inclut 'DECLINEE'" -ForegroundColor White
    } else {
        Write-Host "   ✗ Interface Intervention ne contient pas 'DECLINEE'" -ForegroundColor Red
    }
    
    if ($tsContent -match "statutFilter: 'TOUS' \| 'A_FAIRE' \| 'EN_COURS' \| 'TERMINEE' \| 'ANNULEE' \| 'DECLINEE'") {
        Write-Host "   ✓ Filtre de statut inclut 'DECLINEE'" -ForegroundColor White
    } else {
        Write-Host "   ✗ Filtre de statut ne contient pas 'DECLINEE'" -ForegroundColor Red
    }
    
    if ($tsContent -match "declinees = 0;") {
        Write-Host "   ✓ Variable 'declinees' déclarée" -ForegroundColor White
    } else {
        Write-Host "   ✗ Variable 'declinees' manquante" -ForegroundColor Red
    }
    
    if ($tsContent -match "statutInterventions === 'DECLINEE'") {
        Write-Host "   ✓ Mapping du statut DECLINEE dans mapStatutInterventionApiToUi" -ForegroundColor White
    } else {
        Write-Host "   ✗ Mapping du statut DECLINEE manquant" -ForegroundColor Red
    }
    
    if ($tsContent -match "'DECLINEE': 5") {
        Write-Host "   ✓ Ordre de tri inclut DECLINEE" -ForegroundColor White
    } else {
        Write-Host "   ✗ Ordre de tri ne contient pas DECLINEE" -ForegroundColor Red
    }
}

Write-Host ""

if (Test-Path $htmlFile) {
    $htmlContent = Get-Content $htmlFile -Raw
    
    Write-Host "✅ Fichier HTML:" -ForegroundColor Green
    
    if ($htmlContent -match "setStatutFilter\('DECLINEE'\)") {
        Write-Host "   ✓ Bouton filtre 'Déclinées' présent" -ForegroundColor White
    } else {
        Write-Host "   ✗ Bouton filtre 'Déclinées' manquant" -ForegroundColor Red
    }
    
    if ($htmlContent -match "declinees") {
        Write-Host "   ✓ Compteur 'declinees' utilisé dans le HTML" -ForegroundColor White
    } else {
        Write-Host "   ✗ Compteur 'declinees' non utilisé" -ForegroundColor Red
    }
    
    if ($htmlContent -match "selectedIntervention\.statut === 'DECLINEE'") {
        Write-Host "   ✓ Condition pour afficher les infos de déclin" -ForegroundColor White
    } else {
        Write-Host "   ✗ Condition pour les infos de déclin manquante" -ForegroundColor Red
    }
    
    if ($htmlContent -match "\*ngIf=`"selectedIntervention\.statut === 'A_FAIRE'`"") {
        Write-Host "   ✓ Boutons d'action conditionnels (seulement pour À faire)" -ForegroundColor White
    } else {
        Write-Host "   ✗ Boutons d'action non conditionnels" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🎯 RÉSUMÉ" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Les modifications suivantes ont été apportées:" -ForegroundColor Yellow
Write-Host "  1. Ajout du statut 'DECLINEE' dans l'interface Intervention" -ForegroundColor White
Write-Host "  2. Ajout du filtre 'Déclinées' dans le dashboard" -ForegroundColor White
Write-Host "  3. Mapping du statut DECLINEE depuis l'API" -ForegroundColor White
Write-Host "  4. Exclusion des demandes déclinées du filtre 'À faire'" -ForegroundColor White
Write-Host "  5. Modale en lecture seule pour les demandes déclinées" -ForegroundColor White
Write-Host "  6. Affichage des informations de déclin (raison, date, technicien)" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  N'oubliez pas de:" -ForegroundColor Yellow
Write-Host "  - Redémarrer le serveur frontend si nécessaire" -ForegroundColor White
Write-Host "  - Vérifier que le backend retourne bien le statut 'DECLINEE'" -ForegroundColor White
Write-Host "  - Tester avec un vrai déclin de demande" -ForegroundColor White
Write-Host ""
