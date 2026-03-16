# Script pour ajouter la section "Informations de déclin" dans la modale - Version 2

$filePath = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html"

# Lire le contenu du fichier
$content = Get-Content $filePath -Raw -Encoding UTF8

# Rechercher la ligne avec "Voulez-vous prendre en charge" et insérer avant
$lines = $content -split "`r?`n"
$newLines = @()
$inserted = $false

for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    
    # Si on trouve la ligne avec "Voulez-vous prendre en charge", on insère la section avant
    if ($line -match "Voulez-vous prendre en charge cette intervention" -and !$inserted) {
        # Ajouter la section "Informations de déclin"
        $newLines += ""
        $newLines += "          <!-- Informations de déclin (si déclinée) -->"
        $newLines += "          <div class=""modal-section"" *ngIf=""selectedIntervention.statut === 'DECLINEE'"">"
        $newLines += "            <h4>Informations de déclin</h4>"
        $newLines += "            "
        $newLines += "            <div class=""decline-info-box"">"
        $newLines += "              <div class=""decline-info-row"" *ngIf=""selectedIntervention.dateRefus"">"
        $newLines += "                <span class=""decline-label"">Date du déclin :</span>"
        $newLines += "                <span class=""decline-value"">{{ selectedIntervention.dateRefus | date:'dd/MM/yyyy à HH:mm' }}</span>"
        $newLines += "              </div>"
        $newLines += "              "
        $newLines += "              <div class=""decline-info-row"" *ngIf=""selectedIntervention.technicienNom"">"
        $newLines += "                <span class=""decline-label"">Décliné par :</span>"
        $newLines += "                <span class=""decline-value"">{{ selectedIntervention.technicienNom }}</span>"
        $newLines += "              </div>"
        $newLines += "              "
        $newLines += "              <div class=""decline-info-row"" *ngIf=""selectedIntervention.raisonRefus"">"
        $newLines += "                <span class=""decline-label"">Raison du déclin :</span>"
        $newLines += "                <p class=""decline-reason"">{{ selectedIntervention.raisonRefus }}</p>"
        $newLines += "              </div>"
        $newLines += "              "
        $newLines += "              <div *ngIf=""!selectedIntervention.raisonRefus && !selectedIntervention.dateRefus"">"
        $newLines += "                <p class=""modal-help"" style=""color: #6b7280; font-style: italic;"">"
        $newLines += "                  Aucune information de déclin disponible."
        $newLines += "                </p>"
        $newLines += "              </div>"
        $newLines += "            </div>"
        $newLines += "          </div>"
        $newLines += ""
        $inserted = $true
    }
    
    $newLines += $line
}

# Écrire le nouveau contenu
$newContent = $newLines -join "`n"
Set-Content $filePath -Value $newContent -Encoding UTF8

if ($inserted) {
    Write-Host "✅ Section 'Informations de déclin' ajoutée avec succès dans la modale"
} else {
    Write-Host "❌ Ligne cible non trouvée"
}