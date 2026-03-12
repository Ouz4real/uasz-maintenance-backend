# Script pour corriger l'affichage des demandes déclinées dans le dashboard technicien

$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"

Write-Host "Lecture du fichier HTML..." -ForegroundColor Cyan
$content = Get-Content $htmlFile -Raw -Encoding UTF8

# 1. Remplacer le statut en dur par un statut dynamique dans la modale de décision
Write-Host "Mise à jour du statut dans la modale de décision..." -ForegroundColor Yellow
$content = $content -replace '(<span class="tag-label">Statut actuel</span>\s*<span class="status-chip) pending(">)À faire(</span>)', @'
$1" [ngClass]="{
                pending: selectedIntervention.statut === 'A_FAIRE',
                progress: selectedIntervention.statut === 'EN_COURS',
                done: selectedIntervention.statut === 'TERMINEE',
                cancelled: selectedIntervention.statut === 'DECLINEE' || selectedIntervention.statut === 'ANNULEE'
              }$2
                {{ selectedIntervention.statut === 'A_FAIRE' ? 'À faire' : 
                   selectedIntervention.statut === 'EN_COURS' ? 'En cours' : 
                   selectedIntervention.statut === 'TERMINEE' ? 'Terminée' : 
                   selectedIntervention.statut === 'DECLINEE' ? 'Déclinée' : 'Annulée' }}$3
'@

# 2. Ajouter la section d'informations de déclin après le commentaire responsable
Write-Host "Ajout de la section informations de déclin..." -ForegroundColor Yellow
$declinInfo = @'

          <!-- Informations de déclin (si déclinée) -->
          <div class="modal-section" *ngIf="selectedIntervention.statut === 'DECLINEE'">
            <h4>Informations de déclin</h4>
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 1rem; border-radius: 0.5rem;">
              <p style="margin: 0 0 0.5rem 0;">
                <strong>Déclinée par :</strong> {{ selectedIntervention.technicienNom || 'Vous' }}
              </p>
              <p style="margin: 0 0 0.5rem 0;" *ngIf="selectedIntervention.dateRefus">
                <strong>Date du déclin :</strong> {{ selectedIntervention.dateRefus | date:'dd/MM/yyyy à HH:mm' }}
              </p>
              <p style="margin: 0;">
                <strong>Raison :</strong> {{ selectedIntervention.raisonRefus || 'Non spécifiée' }}
              </p>
            </div>
          </div>
'@

$content = $content -replace '(<!-- Commentaire interne du responsable -->.*?</div>\s*</div>)', "`$1$declinInfo"

# 3. Rendre le texte d'aide conditionnel (seulement pour À faire)
Write-Host "Mise à jour du texte d'aide..." -ForegroundColor Yellow
$content = $content -replace '(<p class="modal-help">)\s*Voulez-vous prendre en charge', '$1 *ngIf="selectedIntervention.statut === ''A_FAIRE''">Voulez-vous prendre en charge'

# 4. Rendre le footer avec boutons conditionnel (seulement pour À faire)
Write-Host "Mise à jour du footer de la modale..." -ForegroundColor Yellow
$content = $content -replace '(<footer class="modal-footer">)\s*(<button type="button" class="secondary-btn" \(click\)="refuserIntervention\(\)">)', '$1 *ngIf="selectedIntervention.statut === ''A_FAIRE''">$2'

# 5. Ajouter un footer alternatif pour les demandes déclinées
Write-Host "Ajout du footer pour les demandes déclinées..." -ForegroundColor Yellow
$declinedFooter = @'

        <footer class="modal-footer" *ngIf="selectedIntervention.statut === 'DECLINEE'">
          <button type="button" class="secondary-btn" (click)="closeModals()">
            Fermer
          </button>
        </footer>
'@

$content = $content -replace '(</footer>\s*</section>\s*<!-- MODALE REFUS -->)', "$declinedFooter`$1"

# Sauvegarder
Write-Host "Sauvegarde des modifications..." -ForegroundColor Green
$content | Out-File $htmlFile -Encoding UTF8 -NoNewline

Write-Host "`n✅ Modifications terminées!" -ForegroundColor Green
Write-Host "`nRésumé des changements:" -ForegroundColor Cyan
Write-Host "  - Statut dynamique dans la modale (affiche 'Déclinée' si applicable)" -ForegroundColor White
Write-Host "  - Section d'informations de déclin ajoutée" -ForegroundColor White
Write-Host "  - Boutons d'action masqués pour les demandes déclinées" -ForegroundColor White
Write-Host "  - Footer 'Fermer' ajouté pour les demandes déclinées" -ForegroundColor White
