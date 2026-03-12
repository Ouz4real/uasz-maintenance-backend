# Script pour corriger les erreurs TypeScript dans le dashboard responsable

Write-Host "🔧 Correction des erreurs TypeScript - Dashboard Responsable" -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

$filePath = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"

# Lire le contenu du fichier
$content = Get-Content $filePath -Raw -Encoding UTF8

Write-Host "`n1. Correction de la méthode mapStatutApiToUi..." -ForegroundColor Yellow

# Corriger la signature de la méthode mapStatutApiToUi pour ne pas retourner ANNULEE
$oldMapStatut = @"
 private mapStatutApiToUi(apiStatut: StatutPanneApi | any, statutInterventions?: string): MesDemandeStatut {
    // Si l'intervention est déclinée, retourner ANNULEE
    if (statutInterventions === 'DECLINEE' || statutInterventions === 'ANNULEE') {
      return 'ANNULEE';
    }
    
    if (apiStatut === 'OUVERTE') return 'EN_ATTENTE';
    if (apiStatut === 'EN_COURS') return 'EN_COURS';
    return 'RESOLUE';
  }
"@

$newMapStatut = @"
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

$content = $content -replace [regex]::Escape($oldMapStatut), $newMapStatut

Write-Host "   ✅ Méthode mapStatutApiToUi corrigée" -ForegroundColor Green

Write-Host "`n2. Correction de la méthode mapPannesToMesDemandes..." -ForegroundColor Yellow

# Corriger le mapping pour ajouter le champ statutInterventions
$oldMapping = @"
        statut: this.mapStatutApiToUi(p.statut, p.statutInterventions),

        typeEquipement: p.typeEquipement ?? '',
        description: p.description ?? '',

        // ✅ string | undefined garanti
        imageUrl: this.resolveImageUrl(raw),

        urgence: (p.priorite ?? undefined) as any,
        
        // Ajouter les informations de déclin
        raisonRefus: (p as any).raisonRefus,
        dateRefus: (p as any).dateRefus,
        technicienNom: (p as any).technicienNom,
        technicienPrenom: (p as any).technicienPrenom
"@

$newMapping = @"
        statut: this.mapStatutApiToUi(p.statut),

        typeEquipement: p.typeEquipement ?? '',
        description: p.description ?? '',

        // ✅ string | undefined garanti
        imageUrl: this.resolveImageUrl(raw),

        urgence: (p.priorite ?? undefined) as any,
        
        // Ajouter les informations de déclin et le statut d'intervention
        statutInterventions: (p as any).statutInterventions,
        raisonRefus: (p as any).raisonRefus,
        dateRefus: (p as any).dateRefus,
        technicienNom: (p as any).technicienNom,
        technicienPrenom: (p as any).technicienPrenom
"@

$content = $content -replace [regex]::Escape($oldMapping), $newMapping

Write-Host "   ✅ Mapping des pannes corrigé" -ForegroundColor Green

Write-Host "`n3. Correction de l'interface MesDemandeResponsable..." -ForegroundColor Yellow

# Ajouter le champ statutInterventions à l'interface
$oldInterface = @"
export interface MesDemandeResponsable {
  id: number;
  titre: string;
  dateCreation: Date;
  lieu: string;
  statut: MesDemandeStatut;

  typeEquipement: string;
  description: string;
  imageUrl?: string;
  urgence?: 'BASSE' | 'MOYENNE' | 'HAUTE' | string;

  // Champs pour les informations de déclin
  raisonRefus?: string;
  dateRefus?: string;
  technicienNom?: string;
  technicienPrenom?: string;
}
"@

$newInterface = @"
export interface MesDemandeResponsable {
  id: number;
  titre: string;
  dateCreation: Date;
  lieu: string;
  statut: MesDemandeStatut;

  typeEquipement: string;
  description: string;
  imageUrl?: string;
  urgence?: 'BASSE' | 'MOYENNE' | 'HAUTE' | string;

  // Champs pour les informations de déclin
  statutInterventions?: string;
  raisonRefus?: string;
  dateRefus?: string;
  technicienNom?: string;
  technicienPrenom?: string;
}
"@

$content = $content -replace [regex]::Escape($oldInterface), $newInterface

Write-Host "   ✅ Interface MesDemandeResponsable corrigée" -ForegroundColor Green

Write-Host "`n4. Correction de la méthode ouvrirDetailDemande..." -ForegroundColor Yellow

# Corriger la condition pour utiliser la nouvelle méthode
$oldOuvrirDetail = @"
  ouvrirDetailDemande(demande: MesDemandeResponsable): void {
    if (!demande) return;

    // Si la demande est déclinée, utiliser la modale spécifique
    if (demande.statut === 'ANNULEE') {
      this.openDeclinedDetails(demande);
      return;
    }
"@

$newOuvrirDetail = @"
  ouvrirDetailDemande(demande: MesDemandeResponsable): void {
    if (!demande) return;

    // Si la demande est déclinée, utiliser la modale spécifique
    if (this.isDemandeDeclinee(demande.statutInterventions)) {
      this.openDeclinedDetails(demande);
      return;
    }
"@

$content = $content -replace [regex]::Escape($oldOuvrirDetail), $newOuvrirDetail

Write-Host "   ✅ Méthode ouvrirDetailDemande corrigée" -ForegroundColor Green

# Écrire le contenu corrigé
Set-Content $filePath -Value $content -Encoding UTF8

Write-Host "`n✅ Toutes les erreurs TypeScript ont été corrigées!" -ForegroundColor Green
Write-Host "`n📋 Résumé des corrections:" -ForegroundColor Cyan
Write-Host "   • Suppression du statut ANNULEE du type de retour" -ForegroundColor White
Write-Host "   • Ajout du champ statutInterventions à l'interface" -ForegroundColor White
Write-Host "   • Nouvelle méthode isDemandeDeclinee pour la logique" -ForegroundColor White
Write-Host "   • Correction du mapping des données" -ForegroundColor White