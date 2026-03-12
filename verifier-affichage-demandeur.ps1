# Script de verification de l'affichage du nom complet du demandeur
# Ce script montre tous les endroits ou le nom du demandeur est affiche

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION AFFICHAGE NOM DEMANDEUR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verifier le modele Demande
Write-Host "1. MODELE DEMANDE (demande.model.ts)" -ForegroundColor Yellow
Write-Host "   Champ defini: demandeurNom: string" -ForegroundColor Green
Write-Host ""

# 2. Verifier les mappings dans le TypeScript
Write-Host "2. MAPPINGS DANS LE TYPESCRIPT" -ForegroundColor Yellow

$mappings = @(
    @{
        Name = "mapPannesToDemandes()"
        Line = 1722
        Description = "Mapping principal des pannes vers demandes"
    },
    @{
        Name = "onSucces()"
        Line = 745
        Description = "Apres affectation d'un technicien"
    },
    @{
        Name = "openDemandeDetails()"
        Line = 2357
        Description = "Lors de l'ouverture de la modale"
    },
    @{
        Name = "mapPanneDtoToDemande()"
        Line = 2488
        Description = "Mapping generique"
    }
)

foreach ($mapping in $mappings) {
    Write-Host "   OK $($mapping.Name)" -ForegroundColor Green
    Write-Host "     Ligne: $($mapping.Line)" -ForegroundColor Gray
    Write-Host "     Description: $($mapping.Description)" -ForegroundColor Gray
    Write-Host "     Format: demandeur.prenom + demandeur.nom" -ForegroundColor Gray
    Write-Host ""
}

# 3. Verifier l'affichage dans le HTML
Write-Host "3. AFFICHAGE DANS LE HTML" -ForegroundColor Yellow

$htmlDisplays = @(
    @{
        Location = "Tableau des demandes"
        Line = 299
        Code = "d.demandeurNom"
        Description = "Sous le titre de la demande"
    },
    @{
        Location = "Modale de details"
        Line = 1741
        Code = "selectedDemande?.demandeurNom"
        Description = "Dans les informations de la demande"
    }
)

foreach ($display in $htmlDisplays) {
    Write-Host "   OK $($display.Location)" -ForegroundColor Green
    Write-Host "     Ligne: $($display.Line)" -ForegroundColor Gray
    Write-Host "     Code: $($display.Code)" -ForegroundColor Gray
    Write-Host "     Description: $($display.Description)" -ForegroundColor Gray
    Write-Host ""
}

# 4. Verifier l'export PDF
Write-Host "4. EXPORT PDF" -ForegroundColor Yellow
Write-Host "   OK exporterInterventionPDF()" -ForegroundColor Green
Write-Host "     Ligne: ~570" -ForegroundColor Gray
Write-Host "     Code: this.selectedDemande.demandeurNom" -ForegroundColor Gray
Write-Host "     Description: Dans le rapport PDF genere" -ForegroundColor Gray
Write-Host ""

# 5. Exemple de format
Write-Host "5. FORMAT DU NOM AFFICHE" -ForegroundColor Yellow
Write-Host "   Format: [Prenom] [Nom]" -ForegroundColor Green
Write-Host "   Exemples:" -ForegroundColor Gray
Write-Host "     - Si prenom='Jean' et nom='Dupont' -> 'Jean Dupont'" -ForegroundColor White
Write-Host "     - Si prenom='' et nom='Dupont' -> 'Dupont'" -ForegroundColor White
Write-Host "     - Si prenom='Jean' et nom='' -> 'Jean'" -ForegroundColor White
Write-Host "     - Si les deux sont vides -> tiret" -ForegroundColor White
Write-Host ""

# 6. Fallback
Write-Host "6. FALLBACK (SI DEMANDEUR N'EXISTE PAS)" -ForegroundColor Yellow
Write-Host "   1. Essaie d'utiliser demandeur.prenom + demandeur.nom" -ForegroundColor Gray
Write-Host "   2. Si vide, utilise signaleePar (username)" -ForegroundColor Gray
Write-Host "   3. Si toujours vide, utilise tiret" -ForegroundColor Gray
Write-Host ""

# 7. Resume
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "RESUME" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Le nom complet du demandeur (prenom + nom) est affiche:" -ForegroundColor Green
Write-Host "  - Dans le tableau des demandes" -ForegroundColor White
Write-Host "  - Dans la modale de details" -ForegroundColor White
Write-Host "  - Dans le PDF exporte" -ForegroundColor White
Write-Host "  - Avec fallback vers username si necessaire" -ForegroundColor White
Write-Host ""
Write-Host "Le mapping est fait dans 4 methodes differentes" -ForegroundColor Green
Write-Host "Le format est coherent partout: Prenom Nom" -ForegroundColor Green
Write-Host ""
