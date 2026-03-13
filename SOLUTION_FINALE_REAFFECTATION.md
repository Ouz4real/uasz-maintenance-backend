# Solution Finale: Réaffectation des Demandes Déclinées

## Problème Initial

Quand un responsable réaffectait une demande déclinée:
- ❌ Le technicien A (qui avait décliné) ne voyait plus la demande
- ❌ Le technicien B (nouveau) voyait la demande avec les infos de déclin de A
- ❌ Le technicien B ne pouvait pas accepter/décliner (pas de boutons)

## Solution Implémentée

### Principe

Utiliser un champ `technicienDeclinant` pour garder l'historique du déclin, tout en réinitialisant les infos pour le nouveau technicien.

### Modifications Backend

#### 1. Entité `Panne.java` - Champ technicienDeclinant

```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "technicien_declinant_id", nullable = true)
private Utilisateur technicienDeclinant;
```

#### 2. Migration SQL

```sql
ALTER TABLE pannes ADD COLUMN technicien_declinant_id BIGINT NULL;
ALTER TABLE pannes ADD CONSTRAINT fk_pannes_technicien_declinant 
    FOREIGN KEY (technicien_declinant_id) REFERENCES utilisateurs(id);
```

#### 3. PanneService - Lors du déclin

```java
panne.setStatutInterventions(StatutInterventions.DECLINEE);
panne.setRaisonRefus(raison);
panne.setDateRefus(LocalDateTime.now());
panne.setTechnicienDeclinant(panne.getTechnicien()); // 🔥 Sauvegarder qui a décliné
```

#### 4. PanneService - Lors de la réaffectation

```java
panne.setTechnicien(nouveauTechnicien);
panne.setStatutInterventions(StatutInterventions.EN_COURS); // ✅ Réinitialiser
panne.setRaisonRefus(null); // ✅ Effacer pour le nouveau technicien
panne.setDateRefus(null); // ✅ Effacer pour le nouveau technicien
// technicienDeclinant reste pour l'historique
```

#### 5. PanneRepository - Requête pour le technicien

```java
@Query("""
    SELECT p FROM Panne p
    WHERE p.technicien.id = :technicienId
    OR (p.technicienDeclinant.id = :technicienId 
        AND p.statutInterventions = StatutInterventions.DECLINEE)
    ORDER BY p.dateSignalement DESC
""")
List<Panne> findToutesPannesDuTechnicienAvecDeclinees(@Param("technicienId") Long technicienId);
```

Cette requête permet au technicien A de continuer à voir sa demande déclinée même après réaffectation.

### Modifications Frontend

#### 1. Interface Intervention

```typescript
interface Intervention {
  // ... autres champs
  raisonRefus?: string;
  dateRefus?: Date;
  technicienDeclinantId?: number; // 🔥 Nouveau champ
}
```

#### 2. Méthode shouldShowDeclineInfo

```typescript
shouldShowDeclineInfo(intervention: Intervention): boolean {
  // Afficher les infos de déclin seulement si:
  // 1. Le statut est DECLINEE
  // 2. ET c'est MOI qui ai décliné
  return intervention.statut === 'DECLINEE' && 
         intervention.technicienDeclinantId === this.technicienId;
}
```

#### 3. Affichage conditionnel dans le HTML

```html
<!-- Infos de déclin visibles seulement pour le technicien qui a décliné -->
<div *ngIf="shouldShowDeclineInfo(selectedIntervention)">
  <h4>Informations de déclin</h4>
  <!-- ... -->
</div>

<!-- Boutons Accepter/Décliner visibles seulement si statut = A_FAIRE -->
<footer *ngIf="selectedIntervention.statut === 'A_FAIRE'">
  <button (click)="refuserIntervention()">Décliner</button>
  <button (click)="accepterIntervention()">Accepter</button>
</footer>
```

## Résultat Final

### Scénario: Demande déclinée puis réaffectée

**Étape 1: Technicien A décline**
```
technicien_id: 3 (Technicien A)
technicien_declinant_id: 3 (Technicien A)
statut_interventions: DECLINEE
raison_refus: "Pas de compétences"
date_refus: 2026-03-12 10:30:00
```

**Étape 2: Responsable réaffecte à Technicien B**
```
technicien_id: 4 (Technicien B) ← CHANGÉ
technicien_declinant_id: 3 (Technicien A) ← CONSERVÉ
statut_interventions: EN_COURS ← RÉINITIALISÉ
raison_refus: null ← EFFACÉ
date_refus: null ← EFFACÉ
```

**Résultat:**
- ✅ Technicien A: Voit toujours sa demande déclinée (car `technicienDeclinant.id = 3`)
- ✅ Technicien B: Voit la demande EN_COURS, sans infos de déclin, peut accepter/décliner
- ✅ Responsable: Voit l'historique complet (qui a décliné, pourquoi, quand)

## Test

Exécuter le script de test:
```powershell
.\test-reaffectation-complete.ps1
```

Ce script teste automatiquement tout le flux de réaffectation.

## Fichiers Modifiés

### Backend
- `src/main/java/sn/uasz/uasz_maintenance_backend/entities/Panne.java`
- `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`
- `src/main/java/sn/uasz/uasz_maintenance_backend/repositories/PanneRepository.java`
- `add-technicien-declinant-column.sql` (migration)

### Frontend
- `uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts`
- `uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.html`

## Avantages

1. ✅ Historique préservé pour le responsable
2. ✅ Technicien A garde sa demande déclinée visible
3. ✅ Technicien B voit une demande propre, sans infos de déclin
4. ✅ Pas de duplication de données
5. ✅ Solution simple et maintenable
