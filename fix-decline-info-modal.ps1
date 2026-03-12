# Script pour ajouter la section "Informations de déclin" dans la modale

$filePath = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"

# Lire le contenu du fichier
$content = Get-Content $filePath -Raw -Encoding UTF8

# Définir le texte à rechercher (juste avant le paragraphe d'aide)
$searchText = @"
          </div>

          <p class="modal-help" *ngIf="selectedIntervention.statut === 'A_FAIRE'">Voulez-vous prendre en charge cette intervention ? Vous pourrez ensuite ajouter vos notes,
            pièces utilisées et l'image de l'équipement.
          </p>
"@

# Définir le texte de remplacement (avec la nouvelle section)
$replaceText = @"
          </div>

          <!-- Informations de déclin (si déclinée) -->
          <div class="modal-section" *ngIf="selectedIntervention.statut === 'DECLINEE'">
            <h4>Informations de déclin</h4>
            
            <div class="decline-info-box">
              <div class="decline-info-row" *ngIf="selectedIntervention.dateRefus">
                <span class="decline-label">Date du déclin :</span>
                <span class="decline-value">{{ selectedIntervention.dateRefus | date:'dd/MM/yyyy à HH:mm' }}</span>
              </div>
              
              <div class="decline-info-row" *ngIf="selectedIntervention.technicienNom">
                <span class="decline-label">Décliné par :</span>
                <span class="decline-value">{{ selectedIntervention.technicienNom }}</span>
              </div>
              
              <div class="decline-info-row" *ngIf="selectedIntervention.raisonRefus">
                <span class="decline-label">Raison du déclin :</span>
                <p class="decline-reason">{{ selectedIntervention.raisonRefus }}</p>
              </div>
              
              <div *ngIf="!selectedIntervention.raisonRefus && !selectedIntervention.dateRefus">
                <p class="modal-help" style="color: #6b7280; font-style: italic;">
                  Aucune information de déclin disponible.
                </p>
              </div>
            </div>
          </div>

          <p class="modal-help" *ngIf="selectedIntervention.statut === 'A_FAIRE'">Voulez-vous prendre en charge cette intervention ? Vous pourrez ensuite ajouter vos notes,
            pièces utilisées et l'image de l'équipement.
          </p>
"@

# Effectuer le remplacement
if ($content -match [regex]::Escape($searchText)) {
    $newContent = $content -replace [regex]::Escape($searchText), $replaceText
    Set-Content $filePath -Value $newContent -Encoding UTF8
    Write-Host "✅ Section 'Informations de déclin' ajoutée avec succès dans la modale"
} else {
    Write-Host "❌ Texte de recherche non trouvé. Vérification du contenu..."
    
    # Recherche alternative plus flexible
    $alternativeSearch = "modal-help.*A_FAIRE.*Voulez-vous prendre en charge"
    if ($content -match $alternativeSearch) {
        Write-Host "📍 Texte similaire trouvé, mais structure différente"
        Write-Host "Contenu autour de la ligne:"
        $lines = $content -split "`n"
        for ($i = 0; $i -lt $lines.Length; $i++) {
            if ($lines[$i] -match "Voulez-vous prendre en charge") {
                $start = [Math]::Max(0, $i - 3)
                $end = [Math]::Min($lines.Length - 1, $i + 3)
                for ($j = $start; $j -le $end; $j++) {
                    Write-Host "Ligne $($j + 1): $($lines[$j])"
                }
                break
            }
        }
    }
}