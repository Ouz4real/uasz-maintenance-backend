# Script pour corriger le mapping des données déclinées

Write-Host "🔧 Correction du mapping des données déclinées" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

$responsableFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"

# Lire le contenu du fichier
$content = Get-Content $responsableFile -Raw -Encoding UTF8

Write-Host "`n1. Ajout de logs de debug dans mapPannesToMesDemandes..." -ForegroundColor Yellow

# Trouver la méthode mapPannesToMesDemandes et ajouter des logs
$oldMapMethod = @"
  private mapPannesToMesDemandes(list: PanneDto[]): MesDemandeResponsable[] {
    return (list ?? []).map((p) => {
      const raw = p.imageUrl ?? p.imagePath; // string | null | undefined

      return {
        id: p.id,
        titre: p.titre ?? '',
        dateCreation: this.safeDateIso(p),
        lieu: p.lieu ?? '',
        statut: this.mapStatutApiToUi(p.statut, (p as any).statutInterventions),

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
      };
    });
  }
"@

$newMapMethod = @"
  private mapPannesToMesDemandes(list: PanneDto[]): MesDemandeResponsable[] {
    console.log('🔍 DEBUG mapPannesToMesDemandes - Données reçues:', list);
    
    return (list ?? []).map((p) => {
      const raw = p.imageUrl ?? p.imagePath;
      const statutInterventions = (p as any).statutInterventions;
      
      console.log(`🔍 DEBUG Panne ${p.id}:`, {
        statut: p.statut,
        statutInterventions: statutInterventions,
        raisonRefus: (p as any).raisonRefus
      });

      const mappedStatut = this.mapStatutApiToUi(p.statut, statutInterventions);
      console.log(`🔍 DEBUG Statut mappé pour panne ${p.id}:`, mappedStatut);

      return {
        id: p.id,
        titre: p.titre ?? '',
        dateCreation: this.safeDateIso(p),
        lieu: p.lieu ?? '',
        statut: mappedStatut,

        typeEquipement: p.typeEquipement ?? '',
        description: p.description ?? '',

        // ✅ string | undefined garanti
        imageUrl: this.resolveImageUrl(raw),

        urgence: (p.priorite ?? undefined) as any,
        
        // Ajouter les informations de déclin et le statut d'intervention
        statutInterventions: statutInterventions,
        raisonRefus: (p as any).raisonRefus,
        dateRefus: (p as any).dateRefus,
        technicienNom: (p as any).technicienNom,
        technicienPrenom: (p as any).technicienPrenom
      };
    });
  }
"@

$content = $content -replace [regex]::Escape($oldMapMethod.Trim()), $newMapMethod.Trim()

Write-Host "   ✅ Logs de debug ajoutés dans mapPannesToMesDemandes" -ForegroundColor Green

Write-Host "`n2. Ajout de logs dans la méthode mapStatutApiToUi..." -ForegroundColor Yellow

$oldMapStatutMethod = @"
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

$newMapStatutMethod = @"
 private mapStatutApiToUi(apiStatut: StatutPanneApi | any, statutInterventions?: string): MesDemandeStatut {
    console.log('🔍 DEBUG mapStatutApiToUi:', { apiStatut, statutInterventions });
    
    // Si l'intervention est déclinée, retourner ANNULEE
    if (statutInterventions === 'DECLINEE' || statutInterventions === 'ANNULEE') {
      console.log('✅ Retour ANNULEE pour statutInterventions:', statutInterventions);
      return 'ANNULEE';
    }
    
    if (apiStatut === 'OUVERTE') return 'EN_ATTENTE';
    if (apiStatut === 'EN_COURS') return 'EN_COURS';
    return 'RESOLUE';
  }
"@

$content = $content -replace [regex]::Escape($oldMapStatutMethod.Trim()), $newMapStatutMethod.Trim()

Write-Host "   ✅ Logs de debug ajoutés dans mapStatutApiToUi" -ForegroundColor Green

Write-Host "`n3. Ajout de logs dans openDeclinedDetails..." -ForegroundColor Yellow

# Ajouter des logs dans openDeclinedDetails
$oldOpenDeclined = @"
  // Méthodes pour la modale des demandes déclinées
  openDeclinedDetails(demande: any): void {
    this.selectedDeclinedDemande = { ...demande };
    
    // Résoudre l'URL de l'image comme dans la méthode originale
    this.selectedDeclinedDemande.imageUrl = this.resolveImageUrl(this.selectedDeclinedDemande.imageUrl);
    
    this.showDeclinedDetailsModal = true;
    this.lockBodyScroll();
    this.showDeclinedImageInDetails = false;
  }
"@

$newOpenDeclined = @"
  // Méthodes pour la modale des demandes déclinées
  openDeclinedDetails(demande: any): void {
    console.log('🎯 DEBUG openDeclinedDetails appelée avec:', demande);
    
    this.selectedDeclinedDemande = { ...demande };
    
    // Résoudre l'URL de l'image comme dans la méthode originale
    this.selectedDeclinedDemande.imageUrl = this.resolveImageUrl(this.selectedDeclinedDemande.imageUrl);
    
    console.log('🎯 Ouverture de la modale déclinée');
    this.showDeclinedDetailsModal = true;
    this.lockBodyScroll();
    this.showDeclinedImageInDetails = false;
  }
"@

$content = $content -replace [regex]::Escape($oldOpenDeclined.Trim()), $newOpenDeclined.Trim()

Write-Host "   ✅ Logs de debug ajoutés dans openDeclinedDetails" -ForegroundColor Green

# Écrire le contenu modifié
Set-Content $responsableFile -Value $content -Encoding UTF8

Write-Host "`n✅ Logs de debug ajoutés avec succès!" -ForegroundColor Green

Write-Host "`n🎯 Instructions de test:" -ForegroundColor Cyan
Write-Host "   1. Redémarrer le frontend" -ForegroundColor White
Write-Host "   2. Ouvrir la console du navigateur (F12)" -ForegroundColor White
Write-Host "   3. Se connecter en tant que responsable maintenance" -ForegroundColor White
Write-Host "   4. Aller dans 'Mes demandes'" -ForegroundColor White
Write-Host "   5. Observer les logs de chargement des données" -ForegroundColor White
Write-Host "   6. Filtrer par 'Déclinées'" -ForegroundColor White
Write-Host "   7. Cliquer sur 'Voir détails' d'une demande" -ForegroundColor White

Write-Host "`n📋 Logs à surveiller:" -ForegroundColor Cyan
Write-Host "   🔍 DEBUG mapPannesToMesDemandes - Données reçues" -ForegroundColor Gray
Write-Host "   🔍 DEBUG Panne X: { statut, statutInterventions, raisonRefus }" -ForegroundColor Gray
Write-Host "   🔍 DEBUG Statut mappé pour panne X" -ForegroundColor Gray
Write-Host "   🔍 DEBUG ouvrirDetailDemande" -ForegroundColor Gray
Write-Host "   🎯 DEBUG openDeclinedDetails appelée avec" -ForegroundColor Gray

Write-Host "`n⚠️ Si aucune demande n'a statutInterventions = 'DECLINEE':" -ForegroundColor Yellow
Write-Host "   Il faudra vérifier les données du backend ou créer une demande de test" -ForegroundColor White