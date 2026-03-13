# Fix: Réaffectation de demande déclinée

## Problème identifié

Quand un responsable réaffecte une demande déclinée à un nouveau technicien:
- ❌ Le nouveau technicien voyait la demande avec le statut "Déclinée"
- ❌ Les informations de déclin (raison, date) de l'ancien technicien étaient visibles
- ❌ Les boutons "Accepter" et "Décliner" n'étaient pas disponibles
- ❌ Le nouveau technicien ne pouvait pas interagir avec la demande

## Solution implémentée

Lors de la réaffectation d'une demande à un nouveau technicien, le système réinitialise automatiquement:

### 1. PanneService.java - Méthode `affecterTechnicien()`

```java
// Réinitialiser les informations de déclin
panne.setRaisonRefus(null);
panne.setDateRefus(null);
```

### 2. InterventionService.java - Méthode `affecterTechnicien()`

```java
// Réinitialiser le statut si refusée
if (intervention.getStatut() == StatutIntervention.REFUSEE) {
    intervention.setStatut(StatutIntervention.PLANIFIEE);
}
// Réinitialiser les informations de refus
intervention.setRaisonRefus(null);
intervention.setDateRefus(null);
```

## Résultat

Maintenant, quand un responsable réaffecte une demande déclinée:

1. ✅ Le nouveau technicien reçoit la demande avec le statut "EN_COURS" ou "PLANIFIEE"
2. ✅ Les informations de déclin sont effacées (raison et date)
3. ✅ Les boutons "Accepter" et "Décliner" sont disponibles
4. ✅ Le nouveau technicien peut interagir normalement avec la demande
5. ✅ Aucune trace du déclin précédent n'est visible pour le nouveau technicien

## Flux complet de réaffectation

1. **Technicien A** décline la demande
   - Statut: DECLINEE
   - Raison et date de refus enregistrées
   - Notification envoyée au responsable

2. **Responsable** réaffecte à **Technicien B**
   - Statut: EN_COURS (automatique)
   - Raison et date de refus: NULL (effacées)
   - Notification envoyée au Technicien B

3. **Technicien B** reçoit la demande
   - Voit la demande comme nouvelle
   - Peut accepter ou décliner
   - Aucune information sur le déclin précédent

## Fichiers modifiés

- `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`
  - Ajout de la réinitialisation de `raisonRefus` et `dateRefus`

- `src/main/java/sn/uasz/uasz_maintenance_backend/services/InterventionService.java`
  - Ajout de la réinitialisation du statut (REFUSEE → PLANIFIEE)
  - Ajout de la réinitialisation de `raisonRefus` et `dateRefus`

## Test recommandé

1. Créer une demande
2. Affecter au Technicien A
3. Technicien A décline avec une raison
4. Responsable réaffecte au Technicien B
5. Vérifier que Technicien B voit:
   - Statut: EN_COURS ou PLANIFIEE
   - Boutons: Accepter et Décliner disponibles
   - Aucune information de déclin visible
