# ÉTAPES POUR CORRIGER L'AFFICHAGE DU TIRET

## Situation actuelle
Vous voyez toujours un tiret "—" au lieu du nom complet du demandeur.

## Pourquoi?
Le code a été modifié et compilé, mais le **backend en cours d'exécution utilise encore l'ancienne version**.

## Solution: Redémarrer le backend

### Étape 1: Arrêter le backend actuel

**Si le backend tourne dans un terminal:**
1. Allez dans le terminal où le backend tourne
2. Appuyez sur `Ctrl+C` pour l'arrêter
3. Attendez que le processus se termine complètement

**Si vous ne savez pas où il tourne:**
1. Ouvrez le Gestionnaire des tâches (Ctrl+Shift+Esc)
2. Cherchez "java.exe" ou "mvn"
3. Terminez le processus

### Étape 2: Vérifier que le backend est bien arrêté

Ouvrez un terminal et testez:
```bash
curl http://localhost:8080/actuator/health
```

Si vous obtenez une erreur "connexion refusée", c'est bon, le backend est arrêté.

### Étape 3: Redémarrer le backend avec la nouvelle version

Dans le dossier du backend, exécutez:
```bash
mvn spring-boot:run
```

### Étape 4: Attendre le démarrage complet

Attendez de voir ce message dans le terminal:
```
Started UaszMaintenanceBackendApplication in X.XXX seconds
```

### Étape 5: Tester l'API

Dans un nouveau terminal, testez:
```bash
curl http://localhost:8080/api/pannes
```

Vous devriez voir dans la réponse:
```json
{
  "id": 1,
  "titre": "...",
  "demandeur": {
    "id": 5,
    "prenom": "Jean",
    "nom": "Dupont",
    "username": "jdupont"
  }
}
```

### Étape 6: Rafraîchir le frontend

1. Allez dans le navigateur
2. Appuyez sur `Ctrl+Shift+R` (rafraîchissement forcé)
3. Ouvrez le dashboard Responsable
4. Vérifiez que les noms complets s'affichent

## Vérification rapide

Exécutez ce script pour diagnostiquer:
```bash
./diagnostic-demandeur-complet.ps1
```

## Si ça ne fonctionne toujours pas

### Problème 1: L'objet demandeur est absent de l'API
**Cause:** Le backend n'a pas été redémarré correctement  
**Solution:** Recommencez les étapes 1 à 4

### Problème 2: L'objet demandeur existe mais prenom/nom sont vides
**Cause:** Les utilisateurs dans la base de données n'ont pas de prénom/nom  
**Solution:** Vérifiez la table `utilisateurs` dans la base de données

### Problème 3: Le frontend affiche toujours un tiret
**Cause:** Cache du navigateur  
**Solution:** 
1. Ouvrez les outils de développement (F12)
2. Onglet "Network"
3. Cochez "Disable cache"
4. Rafraîchissez la page (Ctrl+Shift+R)

## Résumé en 3 étapes

1. **Arrêter** le backend (Ctrl+C)
2. **Redémarrer** le backend (`mvn spring-boot:run`)
3. **Rafraîchir** le frontend (Ctrl+Shift+R)

## Fichiers modifiés (déjà fait)

✅ PanneResponse.java - Ajout de demandeurId et demandeur  
✅ PanneService.java - Mapping du demandeur  
✅ Panne.java - JsonIgnoreProperties  
✅ Compilation réussie

Il ne reste plus qu'à redémarrer le backend!
