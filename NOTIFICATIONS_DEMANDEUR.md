# Notifications pour le Demandeur

## Résumé des modifications

Le demandeur ne reçoit plus de notification lorsqu'un technicien décline une intervention. Seul le responsable de maintenance est notifié pour pouvoir réaffecter l'intervention.

## Notifications que le demandeur REÇOIT

### 1. Demande créée
- **Quand**: Après la création d'une demande de maintenance
- **Titre**: "Demande créée"
- **Message**: "Votre demande '[titre]' a été créée avec succès"
- **Type**: INFO

### 2. Intervention en cours (Demande affectée)
- **Quand**: Quand un responsable affecte un technicien à sa demande
- **Titre**: "Intervention en cours"
- **Message**: "Votre demande '[titre]' est maintenant prise en charge par [Technicien]"
- **Type**: INFO

### 3. Intervention réaffectée
- **Quand**: Quand un responsable réaffecte la demande à un autre technicien
- **Titre**: "Intervention réaffectée"
- **Message**: "Votre demande '[titre]' a été réaffectée au technicien [Nouveau Technicien]"
- **Type**: INFO

### 4. Intervention terminée
- **Quand**: Quand le technicien marque l'intervention comme terminée
- **Titre**: "Intervention terminée"
- **Message**: "L'intervention sur votre demande '[titre]' a été terminée par [Technicien]"
- **Type**: SUCCESS

## Notifications que le demandeur NE REÇOIT PLUS

### ❌ Intervention déclinée/refusée
- **Avant**: Le demandeur recevait une notification quand un technicien déclinait
- **Maintenant**: Seul le responsable de maintenance reçoit cette notification
- **Raison**: Le demandeur n'a pas besoin de savoir les détails internes de l'affectation. Il sera notifié uniquement quand un nouveau technicien est affecté (réaffectation).

## Flux de notification lors d'un refus

1. **Technicien décline** l'intervention
2. **Responsable reçoit** une notification: "⚠️ Intervention déclinée par un technicien"
3. **Responsable réaffecte** à un autre technicien
4. **Demandeur reçoit** une notification: "Intervention réaffectée"

## Fichiers modifiés

- `src/main/java/sn/uasz/uasz_maintenance_backend/services/PanneService.java`
  - Supprimé la notification au demandeur lors du déclin (ligne ~879-886)
  - Conservé la notification aux responsables

- `src/main/java/sn/uasz/uasz_maintenance_backend/services/InterventionService.java`
  - Remplacé la notification au demandeur par une notification aux responsables
  - Ajouté la gestion d'erreur pour les notifications

## Avantages de cette approche

1. **Meilleure expérience utilisateur**: Le demandeur n'est pas perturbé par les détails techniques
2. **Communication claire**: Le demandeur sait quand son intervention est prise en charge et terminée
3. **Gestion interne**: Les responsables gèrent les refus et réaffectations en interne
4. **Moins de confusion**: Le demandeur ne voit que les étapes importantes de son intervention
