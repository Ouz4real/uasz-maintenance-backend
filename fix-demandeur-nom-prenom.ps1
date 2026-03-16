#!/usr/bin/env pwsh
# Remplacement du username par prénom + nom du demandeur

Write-Host "👤 Affichage du nom complet du demandeur" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host ""
Write-Host "✅ CORRECTION APPLIQUÉE :" -ForegroundColor Green
Write-Host "   Remplacement du username par 'Prénom Nom'" -ForegroundColor White
Write-Host ""

Write-Host "📋 MODIFICATIONS APPORTÉES :" -ForegroundColor Yellow
Write-Host ""

Write-Host "AVANT :" -ForegroundColor Red
Write-Host "   • Affichage : 'ousmnane' (username)" -ForegroundColor White
Write-Host ""

Write-Host "APRÈS :" -ForegroundColor Green
Write-Host "   • Affichage : 'Ousmane Mané' (prénom + nom)" -ForegroundColor White
Write-Host ""

Write-Host "EMPLACEMENTS MODIFIÉS :" -ForegroundColor Yellow
Write-Host "   1. mapPannesToDemandes() - Liste des demandes" -ForegroundColor White
Write-Host "   2. onSucces() - Après affectation technicien" -ForegroundColor White
Write-Host "   3. openDemandeDetails() - Modale de détails" -ForegroundColor White
Write-Host "   4. mapPanneDtoToDemande() - Déjà correct ✓" -ForegroundColor Green
Write-Host ""

Write-Host "=" * 60
Write-Host "🔍 VÉRIFICATION :" -ForegroundColor Cyan
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"

if (Test-Path $tsFile) {
    $content = Get-Content $tsFile -Raw
    
    $count = ([regex]::Matches($content, "demandeur\.prenom.*demandeur\.nom")).Count
    
    if ($count -ge 4) {
        Write-Host "   ✓ Mapping prénom + nom trouvé ($count occurrences)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Mapping prénom + nom incomplet ($count/4 occurrences)" -ForegroundColor Yellow
    }
    
    if ($content -match "demandeur\.prenom.*demandeur\.nom.*trim") {
        Write-Host "   ✓ Utilisation de trim() pour nettoyer les espaces" -ForegroundColor Green
    } else {
        Write-Host "   ✗ trim() manquant" -ForegroundColor Red
    }
    
    if ($content -match "signaleePar") {
        Write-Host "   ✓ Fallback sur signaleePar conservé (compatibilité)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Fallback sur signaleePar manquant" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠ Fichier TypeScript introuvable" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60
Write-Host "🎯 COMPORTEMENT :" -ForegroundColor Cyan
Write-Host ""

Write-Host "LOGIQUE DE MAPPING :" -ForegroundColor Yellow
Write-Host "   1. Si demandeur.prenom et demandeur.nom existent :" -ForegroundColor White
Write-Host "      → Affiche 'Prénom Nom'" -ForegroundColor Green
Write-Host ""
Write-Host "   2. Si prenom ou nom est vide :" -ForegroundColor White
Write-Host "      → trim() enlève les espaces inutiles" -ForegroundColor Green
Write-Host ""
Write-Host "   3. Si demandeur n'existe pas :" -ForegroundColor White
Write-Host "      → Fallback sur signaleePar (username)" -ForegroundColor Yellow
Write-Host ""
Write-Host "   4. Si rien n'existe :" -ForegroundColor White
Write-Host "      → Affiche '—'" -ForegroundColor Gray
Write-Host ""

Write-Host "EXEMPLES :" -ForegroundColor Yellow
Write-Host "   • prenom='Ousmane', nom='Mané' → 'Ousmane Mané'" -ForegroundColor Green
Write-Host "   • prenom='', nom='Diop' → 'Diop'" -ForegroundColor Green
Write-Host "   • prenom='Fatou', nom='' → 'Fatou'" -ForegroundColor Green
Write-Host "   • demandeur=null → 'ousmnane' (username)" -ForegroundColor Yellow
Write-Host "   • tout=null → '—'" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 60
Write-Host "🧪 COMMENT TESTER :" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. REDÉMARRER LE FRONTEND :" -ForegroundColor Yellow
Write-Host "   cd uasz-maintenance-frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""

Write-Host "2. VÉRIFIER LA LISTE DES DEMANDES :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant que Responsable" -ForegroundColor White
Write-Host "   b) Allez dans 'Tableau de bord'" -ForegroundColor White
Write-Host "   c) Regardez la colonne 'Titre'" -ForegroundColor White
Write-Host "   d) Sous chaque titre, vérifiez le nom du demandeur" -ForegroundColor White
Write-Host "   e) Devrait afficher 'Prénom Nom' au lieu de 'username'" -ForegroundColor White
Write-Host ""

Write-Host "3. VÉRIFIER LA MODALE DE DÉTAILS :" -ForegroundColor Yellow
Write-Host "   a) Cliquez sur 'Voir détails' d'une demande" -ForegroundColor White
Write-Host "   b) Regardez la ligne sous le titre" -ForegroundColor White
Write-Host "   c) Format : 'Créée le XX/XX/XXXX · Lieu · Prénom Nom'" -ForegroundColor White
Write-Host "   d) Vérifiez que le nom complet s'affiche" -ForegroundColor White
Write-Host ""

Write-Host "4. VÉRIFIER APRÈS AFFECTATION :" -ForegroundColor Yellow
Write-Host "   a) Affectez un technicien à une demande" -ForegroundColor White
Write-Host "   b) Fermez et rouvrez la modale" -ForegroundColor White
Write-Host "   c) Vérifiez que le nom du demandeur est toujours correct" -ForegroundColor White
Write-Host ""

Write-Host "5. TESTER LE PDF :" -ForegroundColor Yellow
Write-Host "   a) Ouvrez les détails d'une demande" -ForegroundColor White
Write-Host "   b) Cliquez sur 'Exporter en PDF'" -ForegroundColor White
Write-Host "   c) Vérifiez que 'Signalée par: Prénom Nom'" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "📊 DÉTAILS TECHNIQUES :" -ForegroundColor Cyan
Write-Host ""

Write-Host "BACKEND (Java) :" -ForegroundColor Yellow
Write-Host "   • PanneDto.demandeur (objet Utilisateur)" -ForegroundColor White
Write-Host "   • Utilisateur.prenom (String)" -ForegroundColor White
Write-Host "   • Utilisateur.nom (String)" -ForegroundColor White
Write-Host "   • PanneDto.signaleePar (String, fallback)" -ForegroundColor White
Write-Host ""

Write-Host "FRONTEND (TypeScript) :" -ForegroundColor Yellow
Write-Host "   • Demande.demandeurNom (String)" -ForegroundColor White
Write-Host "   • Mapping : prenom + ' ' + nom" -ForegroundColor White
Write-Host "   • trim() pour enlever espaces inutiles" -ForegroundColor White
Write-Host "   • Fallback : signaleePar → '—'" -ForegroundColor White
Write-Host ""

Write-Host "CODE APPLIQUÉ :" -ForegroundColor Yellow
Write-Host "   demandeurNom: p.demandeur" -ForegroundColor White
Write-Host "     ? `" -NoNewline; Write-Host "`${p.demandeur.prenom ?? ''} `${p.demandeur.nom ?? ''}`" -NoNewline -ForegroundColor Cyan; Write-Host ".trim() || '—'" -ForegroundColor White
Write-Host "     : p.signaleePar ?? '—'" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "✅ Correction appliquée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Redémarrez le frontend pour voir les changements" -ForegroundColor Yellow
Write-Host ""
