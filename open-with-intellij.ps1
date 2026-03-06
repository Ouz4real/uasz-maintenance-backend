# Script pour ouvrir le projet avec IntelliJ IDEA

Write-Host "🚀 Ouverture du projet avec IntelliJ IDEA..." -ForegroundColor Cyan
Write-Host ""

$projectPath = Get-Location

# Chemins possibles d'IntelliJ IDEA
$intellijPaths = @(
    "C:\Program Files\JetBrains\IntelliJ IDEA Community Edition*\bin\idea64.exe",
    "C:\Program Files\JetBrains\IntelliJ IDEA*\bin\idea64.exe",
    "C:\Program Files (x86)\JetBrains\IntelliJ IDEA*\bin\idea64.exe",
    "$env:LOCALAPPDATA\JetBrains\Toolbox\apps\IDEA-U\*\bin\idea64.exe",
    "$env:LOCALAPPDATA\JetBrains\Toolbox\apps\IDEA-C\*\bin\idea64.exe"
)

$intellijExe = $null

foreach ($path in $intellijPaths) {
    $found = Get-ChildItem -Path $path -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $intellijExe = $found.FullName
        break
    }
}

if ($intellijExe) {
    Write-Host "✅ IntelliJ IDEA trouvé: $intellijExe" -ForegroundColor Green
    Write-Host ""
    Write-Host "📂 Ouverture du projet: $projectPath" -ForegroundColor Yellow
    Write-Host ""
    
    Start-Process -FilePath $intellijExe -ArgumentList $projectPath
    
    Write-Host "✅ IntelliJ IDEA lancé!" -ForegroundColor Green
    Write-Host ""
    Write-Host "⏳ Attendez que le projet s'ouvre et que l'indexation se termine..." -ForegroundColor Yellow
} else {
    Write-Host "❌ IntelliJ IDEA non trouvé!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Veuillez ouvrir IntelliJ IDEA manuellement et:" -ForegroundColor Yellow
    Write-Host "  1. Cliquez sur File → Open" -ForegroundColor White
    Write-Host "  2. Sélectionnez le dossier: $projectPath" -ForegroundColor White
    Write-Host "  3. Cliquez sur OK" -ForegroundColor White
}
