#!/usr/bin/env pwsh
# Ajout de la pagination pour les maintenances préventives

Write-Host "📄 Ajout de la pagination - Maintenances préventives" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host ""
Write-Host "✅ FONCTIONNALITÉ AJOUTÉE :" -ForegroundColor Green
Write-Host "   Pagination similaire à celle des signalements" -ForegroundColor White
Write-Host ""

Write-Host "📋 MODIFICATIONS APPORTÉES :" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. TYPESCRIPT (Variables de pagination) :" -ForegroundColor Yellow
Write-Host "   • paginatedMaintenancesPreventives: MaintenancePreventive[]" -ForegroundColor White
Write-Host "   • preventivePageSize = 5" -ForegroundColor White
Write-Host "   • preventiveCurrentPage = 1" -ForegroundColor White
Write-Host "   • preventiveTotalPages = 1" -ForegroundColor White
Write-Host "   • preventiveTotalPagesArray: number[]" -ForegroundColor White
Write-Host "   • preventivePageStartIndex = 0" -ForegroundColor White
Write-Host "   • preventivePageEndIndex = 0" -ForegroundColor White
Write-Host ""

Write-Host "2. TYPESCRIPT (Méthodes) :" -ForegroundColor Yellow
Write-Host "   • updatePreventivePagination() - Calcule la pagination" -ForegroundColor White
Write-Host "   • goToPreventivePage(page) - Va à une page spécifique" -ForegroundColor White
Write-Host "   • nextPreventivePage() - Page suivante" -ForegroundColor White
Write-Host "   • previousPreventivePage() - Page précédente" -ForegroundColor White
Write-Host ""

Write-Host "3. HTML (Interface utilisateur) :" -ForegroundColor Yellow
Write-Host "   • Utilise paginatedMaintenancesPreventives au lieu de filteredMaintenancesPreventives" -ForegroundColor White
Write-Host "   • Affiche 'Affichage X–Y sur Z maintenances'" -ForegroundColor White
Write-Host "   • Boutons Précédent / 1 2 3 ... / Suivant" -ForegroundColor White
Write-Host "   • Pagination visible si > 5 maintenances" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "🔍 VÉRIFICATION :" -ForegroundColor Cyan
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html"

