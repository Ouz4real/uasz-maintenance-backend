#!/usr/bin/env pwsh

# Fix TypeScript syntax errors in dashboard-responsable.component.ts

$filePath = "uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts"

Write-Host "Fixing TypeScript syntax errors in $filePath..."

# Read the file content
$content = Get-Content $filePath -Raw

# Fix missing quotes in console.log statements
$content = $content -replace 'console\.log\(🔍 DEBUG ([^:]+):', 'console.log(''🔍 DEBUG $1:'
$content = $content -replace 'console\.log\(([^''"][^,)]+),', 'console.log(''$1'','

# Fix method declarations that are outside class
# Remove any standalone method declarations that should be inside the class
$content = $content -replace '(?m)^}\s*\n\s*([a-zA-Z_][a-zA-Z0-9_]*\s*\([^)]*\)\s*:\s*[^{]+\{)', '}$1'

# Fix missing semicolons
$content = $content -replace '(?m)(\w+)\s*$', '$1;'

# Fix type annotations used as values
$content = $content -replace ': any\[\]', ': any[]'
$content = $content -replace ': string\[\]', ': string[]'

# Write the fixed content back
Set-Content $filePath $content -Encoding UTF8

Write-Host "Basic syntax fixes applied. Running TypeScript diagnostics..."

# Check if there are still errors
try {
    $errors = & npx tsc --noEmit --project uasz-maintenance-frontend/tsconfig.json 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ No TypeScript errors found!" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript errors still exist:" -ForegroundColor Red
        Write-Host $errors
    }
} catch {
    Write-Host "Could not run TypeScript compiler. Please check manually." -ForegroundColor Yellow
}