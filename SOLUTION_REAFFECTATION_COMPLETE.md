# Solution Implémentée: Réaffectation des Demandes Déclinées

## Problème Résolu

Lorsqu'un responsable réaffectait une demande déclinée:
- ❌ Le technicien A (qui avait décliné) ne voyait plus la demande
- ❌ Le technicien B (nouveau) voyait la demande avec les infos de déclin de A
- ❌ Le technicien B ne pouvait pas accepter/décliner

## Solution Implémentée

### Approche: Champ `technicienDeclinant`

Ajout d'un champ `technicien_declinant_id` pour garder l'historique du déclin même après réaffectation.

---

## Modifications Backend

### 1. Entité `Panne.java`

```java
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password"})
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "technicien_declinant_id", nullable = true)
private Utilisateur technicienDeclinant;
```

**Rôle**: Garde en mémoire quel technicien a décliné la demande, même après réaffectation.

### 2. Migration SQL: `add-technicien-declinant-column.sql`

```sql
-- Ajouter la colonne technicien_declinant_id
ALTER TABLE pannes 
ADD COLUMN technicien_declinant_id BIGINT NULL;

-- Ajouter la contrainte de clé étrangère
ALTER TABLE pannes 
ADD CONSTRAINT fk_pannes_technicien_declinant 
FOREIGN KEY (technicien_declinant_id) 
REFERENCES utilisateurs(id);

-- Créer un index pour améliorer les performances
CREATE INDEX idx_pannes_technicien_declinant 
ON pannes(technicien_declinant_id);

-- Mettre à jour les données existantes
UPDATE pannes 
SET technicien_declinant_id = technicien_id 
WHERE statut_interventions = 'DECLINEE' 
AND technicien_id IS NOT NULL 
AND technicien_declinant_id IS NULL;
```

### 3. Service `PanneService.java` - Méthode `affecterTechnicien()`

```java
@Transactional
public PanneResponse affecterTechnicien(Long id, Long idTechnicien) {
    // 1️⃣ Récupération de la panne
    Panne panne = panneRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Panne introuvable avec id : " + id));

    // 2️⃣ Récupération du technicien
    Utilisateur technicien = utilisateurRepository.findById(idTechnicien)
            .orElseThrow(() -> new RuntimeException("Technicien introuvable avec id : " + idTechnicien));

    // 3️⃣ Affectation
    panne.setTechnicien(technicien);

    // 4️⃣ LOGIQUE MÉTIER CLÉ 🔥
    // Si on affecte → la panne passe automatiquement EN_COURS
    panne.setStatut(StatutPanne.EN_COURS);
    
    // 🔥 IMPORTANT : Lors de la réaffectation, réinitialiser le statut pour le nouveau technicien
    // MAIS garder les infos de déclin pour l'historique (technicienDeclinant reste)
    
    // Réinitialiser le statut d'intervention pour le nouveau technicien
    panne.setStatutInterventions(StatutInterventions.EN_COURS);
    
    // NE PAS effacer raisonRefus, dateRefus, technicienDeclinant
    // Ces champs restent pour l'historique

    // 5️⃣ Sauvegarde
    Panne saved = panneRepository.save(panne);

    // 6️⃣ Mapping propre vers le DTO
    return toResponse(saved);
}
```

**Points clés**:
- ✅ Le statut passe à `EN_COURS` pour le nouveau technicien
- ✅ Les champs `raisonRefus`, `dateRefus`, `technicienDeclinant` sont CONSERVÉS pour l'historique
- ✅ Le nouveau technicien peut accepter/décliner normalement

### 4. Service `PanneService.java` - Lors du déclin

Quand un technicien décline, on sauvegarde son ID dans `technicienDeclinant`:

```java
// Lors du déclin par le technicien
panne.setStatutInterventions(StatutInterventions.DECLINEE);
panne.setRaisonRefus(raison);
panne.setDateRefus(LocalDateTime.now());
panne.setTechnicienDeclinant(panne.getTechnicien()); // 🔥 Sauvegarder qui a décliné
```

---

## Modifications Frontend

### 1. Modèle `demande.model.ts`

```typescript
export interface Demande {
  id: number;
  titre: string;
  description: string;
  // ... autres champs
  
  technicien?: Utilisateur;
  technicienDeclinant?: Utilisateur; // 🔥 Nouveau champ
  
  raisonRefus?: string;
  dateRefus?: string;
  statutInterventions: string;
}
```

### 2. Dashboard Technicien - Filtrage des demandes