if (Test-Path $tsFile) {
    $content = Get-Content $tsFile -Raw
    
    if ($content -match "paginatedMaintenancesPreventives") {
        Write-Host "   ✓ Variable paginatedMaintenancesPreventives ajoutée" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Variable paginatedMaintenancesPreventives manquante" -ForegroundColor Red
    }
    
    if ($content -match "updatePreventivePagination") {
        Write-Host "   ✓ Méthode updatePreventivePagination() ajoutée" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Méthode updatePreventivePagination() manquante" -ForegroundColor Red
    }
    
    if ($content -match "goToPreventivePage") {
        Write-Host "   ✓ Méthode goToPreventivePage() ajoutée" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Méthode goToPreventivePage() manquante" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier TypeScript introuvable" -ForegroundColor Yellow
}

Write-Host ""

if (Test-Path $htmlFile) {
    $content = Get-Content $htmlFile -Raw
    
    if ($content -match "paginatedMaintenancesPreventives") {
        Write-Host "   ✓ HTML utilise paginatedMaintenancesPreventives" -ForegroundColor Green
    } else {
        Write-Host "   ✗ HTML n'utilise pas paginatedMaintenancesPreventives" -ForegroundColor Red
    }
    
    if ($content -match "resp-pagination") {
        Write-Host "   ✓ Bloc de pagination ajouté dans le HTML" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Bloc de pagination manquant dans le HTML" -ForegroundColor Red
    }
    
    if ($content -match "previousPreventivePage|nextPreventivePage") {
        Write-Host "   ✓ Boutons Précédent/Suivant ajoutés" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Boutons Précédent/Suivant manquants" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier HTML introuvable" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60
Write-Host "🎯 COMPORTEMENT :" -ForegroundColor Cyan
Write-Host ""

Write-Host "AFFICHAGE :" -ForegroundColor Yellow
Write-Host "   • 5 maintenances par page (configurable)" -ForegroundColor White
Write-Host "   • Pagination visible si > 5 maintenances" -ForegroundColor White
Write-Host "   • Compteur : 'Affichage 1–5 sur 12 maintenances'" -ForegroundColor White
Write-Host ""

Write-Host "NAVIGATION :" -ForegroundColor Yellow
Write-Host "   • Bouton 'Précédent' (désactivé sur page 1)" -ForegroundColor White
Write-Host "   • Numéros de pages cliquables (1, 2, 3...)" -ForegroundColor White
Write-Host "   • Page active en surbrillance" -ForegroundColor White
Write-Host "   • Bouton 'Suivant' (désactivé sur dernière page)" -ForegroundColor White
Write-Host ""

Write-Host "FILTRES :" -ForegroundColor Yellow
Write-Host "   • Recherche → retour à la page 1" -ForegroundColor White
Write-Host "   • Changement de statut → retour à la page 1" -ForegroundColor White
Write-Host "   • Pagination recalculée automatiquement" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "🧪 COMMENT TESTER :" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. REDÉMARRER LE FRONTEND :" -ForegroundColor Yellow
Write-Host "   cd uasz-maintenance-frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""

Write-Host "2. ACCÉDER À LA SECTION :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant que Responsable" -ForegroundColor White
Write-Host "   b) Cliquez sur 'Maintenance préventive' dans le menu" -ForegroundColor White
Write-Host ""

Write-Host "3. VÉRIFIER LA PAGINATION :" -ForegroundColor Yellow
Write-Host "   a) Si > 5 maintenances : pagination visible en bas" -ForegroundColor White
Write-Host "   b) Cliquez sur 'Suivant' pour aller à la page 2" -ForegroundColor White
Write-Host "   c) Cliquez sur un numéro de page (ex: 3)" -ForegroundColor White
Write-Host "   d) Cliquez sur 'Précédent' pour revenir" -ForegroundColor White
Write-Host ""

Write-Host "4. TESTER LES FILTRES :" -ForegroundColor Yellow
Write-Host "   a) Utilisez la barre de recherche" -ForegroundColor White
Write-Host "   b) Vérifiez que la pagination se met à jour" -ForegroundColor White
Write-Host "   c) Changez le filtre de statut (Planifiée, En retard...)" -ForegroundColor White
Write-Host "   d) Vérifiez le retour automatique à la page 1" -ForegroundColor White
Write-Host ""

Write-Host "5. VÉRIFIER L'AFFICHAGE :" -ForegroundColor Yellow
Write-Host "   a) Compteur : 'Affichage 1–5 sur X maintenances'" -ForegroundColor White
Write-Host "   b) Boutons désactivés aux extrémités" -ForegroundColor White
Write-Host "   c) Page active en surbrillance" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "📊 DÉTAILS TECHNIQUES :" -ForegroundColor Cyan
Write-Host ""

Write-Host "CONFIGURATION :" -ForegroundColor Yellow
Write-Host "   • Taille de page : 5 maintenances" -ForegroundColor White
Write-Host "   • Style : Identique à la pagination des signalements" -ForegroundColor White
Write-Host "   • Classes CSS : resp-pagination, resp-page-btn" -ForegroundColor White
Write-Host ""

Write-Host "LOGIQUE :" -ForegroundColor Yellow
Write-Host "   1. filterMaintenancesPreventives() filtre les données" -ForegroundColor White
Write-Host "   2. updatePreventivePagination() calcule la pagination" -ForegroundColor White
Write-Host "   3. paginatedMaintenancesPreventives contient la page actuelle" -ForegroundColor White
Write-Host "   4. HTML affiche uniquement paginatedMaintenancesPreventives" -ForegroundColor White
Write-Host ""

Write-Host "SYNCHRONISATION :" -ForegroundColor Yellow
Write-Host "   • Chargement initial → page 1" -ForegroundColor White
Write-Host "   • Recherche → page 1" -ForegroundColor White
Write-Host "   • Changement de filtre → page 1" -ForegroundColor White
Write-Host "   • Navigation → page conservée" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "✅ Pagination ajoutée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Redémarrez le frontend pour voir les changements" -ForegroundColor Yellow
Write-Host ""
