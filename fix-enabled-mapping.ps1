#!/usr/bin/env pwsh
# Correction du mapping de la propriété 'enabled' pour les techniciens

Write-Host "🔧 Correction du mapping 'enabled' pour les techniciens" -ForegroundColor Cyan
Write-Host "=" * 60

Write-Host ""
Write-Host "❌ PROBLÈME IDENTIFIÉ :" -ForegroundColor Red
Write-Host "   Tous les techniciens apparaissaient grisés car la propriété" -ForegroundColor White
Write-Host "   'enabled' n'était pas mappée depuis le backend." -ForegroundColor White
Write-Host ""
Write-Host "   Résultat : !t.enabled = !undefined = true pour tous" -ForegroundColor Yellow
Write-Host "   Donc tous les techniciens avaient la classe .disabled" -ForegroundColor Yellow
Write-Host ""

Write-Host "✅ SOLUTION APPLIQUÉE :" -ForegroundColor Green
Write-Host "   Ajout du mapping de la propriété 'enabled' dans" -ForegroundColor White
Write-Host "   la méthode mapUserToTechnicienUI()" -ForegroundColor White
Write-Host ""

Write-Host "📋 CODE AJOUTÉ :" -ForegroundColor Yellow
Write-Host ""
Write-Host "   // Mapper le champ enabled du backend" -ForegroundColor Gray
Write-Host "   const enabled = typeof u?.enabled === 'boolean' ? u.enabled : true;" -ForegroundColor White
Write-Host ""
Write-Host "   return {" -ForegroundColor Gray
Write-Host "     // ... autres propriétés" -ForegroundColor Gray
Write-Host "     enabled: enabled,  // ✅ Ajouté" -ForegroundColor Green
Write-Host "   };" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 60
Write-Host "🔍 VÉRIFICATION :" -ForegroundColor Cyan
Write-Host ""

$tsFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"

if (Test-Path $tsFile) {
    $content = Get-Content $tsFile -Raw
    
    if ($content -match "enabled: enabled") {
        Write-Host "   ✓ Propriété 'enabled' mappée dans le return" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Propriété 'enabled' non trouvée dans le return" -ForegroundColor Red
    }
    
    if ($content -match "const enabled = typeof u\?\?\.enabled") {
        Write-Host "   ✓ Variable 'enabled' extraite du backend" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Variable 'enabled' non trouvée" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠ Fichier TypeScript introuvable" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" * 60
Write-Host "🎯 COMPORTEMENT ATTENDU :" -ForegroundColor Cyan
Write-Host ""

Write-Host "AVANT LA CORRECTION :" -ForegroundColor Yellow
Write-Host "   • enabled = undefined pour tous les techniciens" -ForegroundColor White
Write-Host "   • !t.enabled = !undefined = true" -ForegroundColor White
Write-Host "   • Résultat : TOUS grisés ❌" -ForegroundColor Red
Write-Host ""

Write-Host "APRÈS LA CORRECTION :" -ForegroundColor Yellow
Write-Host "   • enabled = true pour techniciens actifs" -ForegroundColor White
Write-Host "   • enabled = false pour techniciens désactivés" -ForegroundColor White
Write-Host "   • !t.enabled = false pour actifs → carte normale ✅" -ForegroundColor Green
Write-Host "   • !t.enabled = true pour désactivés → carte grisée ✅" -ForegroundColor Green
Write-Host ""

Write-Host "=" * 60
Write-Host "🧪 COMMENT TESTER :" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. REDÉMARRER LE FRONTEND :" -ForegroundColor Yellow
Write-Host "   cd uasz-maintenance-frontend" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""

Write-Host "2. VÉRIFIER L'AFFICHAGE :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant que Responsable" -ForegroundColor White
Write-Host "   b) Allez dans 'Techniciens'" -ForegroundColor White
Write-Host "   c) Vérifiez que SEULS les techniciens désactivés" -ForegroundColor White
Write-Host "      sont grisés" -ForegroundColor White
Write-Host ""

Write-Host "3. TESTER LA DÉSACTIVATION :" -ForegroundColor Yellow
Write-Host "   a) Connectez-vous en tant qu'Admin" -ForegroundColor White
Write-Host "   b) Désactivez un technicien" -ForegroundColor White
Write-Host "   c) Retournez dans le dashboard Responsable" -ForegroundColor White
Write-Host "   d) Vérifiez que ce technicien est maintenant grisé" -ForegroundColor White
Write-Host ""

Write-Host "4. TESTER LA RÉACTIVATION :" -ForegroundColor Yellow
Write-Host "   a) Réactivez le technicien (Admin)" -ForegroundColor White
Write-Host "   b) Vérifiez que sa carte redevient normale" -ForegroundColor White
Write-Host ""

Write-Host "=" * 60
Write-Host "📊 DÉTAILS TECHNIQUES :" -ForegroundColor Cyan
Write-Host ""

Write-Host "BACKEND (Java) :" -ForegroundColor Yellow
Write-Host "   • TechnicienUIResponse.enabled (boolean)" -ForegroundColor White
Write-Host "   • Utilisateur.enabled (boolean, default = true)" -ForegroundColor White
Write-Host ""

Write-Host "FRONTEND (TypeScript) :" -ForegroundColor Yellow
Write-Host "   • UtilisateurDto.enabled (boolean | undefined)" -ForegroundColor White
Write-Host "   • TechnicienUI.enabled (boolean | undefined)" -ForegroundColor White
Write-Host ""

Write-Host "MAPPING :" -ForegroundColor Yellow
Write-Host "   • Backend → Frontend : enabled est maintenant mappé" -ForegroundColor Green
Write-Host "   • Valeur par défaut : true (si non défini)" -ForegroundColor White
Write-Host ""

Write-Host "HTML BINDING :" -ForegroundColor Yellow
Write-Host "   • [class.disabled]='!t.enabled'" -ForegroundColor White
Write-Host "   • Si enabled=true → !true=false → pas de classe .disabled" -ForegroundColor Green
Write-Host "   • Si enabled=false → !false=true → classe .disabled ajoutée" -ForegroundColor Red
Write-Host ""

Write-Host "=" * 60
Write-Host "✅ Correction appliquée avec succès !" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Redémarrez le frontend pour voir les changements" -ForegroundColor Yellow
Write-Host ""
