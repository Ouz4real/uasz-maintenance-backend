# Script pour corriger l'affichage des *ngIf dans la modale

$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"

Write-Host "Correction des *ngIf mal placés..." -ForegroundColor Cyan

$content = Get-Content $htmlFile -Raw -Encoding UTF8

# Corriger le <p class="modal-help"> avec *ngIf mal placé
$content = $content -replace '<p class="modal-help">\s*\*ngIf="selectedIntervention\.statut === ''A_FAIRE''">Voulez-vous prendre en charge', '<p class="modal-help" *ngIf="selectedIntervention.statut === ''A_FAIRE''">Voulez-vous prendre en charge'

# Corriger le <footer> avec *ngIf mal placé
$content = $content -replace '<footer class="modal-footer">\s*\*ngIf="selectedIntervention\.statut === ''A_FAIRE''"><button', '<footer class="modal-footer" *ngIf="selectedIntervention.statut === ''A_FAIRE''"><button'

# Corriger les footers imbriqués (fermer le premier footer correctement)
$content = $content -replace '(Accepter l''intervention et démarrer\s*</button>)\s*(<footer class="modal-footer" \*ngIf="selectedIntervention\.statut === ''DECLINEE'">)', '$1</footer>$2'

# Supprimer le </footer> en trop à la fin
$content = $content -replace '(Fermer\s*</button>\s*</footer>)</footer>', '$1'

# Sauvegarder
$content | Out-File $htmlFile -Encoding UTF8 -NoNewline

Write-Host "✅ Corrections appliquées!" -ForegroundColor Green
Write-Host ""
Write-Host "Les *ngIf sont maintenant correctement placés dans les attributs des balises." -ForegroundColor White
