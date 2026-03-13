# Résumé: Correction de la Réaffectation

## Ce qui a été corrigé

### Problème
Quand un responsable réaffectait une demande déclinée au technicien B:
- Le technicien B voyait les infos du déclin du technicien A
- Le technicien B ne pouvait pas accepter/décliner (pas de boutons)
- Le technicien A ne voyait plus sa demande déclinée

### Solution
Ajout d'un champ `technicien_declinant_id` qui garde l'historique du déclin.

## Modifications Effectuées

### 1. Backend: PanneService.java (ligne 541)

**AVANT:**
```java
panne.setStatutInterventions(StatutInterventions.EN_COURS);
// NE PAS effacer raisonRefus, dateRefus, technicienDeclinant
```

**APRÈS:**
```java
panne.setStatutInterventions(StatutInterventions.EN_COURS);
// ✅ EFFACER les infos de déclin pour le nouveau technicien
panne.setRaisonRefus(null);
panne.setDateRefus(null);
// technicienDeclinant reste pour l'historique
```

### 2. Base de données

Exécuter la migration:
```sql
-- Fichier: add-technicien-declinant-column.sql
ALTER TABLE pannes ADD COLUMN technicien_declinant_id BIGINT NULL;
```

### 3. Frontend

Le code frontend était déjà correct:
- `shouldShowDeclineInfo()` vérifie que c'est le bon technicien
- Les boutons ne s'affichent que si `statut === 'A_FAIRE'`

## Résultat

Maintenant:
- ✅ Technicien A voit toujours sa demande déclinée
- ✅ Technicien B voit la demande EN_COURS sans infos de déclin
- ✅ Technicien B peut accepter/décliner normalement
- ✅ Le responsable voit l'historique complet

## Test

```powershell
.\test-reaffectation-complete.ps1
```