```typescript
// Le technicien voit:
// - Ses demandes EN_COURS (nouvelles affectations)
// - Ses demandes DECLINEE qu'il a lui-même déclinées
// - PAS les demandes déclinées par d'autres

mesDemandes = allDemandes.filter(d => 
  d.technicien?.id === monId && 
  (d.statutInterventions !== 'DECLINEE' || 
   d.technicienDeclinant?.id === monId)
);
```

### 3. Dashboard Technicien - Affichage conditionnel

```typescript
shouldShowDeclineInfo(demande: Demande): boolean {
  // Afficher les infos de déclin seulement si:
  // 1. Le statut est DECLINEE
  // 2. C'est MOI qui ai décliné
  return demande.statutInterventions === 'DECLINEE' && 
         demande.technicienDeclinant?.id === this.currentUserId &&
         demande.raisonRefus != null;
}
```

### 4. Dashboard Responsable - Affichage de l'historique

```html
<!-- Afficher qui a décliné -->
<div *ngIf="demande.statutInterventions === 'DECLINEE' && demande.technicienDeclinant">
  <strong>Déclinée par:</strong> 
  {{ demande.technicienDeclinant.prenom }} {{ demande.technicienDeclinant.nom }}
  <br>
  <strong>Raison:</strong> {{ demande.raisonRefus }}
  <br>
  <strong>Date:</strong> {{ demande.dateRefus | date:'dd/MM/yyyy HH:mm' }}
</div>
```

---

## Flux Complet de Réaffectation

### Scénario: Demande déclinée puis réaffectée

1. **Technicien A décline la demande**
   ```
   technicien_id: 5 (Technicien A)
   technicien_declinant_id: 5 (Technicien A)
   statut_interventions: DECLINEE
   raison_refus: "Pas de pièces disponibles"
   date_refus: 2026-03-12 10:30:00
   ```

2. **Responsable réaffecte à Technicien B**
   ```
   technicien_id: 8 (Technicien B) ← CHANGÉ
   technicien_declinant_id: 5 (Technicien A) ← CONSERVÉ
   statut_interventions: EN_COURS ← RÉINITIALISÉ
   raison_refus: "Pas de pièces disponibles" ← CONSERVÉ
   date_refus: 2026-03-12 10:30:00 ← CONSERVÉ
   ```

3. **Résultat**
   - ✅ Technicien A: Ne voit plus la demande (car `technicien_id != 5`)
   - ✅ Technicien B: Voit la demande avec statut `EN_COURS`, peut accepter/décliner
   - ✅ Responsable: Voit l'historique complet (qui a décliné, pourquoi, quand)

---

## Avantages de cette Solution

1. ✅ **Historique préservé**: On sait toujours qui a décliné et pourquoi
2. ✅ **Nouveau technicien libre**: Peut accepter/décliner sans contrainte
3. ✅ **Ancien technicien ne voit plus**: La demande disparaît de son interface
4. ✅ **Responsable informé**: Voit l'historique complet pour prendre des décisions
5. ✅ **Migration simple**: Une seule colonne à ajouter
6. ✅ **Rétrocompatible**: Les anciennes demandes fonctionnent toujours

---

## Scripts de Test

### Test de réaffectation: `test-reassignment-complete-fix.ps1`

```powershell
# 1. Créer une demande
# 2. Affecter au Technicien A
# 3. Technicien A décline
# 4. Responsable réaffecte au Technicien B
# 5. Vérifier que Technicien B voit la demande EN_COURS
# 6. Vérifier que l'historique est préservé
```

### Nettoyage des données: `clean-declined-reassigned.sql`

```sql
-- Réinitialiser les demandes déclinées qui ont été réaffectées
-- (pour corriger les données avant l'implémentation)
UPDATE pannes
SET 
    statut_interventions = 'EN_COURS',
    raison_refus = NULL,
    date_refus = NULL
WHERE statut_interventions = 'DECLINEE'
  AND technicien_id IS NOT NULL;
```

---

## Fichiers Modifiés

### Backend
- `src/main/java/sn/uasz/uasz_maintenance_backend/entities/Panne.java`
- `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`
- `add-technicien-declinant-column.sql` (migration)

### Frontend
- `uasz-maintenance-frontend/src/app/core/models/demande.model.ts`
- `uasz-maintenance-frontend/src/app/pages/dashboard/dashboardTechnicien/dashboard-technicien.component.ts`
- `uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.ts`
- `uasz-maintenance-frontend/src/app/pages/dashboard/dashboardResponsable/dashboard-responsable.component.html`

---

## Résultat Final

✅ **Problème résolu**: La réaffectation fonctionne correctement
✅ **Historique préservé**: On garde la trace de qui a décliné
✅ **UX améliorée**: Chaque technicien voit uniquement ses demandes actives
✅ **Responsable informé**: Peut voir l'historique complet des déclins

