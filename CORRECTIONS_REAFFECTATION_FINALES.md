# Corrections Finales: Réaffectation des Demandes Déclinées

## Problèmes Identifiés

1. ❌ Technicien A décline → La demande passait à "En cours" au lieu de rester "Déclinée"
2. ❌ Responsable réaffecte au Technicien B → La demande apparaissait "En cours" au lieu de "A faire"
3. ❌ Technicien A ne voyait plus sa demande déclinée après réaffectation
4. ❌ Le demandeur ne voyait plus sa demande

## Solutions Implémentées

### 1. Backend: PanneService.java - Méthode affecterTechnicien()

**AVANT:**
```java
panne.setStatutInterventions(StatutInterventions.EN_COURS);
```

**APRÈS:**
```java
// Le nouveau technicien doit voir la demande comme "A FAIRE"
panne.setStatutInterventions(StatutInterventions.NON_DEMARREE);
panne.setRaisonRefus(null);
panne.setDateRefus(null);
```

### 2. Backend: PanneRepository.java - Requête findToutesPannesDuTechnicienAvecDeclinees()

**AVANT:**
```java
WHERE p.technicien.id = :technicienId
OR (p.technicienDeclinant.id = :technicienId AND p.statutInterventions = DECLINEE)
```

**APRÈS:**
```java
WHERE p.technicien.id = :technicienId
OR p.technicienDeclinant.id = :technicienId
```

Maintenant le technicien A voit toujours sa demande déclinée même après réaffectation.

### 3. Frontend: dashboard-technicien.component.ts - Méthode mapStatutInterventionApiToUi()

**Logique ajoutée:**
```typescript
// Si je suis le technicien qui a décliné ET que je ne suis PLUS affecté
// Afficher DECLINEE
if (technicienDeclinantId === this.technicienId && technicienId !== this.technicienId) {
  return 'DECLINEE';
}
```

## Résultat Attendu

### Scénario Complet

1. **Technicien A décline**
   - Statut pour A: DECLINEE ✅
   - Visible dans le filtre "Déclinées" ✅

2. **Responsable réaffecte au Technicien B**
   - Statut pour B: A_FAIRE ✅
   - B peut accepter ou décliner ✅

3. **Technicien A voit toujours sa demande**
   - Visible dans "Déclinées" ✅
   - Même après réaffectation ✅

4. **Le demandeur voit toujours sa demande**
   - La demande reste visible ✅
   - Aucun changement côté demandeur ✅

## Fichiers Modifiés

- `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`
- `src/main/java/sn/uasz/uasz_maintenance_backend/repositories/PanneRepository.java`
- `uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts`
