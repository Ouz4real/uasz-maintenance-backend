# Script pour modifier la modale de refus - Version 2

$file = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"

Write-Host "🔧 Modification de la modale de refus..." -ForegroundColor Cyan

# Lire toutes les lignes
$lines = Get-Content $file

# Trouver la ligne avec "Confirmez-vous cette action ?"
$targetLineIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "Confirmez-vous cette action") {
        $targetLineIndex = $i
        break
    }
}

if ($targetLineIndex -eq -1) {
    Write-Host "❌ Ligne cible non trouvée!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Ligne trouvée à l'index $targetLineIndex" -ForegroundColor Green

# Créer le nouveau contenu
$newLines = @()

# Copier tout jusqu'à la ligne cible (incluse)
for ($i = 0; $i -lt $targetLineIndex; $i++) {
    $newLines += $lines[$i]
}

# Remplacer "Confirmez-vous cette action ?" par "Veuillez indiquer la raison du refus."
$newLines += $lines[$targetLineIndex] -replace "Confirmez-vous cette action \?", "Veuillez indiquer la raison du refus."

# Ajouter le nouveau champ textarea
$newLines += "          "
$newLines += "          <!-- 🆕 Champ de raison du refus -->"
$newLines += "          <div class=`"form-group`" style=`"margin-top: 1rem;`">"
$newLines += "            <label for=`"raisonRefus`">Raison du refus <span style=`"color: #ef4444;`">*</span></label>"
$newLines += "            <textarea"
$newLines += "              id=`"raisonRefus`""
$newLines += "              [(ngModel)]=`"raisonRefus`""
$newLines += "              placeholder=`"Expliquez pourquoi vous refusez cette intervention (minimum 10 caractères)...`""
$newLines += "              rows=`"4`""
$newLines += "              style=`"width: 100%; padding: 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-family: inherit; resize: vertical;`""
$newLines += "            ></textarea>"
$newLines += "            <small style=`"color: #6b7280; display: block; margin-top: 0.25rem;`">"
$newLines += "              {{ raisonRefus.length }} / 500 caractères"
$newLines += "            </small>"
$newLines += "          </div>"

# Sauter la ligne "</p>" qui suit
$i = $targetLineIndex + 1
while ($i -lt $lines.Count -and $lines[$i] -notmatch "</p>") {
    $i++
}
$i++ # Sauter le </p>

# Copier le reste jusqu'au bouton "Confirmer le refus"
while ($i -lt $lines.Count) {
    if ($lines[$i] -match "Confirmer le refus") {
        # Modifier le bouton pour ajouter [disabled]
        $newLines += "          <button "
        $newLines += "            type=`"button`" "
        $newLines += "            class=`"primary-btn danger`" "
        $newLines += "            (click)=`"confirmRefuse()`""
        $newLines += "            [disabled]=`"!raisonRefus || raisonRefus.trim().length < 10`""
        $newLines += "          >"
        $newLines += "            Confirmer le refus"
        
        # Sauter les lignes du bouton original
        $i++
        while ($i -lt $lines.Count -and $lines[$i] -notmatch "</button>") {
            $i++
        }
        $newLines += $lines[$i] # Ajouter </button>
        $i++
        break
    }
    $newLines += $lines[$i]
    $i++
}

# Copier le reste du fichier
while ($i -lt $lines.Count) {
    $newLines += $lines[$i]
    $i++
}

# Sauvegarder
$newLines | Set-Content $file

Write-Host "✅ Fichier modifié avec succès!" -ForegroundColor Green
Write-Host "📝 Vérifiez: $file" -ForegroundColor Cyan
