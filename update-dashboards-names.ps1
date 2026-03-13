# Script pour mettre à jour les dashboards Technicien et Admin

# Fonction pour ajouter les champs nom et prenom après username
function Add-NomPrenomFields {
    param($filePath)
    
    $content = Get-Content $filePath -Raw
    
    # Ajouter nom et prenom après username
    $content = $content -replace '(username\s*[:=]\s*[^;]+;)', "`$1`n  nom: string = '';`n  prenom: string = '';"
    
    Set-Content $filePath $content
}

# Fonction pour mettre à jour ngOnInit
function Update-NgOnInit {
    param($filePath)
    
    $content = Get-Content $filePath -Raw
    
    # Ajouter le chargement de nom et prenom dans ngOnInit
    $ngOnInitPattern = '(ngOnInit\(\)[^{]*\{[^}]*const storedUsername[^}]+\})'
    $replacement = @'
ngOnInit(): void {
    const storedUsername = localStorage.getItem('auth_username');
    const storedNom = localStorage.getItem('auth_nom');
    const storedPrenom = localStorage.getItem('auth_prenom');
    
    if (storedUsername) {
      this.username = storedUsername;
      this.usernameInitial = storedUsername.charAt(0).toUpperCase();
    }
    
    if (storedNom) {
      this.nom = storedNom;
    }
    
    if (storedPrenom) {
      this.prenom = storedPrenom;
    }
'@
    
    $content = $content -replace $ngOnInitPattern, $replacement
    
    Set-Content $filePath $content
}

# Fonction pour ajouter getNomComplet
function Add-GetNomComplet {
    param($filePath)
    
    $content = Get-Content $filePath -Raw
    
    $method = @'

  getNomComplet(): string {
    if (this.prenom && this.nom) {
      return `${this.prenom} ${this.nom}`;
    } else if (this.prenom) {
      return this.prenom;
    } else if (this.nom) {
      return this.nom;
    }
    return this.username;
  }
'@
    
    # Ajouter avant la dernière accolade fermante
    $content = $content -replace '(\n\}[\s]*$)', "$method`n}"
    
    Set-Content $filePath $content
}

Write-Host "Mise à jour terminée!"
