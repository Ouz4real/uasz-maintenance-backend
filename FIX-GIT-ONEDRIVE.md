# Fix Git Repository dans OneDrive

## Problème
Le repository Git est corrompu à cause de la synchronisation OneDrive qui interfère avec les fichiers `.git`.

## Solution Recommandée

### Option 1: Déplacer le repository hors de OneDrive (RECOMMANDÉ)

```powershell
# 1. Créer un nouveau dossier hors de OneDrive
New-Item -Path "C:\Dev\uasz-maintenance-backend" -ItemType Directory -Force

# 2. Copier tous les fichiers (sauf .git)
Copy-Item -Path "C:\Users\Pro\OneDrive\Desktop\uasz-maintenance-backend\*" -Destination "C:\Dev\uasz-maintenance-backend\" -Recurse -Exclude ".git"

# 3. Aller dans le nouveau dossier
cd C:\Dev\uasz-maintenance-backend

# 4. Initialiser Git
git init

# 5. Ajouter le remote
git remote add origin https://github.com/Ouz4real/uasz-maintenance-backend.git

# 6. Récupérer l'historique
git fetch origin

# 7. Créer la branche main/master
git checkout -b main

# 8. Ajouter tous les fichiers
git add .

# 9. Créer le commit avec le message préparé
git commit -F commit-message.txt

# 10. Pousser vers GitHub
git push -u origin main --force
```

### Option 2: Exclure .git de OneDrive

```powershell
# Marquer le dossier .git comme "Toujours garder sur cet appareil"
# Cela empêche OneDrive de le synchroniser

# Via PowerShell (nécessite des droits admin)
attrib +P "C:\Users\Pro\OneDrive\Desktop\uasz-maintenance-backend\.git" /S /D

# Puis réinitialiser Git
cd C:\Users\Pro\OneDrive\Desktop\uasz-maintenance-backend
Remove-Item .git -Recurse -Force
git init
git remote add origin https://github.com/Ouz4real/uasz-maintenance-backend.git
git fetch origin
git checkout -b main
git add .
git commit -F commit-message.txt
git push -u origin main --force
```

### Option 3: Utiliser GitHub Desktop

1. Télécharger GitHub Desktop: https://desktop.github.com/
2. Ouvrir GitHub Desktop
3. File > Add Local Repository
4. Sélectionner le dossier du projet
5. Si erreur, choisir "Create a repository" puis "Publish repository"
6. Faire le commit et push via l'interface

## Commandes pour pousser le code actuel

Une fois le repository réparé:

```powershell
# Ajouter tous les fichiers
git add .

# Créer le commit
git commit -F commit-message.txt

# Pousser vers GitHub
git push origin main
```

## Changements dans ce commit

- ✅ Ajout icône œil pour afficher/masquer les mots de passe dans TOUT le système
- ✅ Fix endpoint password change dans UserProfileService
- ✅ Implémentation dans 6 composants (tous les dashboards + profile)
- ✅ Styles globaux pour les champs password
- ✅ Propriétés TypeScript pour la visibilité

Inchallah! 🔐👁️
