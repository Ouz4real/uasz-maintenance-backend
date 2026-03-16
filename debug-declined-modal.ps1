# Script de diagnostic pour la modale des demandes déclinées

Write-Host "🔍 Diagnostic de la modale des demandes déclinées" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

$responsableFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"
$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html"

Write-Host "`n1. Vérification de la logique de routage..." -ForegroundColor Yellow

if (Test-Path $responsableFile) {
    $content = Get-Content $responsableFile -Raw
    
    # Vérifier la méthode ouvrirDetailDemande
    if ($content -match "ouvrirDetailDemande.*demande\.statut === 'ANNULEE'") {
        Write-Host "   ✅ Logique de routage trouvée" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Logique de routage manquante ou incorrecte" -ForegroundColor Red
        
        # Chercher la méthode ouvrirDetailDemande
        if ($content -match "ouvrirDetailDemande") {
            Write-Host "   📍 Méthode ouvrirDetailDemande trouvée, mais condition incorrecte" -ForegroundColor Yellow
        } else {
            Write-Host "   ❌ Méthode ouvrirDetailDemande non trouvée" -ForegroundColor Red
        }
    }
    
    # Vérifier les méthodes de la modale déclinée
    if ($content -match "openDeclinedDetails") {
        Write-Host "   ✅ Méthode openDeclinedDetails trouvée" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Méthode openDeclinedDetails manquante" -ForegroundColor Red
    }
    
    if ($content -match "closeDeclinedDetailsModal") {
        Write-Host "   ✅ Méthode closeDeclinedDetailsModal trouvée" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Méthode closeDeclinedDetailsModal manquante" -ForegroundColor Red
    }
}

Write-Host "`n2. Vérification du template HTML..." -ForegroundColor Yellow

if (Test-Path $htmlFile) {
    $htmlContent = Get-Content $htmlFile -Raw
    
    if ($htmlContent -match "showDeclinedDetailsModal") {
        Write-Host "   ✅ Modale déclinée trouvée dans le template" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Modale déclinée manquante dans le template" -ForegroundColor Red
    }
    
    if ($htmlContent -match "Détails de la demande déclinée") {
        Write-Host "   ✅ Titre de la modale déclinée trouvé" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Titre de la modale déclinée manquant" -ForegroundColor Red
    }
}

Write-Host "`n3. Diagnostic des données..." -ForegroundColor Yellow

# Vérifier le mapping des statuts
if ($content -match "mapStatutApiToUi.*ANNULEE") {
    Write-Host "   ✅ Mapping ANNULEE trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Mapping ANNULEE manquant" -ForegroundColor Red
}

# Vérifier le filtre des demandes déclinées
if ($content -match "filtreStatutSignalements.*ANNULEE") {
    Write-Host "   ✅ Filtre ANNULEE trouvé" -ForegroundColor Green
} else {
    Write-Host "   ❌ Filtre ANNULEE manquant" -ForegroundColor Red
}

Write-Host "`n4. Points de vérification pour le debug..." -ForegroundColor Yellow
Write-Host "   📋 Vérifiez dans la console du navigateur :" -ForegroundColor White
Write-Host "      - Les données des demandes (statut)" -ForegroundColor Gray
Write-Host "      - L'appel à ouvrirDetailDemande" -ForegroundColor Gray
Write-Host "      - La valeur de demande.statut" -ForegroundColor Gray

Write-Host "`n5. Ajout de logs de debug..." -ForegroundColor Yellow

# Ajouter des logs de debug dans la méthode ouvrirDetailDemande
$debugCode = @"

  ouvrirDetailDemande(demande: MesDemandeResponsable): void {
    console.log('🔍 DEBUG ouvrirDetailDemande:', demande);
    console.log('🔍 DEBUG statut:', demande?.statut);
    console.log('🔍 DEBUG statutInterventions:', demande?.statutInterventions);
    
    if (!demande) return;

    // Si la demande est déclinée, utiliser la modale spécifique
    if (demande.statut === 'ANNULEE') {
      console.log('✅ Routage vers modale déclinée');
      this.openDeclinedDetails(demande);
      return;
    }

    console.log('➡️ Routage vers modale normale');
    this.selectedMesDemande = { ...demande };

    // ✅ si imageUrl est déjà en base -> on la "résout" proprement
    this.selectedMesDemande.imageUrl = this.resolveImageUrl(this.selectedMesDemande.imageUrl);

    this.showMesDetailsModal = true;
    this.lockBodyScroll();
    this.showMesImageInDetails = false;
  }
"@

# Remplacer la méthode existante par celle avec debug
$oldMethod = "ouvrirDetailDemande\(demande: MesDemandeResponsable\): void \{[^}]+\}"
$content = $content -replace $oldMethod, $debugCode.Trim()

Set-Content $responsableFile -Value $content -Encoding UTF8

Write-Host "   ✅ Logs de debug ajoutés à ouvrirDetailDemande" -ForegroundColor Green

Write-Host "`n🎯 Prochaines étapes de diagnostic:" -ForegroundColor Cyan
Write-Host "   1. Redémarrer le frontend" -ForegroundColor White
Write-Host "   2. Ouvrir la console du navigateur (F12)" -ForegroundColor White
Write-Host "   3. Aller dans 'Mes demandes' > Filtrer 'Déclinées'" -ForegroundColor White
Write-Host "   4. Cliquer sur 'Voir détails' d'une demande déclinée" -ForegroundColor White
Write-Host "   5. Vérifier les logs dans la console" -ForegroundColor White

Write-Host "`n📋 Logs à surveiller:" -ForegroundColor Cyan
Write-Host "   🔍 DEBUG ouvrirDetailDemande: [objet demande]" -ForegroundColor Gray
Write-Host "   🔍 DEBUG statut: [valeur du statut]" -ForegroundColor Gray
Write-Host "   ✅ Routage vers modale déclinée (si ça marche)" -ForegroundColor Gray
Write-Host "   ➡️ Routage vers modale normale (si problème)" -ForegroundColor Gray