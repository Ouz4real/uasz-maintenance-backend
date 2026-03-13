# Notification de Résolution - Tous les Rôles

## Objectif

Tous les utilisateurs (quel que soit leur rôle) qui créent une demande dans "Mes demandes" doivent recevoir une notification lorsque le responsable maintenance marque leur demande comme RESOLUE.

## Rôles Concernés

Tous les rôles peuvent créer des demandes et ont une section "Mes demandes":
- ✅ DEMANDEUR
- ✅ TECHNICIEN
- ✅ RESPONSABLE_MAINTENANCE
- ✅ SUPERVISEUR
- ✅ ADMIN

## Architecture Existante

### 1. Création de Demande (`PanneService.createPanne()`)

Lorsqu'un utilisateur (quel que soit son rôle) crée une demande:
```java
panne.setDemandeur(demandeur); // L'utilisateur connecté devient le demandeur
```

Le champ `demandeur` est TOUJOURS rempli avec l'utilisateur qui crée la demande, peu importe son rôle.

### 2. Récupération des Demandes

Endpoint: `GET /api/pannes/mes-pannes`
```java
public List<Panne> getMesPannes(Authentication authentication) {
    Utilisateur user = (Utilisateur) authentication.getPrincipal();
    return panneService.getPannesByDemandeur(user.getId());
}
```

Utilise `findByDemandeurId()` pour récupérer toutes les demandes créées par l'utilisateur.

### 3. Notification de Résolution

Deux méthodes envoient la notification au demandeur:

#### A. `marquerPanneResolue()` - Méthode principale
```java
@Transactional
public PanneResponse marquerPanneResolue(Long panneId, Boolean marquerResolue) {
    // ... validation ...
    
    if (marquerResolue != null && marquerResolue) {
        panne.setStatut(StatutPanne.RESOLUE);
    }
    
    Panne saved = panneRepository.save(panne);
    
    // 🔔 Notification au demandeur
    if (marquerResolue != null && marquerResolue) {
        if (saved.getDemandeur() != null) {
            notificationService.createNotification(
                saved.getDemandeur().getId(),
                "Demande résolue",
                String.format("Votre demande \"%s\" a été marquée comme résolue...", 
                    saved.getTitre()),
                "SUCCESS",
                "PANNE",
                saved.getId()
            );
        }
    }
    
    return toResponse(saved);
}
```

#### B. `traiterParResponsable()` - Méthode alternative
```java
@Transactional
public PanneResponse traiterParResponsable(..., StatutPanne statut, ...) {
    // ... affectation technicien ...
    
    if (statut == StatutPanne.RESOLUE) {
        panne.setStatutInterventions(StatutInterventions.TERMINEE);
        panne.setDateFinIntervention(LocalDateTime.now());
    }
    
    Panne saved = panneRepository.save(panne);
    
    // 🔔 Notification au demandeur si RESOLUE
    if (statut == StatutPanne.RESOLUE) {
        if (saved.getDemandeur() != null) {
            notificationService.createNotification(
                saved.getDemandeur().getId(),
                "Demande résolue",
                ...
            );
        }
    }
    
    return toResponse(saved);
}
```

## Flux Complet

### Exemple: Technicien crée une demande

1. **Technicien** (ID: 37) crée une demande
   - `panne.demandeur = Technicien(37)`
   - Notification envoyée aux responsables

2. **Responsable** affecte à un autre technicien
   - `panne.technicien = Technicien(38)`
   - Notification envoyée au technicien 38

3. **Technicien 38** démarre et termine l'intervention
   - ❌ PAS de notification au demandeur (Technicien 37)
   - ✅ Notification envoyée aux responsables

4. **Responsable** marque comme RESOLUE
   - ✅ Notification envoyée au demandeur (Technicien 37)
   - Message: "Votre demande a été marquée comme résolue..."

## Points Clés

1. **Universel**: Fonctionne pour TOUS les rôles car on utilise `panne.getDemandeur()`
2. **Pas de duplication**: Un seul moment de notification (quand marqué RESOLUE)
3. **Pas de notification prématurée**: Le demandeur ne reçoit PAS de notification quand le technicien termine
4. **Historique préservé**: Le champ `demandeur` n'est jamais modifié après création

## Test

Script de test: `test-notification-tous-roles.ps1`

Ce script teste les 5 rôles:
1. Crée une demande avec chaque rôle
2. Affecte à un technicien
3. Technicien termine l'intervention
4. Responsable marque comme RESOLUE
5. Vérifie que le créateur reçoit la notification

## Fichiers Modifiés

- `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`
  - Méthode `marquerPanneResolue()`: Ajout notification demandeur
  - Méthode `traiterParResponsable()`: Ajout notification demandeur si RESOLUE
  - Méthode `terminerIntervention()`: Suppression notification demandeur

## Conclusion

✅ La fonctionnalité est déjà implémentée pour TOUS les rôles
✅ Aucune modification supplémentaire nécessaire
✅ Le système utilise le champ `demandeur` qui est universel
✅ Tous les utilisateurs qui créent une demande la verront dans "Mes demandes"
✅ Tous recevront la notification de résolution
