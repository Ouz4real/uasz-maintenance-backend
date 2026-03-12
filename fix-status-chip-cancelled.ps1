# Script pour ajouter le style .status-chip.cancelled dans le SCSS du technicien

$file = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.scss"

# Lire le contenu
$content = Get-Content $file -Raw

# Remplacer toutes les occurrences de .status-chip.done suivies de } par .status-chip.done + .status-chip.cancelled
$pattern = '(\.status-chip\.done \{[^}]+\})'
$replacement = '$1

.status-chip.cancelled {
  background: #fee2e2;
  color: #991b1b;
}'

# Vérifier si le style existe déjà
if ($content -notmatch '\.status-chip\.cancelled') {
    $content = $content -replace $pattern, $replacement
    
    # Sauvegarder
    $content | Set-Content $file -NoNewline
    
    Write-Host "✅ Style .status-chip.cancelled ajouté avec succès!" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Le style .status-chip.cancelled existe déjà" -ForegroundColor Yellow
}
