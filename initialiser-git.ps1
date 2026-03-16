# Script pour initialiser Git et configurer le repository

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Initialisation Git" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier si Git est installé
Write-Host "1. Vérification de Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "   ✓ $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Git n'est pas installé!" -ForegroundColor Red
    Write-Host "   Installez Git depuis: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 2. Initialiser le repository
Write-Host "2. Initialisation du repository Git..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "   ℹ️  Repository Git déjà initialisé" -ForegroundColor Gray
} else {
    git init
    Write-Host "   ✓ Repository Git initialisé" -ForegroundColor Green
}
Write-Host ""

# 3. Configurer l'utilisateur (si pas déjà fait)
Write-Host "3. Configuration utilisateur..." -ForegroundColor Yellow
$userName = git config user.name
$userEmail = git config user.email

if (-not $userName) {
    Write-Host "   Entrez votre nom (ex: Jean Dupont):" -ForegroundColor Yellow
    $name = Read-Host "   Nom"
    git config user.name "$name"
    Write-Host "   ✓ Nom configuré: $name" -ForegroundColor Green
} else {
    Write-Host "   ✓ Nom: $userName" -ForegroundColor Green
}

if (-not $userEmail) {
    Write-Host "   Entrez votre email GitHub:" -ForegroundColor Yellow
    $email = Read-Host "   Email"
    git config user.email "$email"
    Write-Host "   ✓ Email configuré: $email" -ForegroundColor Green
} else {
    Write-Host "   ✓ Email: $userEmail" -ForegroundColor Green
}
Write-Host ""

# 4. Créer/Vérifier .gitignore
Write-Host "4. Configuration .gitignore..." -ForegroundColor Yellow
if (-not (Test-Path ".gitignore")) {
    Write-Host "   Création du fichier .gitignore..." -ForegroundColor Gray
    
    $gitignoreContent = @"
# Compiled class files
*.class
target/
*.jar
*.war
*.ear

# Log files
*.log

# IDE
.idea/
*.iml
.vscode/
*.swp
*.swo

# Node
node_modules/
dist/
.angular/

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db

# Temporary files
*.tmp
*.bak
*.swp
*~
"@
    
    Set-Content -Path ".gitignore" -Value $gitignoreContent
    Write-Host "   ✓ .gitignore créé" -ForegroundColor Green
} else {
    Write-Host "   ✓ .gitignore existe déjà" -ForegroundColor Green
}
Write-Host ""

# 5. Configurer le remote GitHub
Write-Host "5. Configuration du remote GitHub..." -ForegroundColor Yellow
Write-Host "   Entrez l'URL de votre repository GitHub" -ForegroundColor Gray
Write-Host "   (ex: https://github.com/username/repo.git)" -ForegroundColor Gray
Write-Host ""
$repoUrl = Read-Host "   URL du repository"

if ($repoUrl) {
    try {
        # Vérifier si le remote existe déjà
        $existingRemote = git remote get-url origin 2>$null
        if ($existingRemote) {
            Write-Host "   Remote 'origin' existe déjà: $existingRemote" -ForegroundColor Yellow
            Write-Host "   Voulez-vous le remplacer? (O/N)" -ForegroundColor Yellow
            $replace = Read-Host
            if ($replace -eq "O" -or $replace -eq "o") {
                git remote set-url origin $repoUrl
                Write-Host "   ✓ Remote 'origin' mis à jour" -ForegroundColor Green
            }
        } else {
            git remote add origin $repoUrl
            Write-Host "   ✓ Remote 'origin' ajouté" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Erreur lors de la configuration du remote" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️  Aucun remote configuré (vous pourrez le faire plus tard)" -ForegroundColor Yellow
}
Write-Host ""

# 6. Créer le premier commit (optionnel)
Write-Host "6. Premier commit..." -ForegroundColor Yellow
Write-Host "   Voulez-vous créer un commit initial? (O/N)" -ForegroundColor Yellow
$createCommit = Read-Host

if ($createCommit -eq "O" -or $createCommit -eq "o") {
    Write-Host "   Ajout des fichiers..." -ForegroundColor Gray
    git add .
    
    Write-Host "   Création du commit..." -ForegroundColor Gray
    git commit -m "Initial commit: Projet UASZ Maintenance"
    
    Write-Host "   ✓ Commit initial créé" -ForegroundColor Green
} else {
    Write-Host "   ⏭️  Commit initial ignoré" -ForegroundColor Gray
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Initialisation terminée!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "  1. Vérifier l'état: .\verifier-avant-push.ps1" -ForegroundColor Gray
Write-Host "  2. Pousser vers GitHub: .\push-feature-temps-reel.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "Commandes Git utiles:" -ForegroundColor Yellow
Write-Host "  git status          - Voir l'état" -ForegroundColor Gray
Write-Host "  git log --oneline   - Voir l'historique" -ForegroundColor Gray
Write-Host "  git remote -v       - Voir les remotes" -ForegroundColor Gray
Write-Host ""
