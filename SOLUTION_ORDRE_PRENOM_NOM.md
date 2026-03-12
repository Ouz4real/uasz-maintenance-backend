# Solution: Ordre Prénom/Nom inversé

## Problème identifié

L'interface affiche "Nom Prénom" au lieu de "Prénom Nom".

Exemple:
- Affichage actuel: "Fall Doudou" ou "Ousmane Marié"
- Affichage souhaité: "Doudou Fall" ou "Marié Ousmane"

## Cause

Les valeurs sont **inversées dans la base de données**:
- Le champ `prenom` contient le nom de famille (Fall, Ousmane)
- Le champ `nom` contient le prénom (Doudou, Marié)

## Vérification

Exécutez ce script SQL pour vérifier:
```sql
SELECT id, username, prenom, nom 
FROM utilisateurs 
WHERE prenom IS NOT NULL AND nom IS NOT NULL;
```

Si vous voyez:
```
id | username | prenom   | nom
1  | dfall    | Fall     | Doudou
2  | mousmane | Ousmane  | Marié
```

Alors les valeurs sont bien inversées!

## Solution 1: Inverser les valeurs dans la base (RECOMMANDÉ)

### Méthode A: Inverser tous les utilisateurs

```sql
-- ATTENTION: Faites une sauvegarde avant!
UPDATE utilisateurs
SET 
    prenom = nom,
    nom = prenom
WHERE prenom IS NOT NULL AND nom IS NOT NULL;
```

### Méthode B: Corriger utilisateur par utilisateur

```sql
-- Pour chaque utilisateur
UPDATE utilisateurs SET prenom='Doudou', nom='Fall' WHERE id=1;
UPDATE utilisateurs SET prenom='Marié', nom='Ousmane' WHERE id=2;
```

## Solution 2: Modifier le code (NON RECOMMANDÉ)

Si vous ne pouvez pas modifier la base, vous pouvez inverser l'ordre dans le code.

### Dans le frontend (TypeScript)

Remplacer:
```typescript
`${p.demandeur.prenom ?? ''} ${p.demandeur.nom ?? ''}`.trim()
```

Par:
```typescript
`${p.demandeur.nom ?? ''} ${p.demandeur.prenom ?? ''}`.trim()
```

Mais cela créera de la confusion car les champs ne correspondront plus à leur nom!

## Recommandation

**Corrigez la base de données** pour que:
- `prenom` contienne le prénom (Doudou, Marié)
- `nom` contienne le nom de famille (Fall, Ousmane)

C'est la solution la plus propre et la plus maintenable.

## Étapes

1. **Sauvegarde de la base**
   ```bash
   pg_dump -U postgres uasz_maintenance > backup.sql
   ```

2. **Vérifier les valeurs**
   ```bash
   psql -U postgres -d uasz_maintenance -f verifier-ordre-prenom-nom.sql
   ```

3. **Corriger les valeurs**
   ```bash
   psql -U postgres -d uasz_maintenance -f corriger-ordre-prenom-nom.sql
   ```

4. **Redémarrer le backend**
   ```bash
   mvn spring-boot:run
   ```

5. **Rafraîchir le frontend**
   ```
   Ctrl+Shift+R dans le navigateur
   ```

## Fichiers créés

- `verifier-ordre-prenom-nom.sql` - Vérification
- `corriger-ordre-prenom-nom.sql` - Correction
