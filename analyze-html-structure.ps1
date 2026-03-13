#!/usr/bin/env pwsh

Write-Host "=== ANALYSE DE LA STRUCTURE HTML ===" -ForegroundColor Green

$htmlFile = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html"

Write-Host "`n🔍 Recherche des balises <section> et </section>..." -ForegroundColor Yellow

# Compter les ouvertures et fermetures de sections
$openSections = (Select-String -Path $htmlFile -Pattern "<section" -AllMatches).Matches.Count
$closeSections = (Select-String -Path $htmlFile -Pattern "</section>" -AllMatches).Matches.Count

Write-Host "📊 Statistiques des balises section:" -ForegroundColor Cyan
Write-Host "  Ouvertures <section> : $openSections" -ForegroundColor White
Write-Host "  Fermetures </section> : $closeSections" -ForegroundColor White

if ($openSections -eq $closeSections) {
    Write-Host "  ✅ Nombre équilibré" -ForegroundColor Green
} else {
    Write-Host "  ❌ DÉSÉQUILIBRE DÉTECTÉ !" -ForegroundColor Red
    $diff = $closeSections - $openSections
    if ($diff -gt 0) {
        Write-Host "  → $diff fermeture(s) en trop" -ForegroundColor Red
    } else {
        Write-Host "  → $([Math]::Abs($diff)) ouverture(s) en trop" -ForegroundColor Red
    }
}

Write-Host "`n🔍 Analyse autour de la ligne 414..." -ForegroundColor Yellow

# Lire les lignes autour de 414
$lines = Get-Content $htmlFile
$startLine = [Math]::Max(0, 410 - 1)  # PowerShell arrays are 0-indexed
$endLine = [Math]::Min($lines.Length - 1, 420 - 1)

Write-Host "📄 Contenu lignes 410-420:" -ForegroundColor Cyan
for ($i = $startLine; $i -le $endLine; $i++) {
    $lineNum = $i + 1
    $line = $lines[$i]
    if ($lineNum -eq 414) {
        Write-Host "  $lineNum : $line" -ForegroundColor Red
    } else {
        Write-Host "  $lineNum : $line" -ForegroundColor White
    }
}

Write-Host "`n🔍 Recherche des sections non fermées..." -ForegroundColor Yellow

# Analyser la structure section par section
$sectionStack = @()
$lineNumber = 0

foreach ($line in $lines) {
    $lineNumber++
    
    if ($line -match '<section[^>]*>') {
        $sectionClass = ""
        if ($line -match 'class="([^"]*)"') {
            $sectionClass = $matches[1]
        }
        $sectionStack += @{Line = $lineNumber; Class = $sectionClass}
        
        if ($lineNumber -ge 410 -and $lineNumber -le 420) {
            Write-Host "  Ligne $lineNumber : OUVERTURE section '$sectionClass'" -ForegroundColor Green
        }
    }
    
    if ($line -match '</section>') {
        if ($sectionStack.Count -gt 0) {
            $lastSection = $sectionStack[-1]
            $sectionStack = $sectionStack[0..($sectionStack.Count - 2)]
            
            if ($lineNumber -ge 410 -and $lineNumber -le 420) {
                Write-Host "  Ligne $lineNumber : FERMETURE section '$($lastSection.Class)' (ouverte ligne $($lastSection.Line))" -ForegroundColor Blue
            }
        } else {
            Write-Host "  Ligne $lineNumber : ❌ FERMETURE SANS OUVERTURE !" -ForegroundColor Red
        }
    }
}

if ($sectionStack.Count -gt 0) {
    Write-Host "`n❌ Sections non fermées:" -ForegroundColor Red
    foreach ($section in $sectionStack) {
        Write-Host "  Ligne $($section.Line) : section '$($section.Class)'" -ForegroundColor Red
    }
} else {
    Write-Host "`n✅ Toutes les sections sont correctement fermées" -ForegroundColor Green
}

Write-Host "`n=== ANALYSE TERMINÉE ===" -ForegroundColor Green