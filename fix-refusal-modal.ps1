# Script pour modifier la modale de refus dans le dashboard technicien

$file = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"

Write-Host "🔧 Modification de la modale de refus..." -ForegroundColor Cyan

# Lire le contenu du fichier
$content = Get-Content $file -Raw

# Ancien contenu à remplacer
$oldContent = @"
        <div class="modal-body">
          <p class="modal-alert-text">
            Vous êtes sur le point de <strong>refuser</strong> l'intervention « {{ selectedIntervention.titre }} ».
          </p>
          <p class="modal-help">
            Le responsable maintenance sera notifié de ce refus. Confirmez-vous cette action ?
          </p>
        </div>

        <footer class="modal-footer">
          <button type="button" class="secondary-btn" (click)="cancelRefuse()">
            Annuler
          </button>

          <button type="button" class="primary-btn danger" (click)="confirmRefuse()">
            Confirmer le refus
          </button>
        </footer>
"@

# Nouveau contenu
$newContent = @"
        <div class="modal-body">
          <p class="modal-alert-text">
            Vous êtes sur le point de <strong>refuser</strong> l'intervention « {{ selectedIntervention.titre }} ».
          </p>
          <p class="modal-help">
            Le responsable maintenance sera notifié de ce refus. Veuillez indiquer la raison du refus.
          </p>
          
          <!-- 🆕 Champ de raison du refus -->
          <div class="form-group" style="margin-top: 1rem;">
            <label for="raisonRefus">Raison du refus <span style="color: #ef4444;">*</span></label>
            <textarea
              id="raisonRefus"
              [(ngModel)]="raisonRefus"
              placeholder="Expliquez pourquoi vous refusez cette intervention (minimum 10 caractères)..."
              rows="4"
              style="width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-family: inherit; resize: vertical;"
            ></textarea>
            <small style="color: #6b7280; display: block; margin-top: 0.25rem;">
              {{ raisonRefus.length }} / 500 caractères
            </small>
          </div>
        </div>

        <footer class="modal-footer">
          <button type="button" class="secondary-btn" (click)="cancelRefuse()">
            Annuler
          </button>

          <button 
            type="button" 
            class="primary-btn danger" 
            (click)="confirmRefuse()"
            [disabled]="!raisonRefus || raisonRefus.trim().length < 10"
          >
            Confirmer le refus
          </button>
        </footer>
"@

# Remplacer le contenu
if ($content -match [regex]::Escape($oldContent)) {
    $content = $content -replace [regex]::Escape($oldContent), $newContent
    Set-Content -Path $file -Value $content -NoNewline
    Write-Host "✅ Modale de refus modifiée avec succès!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Ancien contenu non trouvé. Vérification manuelle nécessaire." -ForegroundColor Yellow
    Write-Host "Recherche de la section 'Confirmer le refus'..." -ForegroundColor Yellow
    
    # Afficher les lignes autour de "Confirmer le refus"
    $lines = Get-Content $file
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "Confirmer le refus") {
            Write-Host "`nLignes $($i-10) à $($i+5):" -ForegroundColor Cyan
            $lines[($i-10)..($i+5)] | ForEach-Object { Write-Host $_ }
            break
        }
    }
}

Write-Host "`n📝 Vérifiez le fichier: $file" -ForegroundColor Cyan
