# Script pour corriger toutes les erreurs TypeScript liées aux statuts

Write-Host "🔧 Correction complète des erreurs TypeScript" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$filePath = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"

# Lire le contenu du fichier
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "`n1. Mise à jour de l'interface Demande dans demande.model.ts..." -ForegroundColor Yellow

# Mettre à jour l'interface Demande pour inclure ANNULEE
$demandeModelPath = "uasz-maintenance-frontend/src/app/core/models/demande.model.ts"
$demandeContent = Get-Content $demandeModelPath -Raw -Encoding UTF8

$oldDemandeInterface = "statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE';"
$newDemandeInterface = "statut: 'EN_ATTENTE' | 'EN_COURS' | 'RESOLUE' | 'ANNULEE';"

$demandeContent = $demandeContent -replace [regex]::Escape($oldDemandeInterface), $newDemandeInterface
Set-Content $demandeModelPath -Value $demandeContent -Encoding UTF8

Write-Host "   ✅ Interface Demande mise à jour" -ForegroundColor Green

Write-Host "`n2. Restauration de la méthode mapStatutApiToUi avec ANNULEE..." -ForegroundColor Yellow

# Restaurer la méthode mapStatutApiToUi pour qu'elle puisse retourner ANNULEE
$oldMapMethod = @"
 private mapStatutApiToUi(apiStatut: StatutPanneApi | any, statutInterventions?: string): MesDemandeStatut {
    if (apiStatut === 'OUVERTE') return 'EN_ATTENTE';
    if (apiStatut === 'EN_COURS') return 'EN_COURS';
    return 'RESOLUE';
  }

  // Nouvelle méthode pour vérifier si une demande est déclinée
  private isDemandeDeclinee(statutInterventions?: string): boolean {
    return statutInterventions === 'DECLINEE' || statutInterventions === 'ANNULEE';
  }
"@

$newMapMethod = @"
 private mapStatutApiToUi(apiStatut: StatutPanneApi | any, statutInterventions?: string): MesDemandeStatut {
    // Si l'intervention est déclinée, retourner ANNULEE
    if (statutInterventions === 'DECLINEE' || statutInterventions === 'ANNULEE') {
      return 'ANNULEE';
    }
    
    if (apiStatut === 'OUVERTE') return 'EN_ATTENTE';
    if (apiStatut === 'EN_COURS') return 'EN_COURS';
    return 'RESOLUE';
  }

  // Méthode pour vérifier si une demande est déclinée
  private isDemandeDeclinee(statutInterventions?: string): boolean {
    return statutInterventions === 'DECLINEE' || statutInterventions === 'ANNULEE';
  }
"@

$content = $content -replace [regex]::Escape($oldMapMethod), $newMapMethod

Write-Host "   ✅ Méthode mapStatutApiToUi restaurée" -ForegroundColor Green

Write-Host "`n3. Correction des appels à mapStatutApiToUi..." -ForegroundColor Yellow

# Corriger tous les appels pour passer le statutInterventions quand disponible
$patterns = @(
    @{
        old = "statut: this.mapStatutApiToUi(updated.statut),"
        new = "statut: this.mapStatutApiToUi(updated.statut, updated.statutInterventions),"
    },
    @{
        old = "statut: this.mapStatutApiToUi(p.statut),"
        new = "statut: this.mapStatutApiToUi(p.statut, (p as any).statutInterventions),"
    },
    @{
        old = "statut: this.mapStatutApiToUi(panneApi.statut),"
        new = "statut: this.mapStatutApiToUi(panneApi.statut, panneApi.statutInterventions),"
    },
    @{
        old = "statut: this.mapStatutApiToUi(updatedApi.statut),"
        new = "statut: this.mapStatutApiToUi(updatedApi.statut, updatedApi.statutInterventions),"
    }
)

foreach ($pattern in $patterns) {
    $content = $content -replace [regex]::Escape($pattern.old), $pattern.new
}

Write-Host "   ✅ Appels à mapStatutApiToUi corrigés" -ForegroundColor Green

Write-Host "`n4. Correction de la condition dans ouvrirDetailDemande..." -ForegroundColor Yellow

# Utiliser le statut ANNULEE au lieu de la méthode isDemandeDeclinee
$oldCondition = @"
    // Si la demande est déclinée, utiliser la modale spécifique
    if (this.isDemandeDeclinee(demande.statutInterventions)) {
      this.openDeclinedDetails(demande);
      return;
    }
"@

$newCondition = @"
    // Si la demande est déclinée, utiliser la modale spécifique
    if (demande.statut === 'ANNULEE') {
      this.openDeclinedDetails(demande);
      return;
    }
"@

$content = $content -replace [regex]::Escape($oldCondition), $newCondition

Write-Host "   ✅ Condition dans ouvrirDetailDemande corrigée" -ForegroundColor Green

# Écrire le contenu corrigé
Set-Content $filePath -Value $content -Encoding UTF8

Write-Host "`n✅ Toutes les erreurs TypeScript ont été corrigées!" -ForegroundColor Green
Write-Host "`n📋 Résumé des corrections:" -ForegroundColor Cyan
Write-Host "   • Interface Demande mise à jour pour accepter ANNULEE" -ForegroundColor White
Write-Host "   • Méthode mapStatutApiToUi restaurée avec gestion ANNULEE" -ForegroundColor White
Write-Host "   • Tous les appels corrigés pour passer statutInterventions" -ForegroundColor White
Write-Host "   • Logique de routage simplifiée" -ForegroundColor White