# Script pour ajouter la modale en lecture seule pour les interventions déclinées - Dashboard Technicien

$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"
$scssFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss"
$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts"

Write-Host "🔧 Modification du dashboard technicien pour les interventions déclinées..." -ForegroundColor Cyan

# 1. Modifier le HTML - Modale de décision (A_FAIRE)
Write-Host "`n📝 Modification de la modale de décision..." -ForegroundColor Yellow

$htmlContent = Get-Content $htmlFile -Raw -Encoding UTF8

# Remplacer le footer de la modale de décision
$oldFooter1 = @"
        <footer class="modal-footer">
          <button type="button" class="secondary-btn" (click)="refuserIntervention()">
            Décliner l'intervention
          </button>

          <button type="button" class="primary-btn" (click)="accepterIntervention()">
            Accepter l'intervention et démarrer
          </button>
        </footer>
      </section>

      <!-- MODALE REFUS -->
"@

$newFooter1 = @"
        <!-- Afficher les infos de déclin si l'intervention est déclinée -->
        <div *ngIf="selectedIntervention?.statut === 'ANNULEE'" class="declined-info-box">
          <div class="alert-info-box">
            <span class="material-icons">info</span>
            <div>
              <strong>Intervention déclinée</strong>
              <p>Vous avez décliné cette intervention</p>
            </div>
          </div>
          
          <div class="info-detail-row" *ngIf="selectedIntervention.raisonRefus">
            <strong>Raison du déclin:</strong>
            <p>{{ selectedIntervention.raisonRefus }}</p>
          </div>
          
          <div class="info-detail-row" *ngIf="selectedIntervention.dateRefus">
            <strong>Date du déclin:</strong>
            <p>{{ selectedIntervention.dateRefus | date:'dd/MM/yyyy à HH:mm' }}</p>
          </div>
        </div>

        <!-- Masquer les boutons d'action si l'intervention est déclinée -->
        <footer class="modal-footer" *ngIf="selectedIntervention?.statut !== 'ANNULEE'">
          <button type="button" class="secondary-btn" (click)="refuserIntervention()">
            Décliner l'intervention
          </button>

          <button type="button" class="primary-btn" (click)="accepterIntervention()">
            Accepter l'intervention et démarrer
          </button>
        </footer>

        <!-- Bouton Fermer uniquement si déclinée -->
        <footer class="modal-footer" *ngIf="selectedIntervention?.statut === 'ANNULEE'">
          <button type="button" class="secondary-btn" (click)="closeModals()">
            Fermer
          </button>
        </footer>
      </section>

      <!-- MODALE REFUS -->
"@

if ($htmlContent -match [regex]::Escape($oldFooter1)) {
    $htmlContent = $htmlContent -replace [regex]::Escape($oldFooter1), $newFooter1
    Write-Host "✅ Footer de la modale de décision modifié" -ForegroundColor Green
} else {
    Write-Host "⚠️  Footer de la modale de décision non trouvé (peut-être déjà modifié)" -ForegroundColor Yellow
}

# Remplacer le footer de la modale d'édition
$oldFooter2 = @"
        <footer class="modal-footer">
          <button type="button" class="secondary-btn" (click)="closeModals()">Fermer</button>

          <button
            type="button"
            class="primary-btn"
            (click)="terminerIntervention()"
            [disabled]="!updateNote || !updateNote.trim()"
            *ngIf="selectedIntervention?.statut !== 'TERMINEE'"
          >
            Terminer l'intervention
          </button>
        </footer>
      </section>
"@

$newFooter2 = @"
        <!-- Masquer les boutons d'action si l'intervention est déclinée -->
        <footer class="modal-footer" *ngIf="selectedIntervention?.statut !== 'ANNULEE'">
          <button type="button" class="secondary-btn" (click)="closeModals()">Fermer</button>

          <button
            type="button"
            class="primary-btn"
            (click)="terminerIntervention()"
            [disabled]="!updateNote || !updateNote.trim()"
            *ngIf="selectedIntervention?.statut !== 'TERMINEE'"
          >
            Terminer l'intervention
          </button>
        </footer>

        <!-- Bouton Fermer uniquement si déclinée -->
        <footer class="modal-footer" *ngIf="selectedIntervention?.statut === 'ANNULEE'">
          <button type="button" class="secondary-btn" (click)="closeModals()">
            Fermer
          </button>
        </footer>
      </section>
"@

if ($htmlContent -match [regex]::Escape($oldFooter2)) {
    $htmlContent = $htmlContent -replace [regex]::Escape($oldFooter2), $newFooter2
    Write-Host "✅ Footer de la modale d'édition modifié" -ForegroundColor Green
} else {
    Write-Host "⚠️  Footer de la modale d'édition non trouvé (peut-être déjà modifié)" -ForegroundColor Yellow
}

