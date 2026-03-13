# Correction: Affichage du nom complet du demandeur

## Problème identifié
L'interface du responsable affichait un tiret "—" au lieu du nom complet du demandeur (prénom + nom).

## Cause racine
Le backend ne retournait pas l'objet `demandeur` avec les champs `prenom` et `nom` dans la réponse API. Le DTO `PanneResponse` ne contenait pas ces informations.

## Solution appliquée

### 1. Modification de PanneResponse.java
**Fichier**: `src/main/java/sn/uasz/uasz_maintenance_backend/dtos/PanneResponse.java`

Ajout des champs pour le demandeur:
```java
// Ajout des champs
private Long demandeurId;
private DemandeurInfo demandeur;

// Classe interne pour les infos du demandeur
@Builder
@Getter
@Setter
public static class DemandeurInfo {
    private Long id;
    private String prenom;
    private String nom;
    private String username;
}
```

### 2. Modification de PanneService.java
**Fichier**: `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`

Modification de la méthode `toResponse()` pour mapper le demandeur:
```java
public PanneResponse toResponse(Panne panne) {
    Utilisateur tech = panne.getTechnicien();
    Utilisateur demandeur = panne.getDemandeur();

    // Construire l'objet DemandeurInfo si le demandeur existe
    PanneResponse.DemandeurInfo demandeurInfo = null;
    if (demandeur != null) {
        demandeurInfo = PanneResponse.DemandeurInfo.builder()
                .id(demandeur.getId())
                .prenom(demandeur.getPrenom())
                .nom(demandeur.getNom())
                .username(demandeur.getUsername())
                .build();
    }

    return PanneResponse.builder()
            // ... autres champs ...
            .demandeurId(demandeur != null ? demandeur.getId() : null)
            .demandeur(demandeurInfo)
            // ... autres champs ...
            .build();
}
```

### 3. Modification de Panne.java
**Fichier**: `src/main/java/sn/uasz/uasz_maintenance_backend/entities/Panne.java`

Ajout de `@JsonIgnoreProperties` sur la relation `demandeur` pour éviter les problèmes de sérialisation circulaire:
```java
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
@ManyToOne
@JoinColumn(name = "demandeur_id")
private Utilisateur demandeur;
```

## Frontend (déjà configuré)
Le frontend était déjà configuré pour afficher le nom complet du demandeur dans 4 endroits:
1. `mapPannesToDemandes()` - Mapping principal
2. `onSucces()` - Après affectation
3. `openDemandeDetails()` - Ouverture de modale
4. `mapPanneDtoToDemande()` - Mapping générique

Format utilisé:
```typescript
demandeurNom: p.demandeur
  ? `${p.demandeur.prenom ?? ''} ${p.demandeur.nom ?? ''}`.trim() || '—'
  : p.signaleePar ?? '—'
```

## Structure de la réponse API attendue

Avant la correction:
```json
{
  "id": 1,
  "titre": "PC en panne",
  "signaleePar": "jdupont"
  // Pas d'objet demandeur
}
```

Après la correction:
```json
{
  "id": 1,
  "titre": "PC en panne",
  "demandeurId": 5,
  "demandeur": {
    "id": 5,
    "prenom": "Jean",
    "nom": "Dupont",
    "username": "jdupont"
  }
}
```

## Étapes pour appliquer la correction

1. **Arrêter le backend**
   ```bash
   # Ctrl+C dans le terminal où le backend tourne
   ```

2. **Compiler le backend**
   ```bash
   mvn compile -DskipTests
   ```

3. **Redémarrer le backend**
   ```bash
   mvn spring-boot:run
   ```

4. **Tester dans le frontend**
   - Ouvrir le dashboard Responsable
   - Vérifier que les noms complets des demandeurs s'affichent
   - Au lieu de "—", vous devriez voir "Prénom Nom"

## Vérification

Pour vérifier que la correction fonctionne:

1. **Via l'API**:
   ```bash
   curl http://localhost:8080/api/pannes
   ```
   Vérifier que la réponse contient l'objet `demandeur` avec `prenom` et `nom`.

2. **Via le frontend**:
   - Tableau des demandes: Le nom complet doit s'afficher sous le titre
   - Modale de détails: Le nom complet doit s'afficher dans les informations
   - PDF exporté: Le nom complet doit apparaître dans "Signalée par:"

## Fallback
Si l'objet `demandeur` n'existe pas ou est null, le système utilise:
1. Le champ `signaleePar` (username)
2. Si toujours vide, affiche "—"

## Impact
- ✅ Affichage du nom complet (prénom + nom) partout dans l'interface
- ✅ Meilleure lisibilité pour le responsable
- ✅ Cohérence avec l'affichage des techniciens
- ✅ Pas de régression sur les fonctionnalités existantes

## Fichiers modifiés
1. `src/main/java/sn/uasz/uasz_maintenance_backend/dtos/PanneResponse.java`
2. `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`
3. `src/main/java/sn/uasz/uasz_maintenance_backend/entities/Panne.java`

## Scripts de test créés
1. `test-demandeur-backend-fix.ps1` - Vérification des modifications
2. `restart-backend-test-demandeur.ps1` - Guide de redémarrage et test
