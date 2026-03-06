# 🚀 Guide de démarrage avec IntelliJ IDEA

## ✅ Backend et Frontend arrêtés avec succès!

Les processus en ligne de commande ont été stoppés. Vous pouvez maintenant les lancer depuis IntelliJ IDEA.

---

## 🔧 Démarrer le Backend depuis IntelliJ

### Méthode 1: Via la classe principale (Recommandée)

1. **Ouvrez le fichier:**
   ```
   src/main/java/sn/uasz/uasz_maintenance_backend/UaszMaintenanceBackendApplication.java
   ```

2. **Lancez l'application:**
   - Cliquez sur le bouton ▶️ vert à côté de `public static void main`
   - Ou faites un clic droit sur la classe → `Run 'UaszMaintenanceBackendApplication'`
   - Ou utilisez le raccourci: `Shift + F10`

3. **Vérifiez le démarrage:**
   - La console IntelliJ affichera les logs Spring Boot
   - Attendez le message: `Started UaszMaintenanceBackendApplication in X seconds`
   - Le backend sera accessible sur: http://localhost:8080

### Méthode 2: Via Maven

1. **Ouvrez l'onglet Maven** (à droite de l'IDE)

2. **Naviguez vers:**
   ```
   uasz-maintenance-backend
   └── Plugins
       └── spring-boot
           └── spring-boot:run
   ```

3. **Double-cliquez** sur `spring-boot:run`

### Méthode 3: Via le Terminal IntelliJ

1. **Ouvrez le terminal:** `Alt + F12`

2. **Exécutez:**
   ```bash
   mvn spring-boot:run
   ```

---

## 🎨 Démarrer le Frontend depuis IntelliJ

### Méthode 1: Via le Terminal IntelliJ (Recommandée)

1. **Ouvrez un nouveau terminal:** `Alt + F12`

2. **Naviguez vers le dossier frontend:**
   ```bash
   cd uasz-maintenance-frontend
   ```

3. **Démarrez le serveur de développement:**
   ```bash
   npm start
   ```

4. **Vérifiez le démarrage:**
   - Attendez le message: `✔ Compiled successfully`
   - Le frontend sera accessible sur: http://localhost:4200

### Méthode 2: Via une configuration npm

1. **Créez une configuration npm:**
   - Cliquez sur `Run` → `Edit Configurations...`
   - Cliquez sur `+` → `npm`
   - Configurez:
     - **Name:** `Frontend Angular`
     - **Package.json:** Sélectionnez `uasz-maintenance-frontend/package.json`
     - **Command:** `run`
     - **Scripts:** `start`

2. **Lancez la configuration:**
   - Sélectionnez `Frontend Angular` dans la liste déroulante en haut
   - Cliquez sur ▶️ Run

---

## 📋 Ordre de démarrage recommandé

1. **D'abord le Backend** (port 8080)
   - Attendez qu'il soit complètement démarré
   - Vérifiez les logs: "Started UaszMaintenanceBackendApplication"

2. **Ensuite le Frontend** (port 4200)
   - Il se connectera automatiquement au backend
   - Ouvrez http://localhost:4200 dans votre navigateur

---

## 🔐 Identifiants de connexion

```
Username: admin
Password: admin123
Role: ADMINISTRATEUR
```

**Autres comptes disponibles:**
- `responsable` / `resp123` (RESPONSABLE_MAINTENANCE)
- `technicien` / `tech123` (TECHNICIEN)
- `demandeur` / `dem123` (DEMANDEUR)
- `superviseur` / `super123` (SUPERVISEUR)

---

## 🛠️ Raccourcis IntelliJ utiles

| Raccourci | Action |
|-----------|--------|
| `Shift + F10` | Run (Démarrer) |
| `Shift + F9` | Debug (Déboguer) |
| `Ctrl + F2` | Stop (Arrêter) |
| `Alt + F12` | Terminal |
| `Alt + 1` | Project Explorer |
| `Double Shift` | Recherche globale |
| `Ctrl + Shift + O` | Recharger Maven |
| `Ctrl + F9` | Build Project |

---

## 🐛 Débogage

### Backend
1. Placez des breakpoints dans votre code (clic gauche dans la marge)
2. Lancez en mode Debug: `Shift + F9`
3. L'exécution s'arrêtera aux breakpoints

### Frontend
1. Utilisez les DevTools du navigateur: `F12`
2. Onglet Console pour les logs
3. Onglet Network pour les requêtes HTTP

---

## 📊 Monitoring

### Backend
- **Logs:** Console IntelliJ
- **API Docs:** http://localhost:8080/swagger-ui.html
- **Health Check:** http://localhost:8080/api/debug/users

### Frontend
- **Console:** DevTools du navigateur (F12)
- **Network:** Onglet Network des DevTools
- **Angular DevTools:** Extension Chrome/Firefox

---

## ⚠️ Problèmes courants

### Port déjà utilisé (Backend)
```
Error: Port 8080 is already in use
```
**Solution:** Arrêtez l'ancien processus ou changez le port dans `application.properties`

### Port déjà utilisé (Frontend)
```
Error: Port 4200 is already in use
```
**Solution:** 
```bash
# Windows
netstat -ano | findstr :4200
taskkill /PID <PID> /F
```

### Dépendances Maven manquantes
**Solution:** 
- Clic droit sur `pom.xml` → `Maven` → `Reload Project`
- Ou: `Ctrl + Shift + O`

### Modules npm manquants
**Solution:**
```bash
cd uasz-maintenance-frontend
npm install
```

---

## 📝 Notes importantes

- **Ne fermez pas IntelliJ** pendant que les applications tournent
- **Les logs** s'affichent dans la console IntelliJ
- **Hot Reload:** Les modifications Java nécessitent un redémarrage, mais Angular recharge automatiquement
- **Base de données:** PostgreSQL doit être démarré (port 5432)

---

## 🎯 Prochaines étapes

1. ✅ Backend et Frontend arrêtés
2. 🔄 Lancez le Backend depuis IntelliJ
3. 🔄 Lancez le Frontend depuis IntelliJ
4. 🌐 Ouvrez http://localhost:4200
5. 🔐 Connectez-vous avec admin/admin123

Bon développement! 🚀
