# Instructions de Redémarrage

## Problème Actuel

Le backend ne compile pas à cause d'un problème Lombok (les getters/setters ne sont pas générés).
Ceci est dû au fait que le backend est en cours d'exécution et les fichiers sont verrouillés.

## Solution

### Étape 1: Arrêter le backend

Appuyez sur `Ctrl+C` dans le terminal où le backend tourne.

### Étape 2: Supprimer le dossier target

```powershell
Remove-Item -Path target -Recurse -Force
```

### Étape 3: Recompiler

```powershell
mvn clean compile -DskipTests
```

### Étape 4: Redémarrer le backend

```powershell
mvn spring-boot:run
```

## OU Utiliser le script automatique

```powershell
.\restart-backend-clean.ps1
```

## Modifications Effectuées

### Backend: PanneService.java

Lors de la réaffectation d'une demande déclinée:
- ✅ `statutInterventions` → `EN_COURS`
- ✅ `raisonRefus` → `null`
- ✅ `dateRefus` → `null`
- ✅ `technicienDeclinant` → conservé pour l'historique

### Résultat Attendu

Après redémarrage:
- Le technicien A voit toujours sa demande déclinée
- Le technicien B voit la demande EN_COURS sans infos de déclin
- Le technicien B peut accepter/décliner normalement

## Test

Une fois le backend redémarré:
```powershell
.\test-reaffectation-complete.ps1
```
