# Script pour vérifier les erreurs de template Angular

Write-Output "🔍 Vérification des erreurs de template Angular..."

# Essayer une compilation rapide pour détecter les erreurs de template
$result = & npx ng build --configuration development --no-optimization --source-map=false --build-optimizer=false 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Output "✅ Aucune erreur de template détectée !"
} else {
    Write-Output "❌ Erreurs détectées :"
    Write-Output $result
}

Write-Output "📊 Résumé de la vérification terminé."