# Sauvegarder le HTML
[System.IO.File]::WriteAllText((Resolve-Path $htmlFile).Path, $htmlContent, [System.Text.Encoding]::UTF8)
Write-Host "✅ Fichier HTML sauvegardé" -ForegroundColor Green

# 2. Ajouter les styles CSS
Write-Host "`n🎨 Ajout des styles CSS..." -ForegroundColor Yellow

$scssContent = Get-Content $scssFile -Raw -Encoding UTF8

$newStyles = @"

// Styles pour les interventions déclinées
.declined-info-box {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #fef3c7;
  border-left: 4px solid #f59e0b;
  border-radius: 0.5rem;
}

.alert-info-box {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
  
  .material-icons {
    color: #f59e0b;
    font-size: 1.5rem;
  }
  
  strong {
    display: block;
    color: #92400e;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  
  p {
    color: #78350f;
    font-size: 0.875rem;
    margin: 0;
  }
}

.info-detail-row {
  margin: 0.75rem 0;
  padding: 0.75rem;
  background: white;
  border-radius: 0.375rem;
  
  strong {
    display: block;
    color: #374151;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }
  
  p {
    color: #6b7280;
    font-size: 0.875rem;
    margin: 0;
  }
}
"@

if ($scssContent -notmatch "declined-info-box") {
    $scssContent += $newStyles
    [System.IO.File]::WriteAllText((Resolve-Path $scssFile).Path, $scssContent, [System.Text.Encoding]::UTF8)
    Write-Host "✅ Styles CSS ajoutés" -ForegroundColor Green
} else {
    Write-Host "⚠️  Styles CSS déjà présents" -ForegroundColor Yellow
}

# 3. Vérifier que le modèle Intervention a les bons champs
Write-Host "`n🔍 Vérification du modèle TypeScript..." -ForegroundColor Yellow

$tsContent = Get-Content $tsFile -Raw -Encoding UTF8

if ($tsContent -match "raisonRefus" -and $tsContent -match "dateRefus") {
    Write-Host "✅ Le modèle Intervention contient déjà les champs nécessaires" -ForegroundColor Green
} else {
    Write-Host "⚠️  Le modèle Intervention ne contient pas les champs raisonRefus/dateRefus" -ForegroundColor Yellow
    Write-Host "   Ajout des champs au modèle Intervention..." -ForegroundColor Yellow
    
    # Trouver l'interface Intervention et ajouter les champs
    $interventionPattern = "interface Intervention \{[^}]+\}"
    if ($tsContent -match $interventionPattern) {
        $interventionBlock = $Matches[0]
        
        # Ajouter les champs avant la dernière accolade
        $newInterventionBlock = $interventionBlock -replace "\}", @"
  raisonRefus?: string; // Raison du déclin
  dateRefus?: Date; // Date du déclin
  technicienNom?: string; // Nom du technicien qui a décliné
}
"@
        
        $tsContent = $tsContent -replace [regex]::Escape($interventionBlock), $newInterventionBlock
        [System.IO.File]::WriteAllText((Resolve-Path $tsFile).Path, $tsContent, [System.Text.Encoding]::UTF8)
        Write-Host "✅ Champs ajoutés au modèle Intervention" -ForegroundColor Green
    } else {
        Write-Host "❌ Interface Intervention non trouvée" -ForegroundColor Red
    }
}

Write-Host "`n✅ Modifications terminées!" -ForegroundColor Green
Write-Host "`n📋 Résumé des modifications:" -ForegroundColor Cyan
Write-Host "  1. ✅ Modale de décision: affiche les infos de déclin si statut = ANNULEE" -ForegroundColor White
Write-Host "  2. ✅ Modale de décision: masque les boutons si statut = ANNULEE" -ForegroundColor White
Write-Host "  3. ✅ Modale d'édition: masque les boutons si statut = ANNULEE" -ForegroundColor White
Write-Host "  4. ✅ Styles CSS ajoutés pour l'affichage des infos de déclin" -ForegroundColor White
Write-Host "  5. ✅ Modèle Intervention vérifié/mis à jour" -ForegroundColor White

Write-Host "`n🧪 Prochaines étapes:" -ForegroundColor Cyan
Write-Host "  1. Tester en déclinant une intervention" -ForegroundColor White
Write-Host "  2. Vérifier que l'intervention n'apparaît plus dans 'À faire'" -ForegroundColor White
Write-Host "  3. Vérifier que l'intervention apparaît dans 'Toutes' et 'Déclinées'" -ForegroundColor White
Write-Host "  4. Ouvrir la modale et vérifier l'affichage en lecture seule" -ForegroundColor White
