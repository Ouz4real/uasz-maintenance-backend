# Script pour ajouter les colonnes raison_refus et date_refus à la table pannes
# Ces colonnes permettent de stocker la raison du refus séparément du commentaire interne

Write-Host "🔧 Ajout des colonnes raison_refus et date_refus..." -ForegroundColor Cyan

# Exécuter le script SQL
psql -U postgres -d uasz_maintenance -f add-raison-refus-columns.sql

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Colonnes ajoutées avec succès!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Prochaines étapes:" -ForegroundColor Yellow
    Write-Host "  1. Redémarrer le backend (mvn spring-boot:run)"
    Write-Host "  2. Tester le refus d'une intervention"
    Write-Host "  3. Vérifier que la raison n'apparaît plus dans 'Commentaire interne'"
    Write-Host "  4. Vérifier que la raison apparaît dans la notification"
} else {
    Write-Host "❌ Erreur lors de l'ajout des colonnes" -ForegroundColor Red
    Write-Host "Vérifiez que PostgreSQL est démarré et que la base existe" -ForegroundColor Yellow
}
