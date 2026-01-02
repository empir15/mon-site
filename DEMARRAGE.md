# 🚀 Guide de Démarrage Rapide

## Prérequis
✅ Node.js installé  
✅ MySQL installé et démarré  

---

## 📦 Installation (une seule fois)

### 1. Backend
```bash
cd backend-gestion-seances
npm install
```

### 2. Frontend
```bash
cd fontend-gestion-seances
npm install
```

### 3. Base de données MySQL

Ouvrez MySQL (Workbench ou ligne de commande) :

```sql
CREATE DATABASE IF NOT EXISTS gestion_seances_db;
USE gestion_seances_db;
```

Puis importez les scripts :
```bash
# Dans le terminal (backend-gestion-seances)
mysql -u root -p gestion_seances_db < database.sql
mysql -u root -p gestion_seances_db < seed.sql
```

---

## 🎬 Démarrage

### Terminal 1 : Backend (Port 3000)
```bash
cd backend-gestion-seances
npm start
```

Vous devriez voir :
```
✅ Connexion MySQL réussie
✅ Serveur lancé sur http://localhost:3000
```

### Terminal 2 : Frontend (Port 8080)
```bash
cd fontend-gestion-seances
npm run dev
```

Le navigateur s'ouvrira automatiquement sur `http://localhost:8080`

---

## 🔐 Comptes de Test

Après avoir importé `seed.sql`, vous pouvez vous connecter avec :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Chef de Département** | chef@dept-info.cm | admin123 |
| **Enseignant** | j.kamga@dept-info.cm | prof123 |
| **Secrétaire** | secretaire@dept-info.cm | secretaire123 |

---

## 🧪 Test de Connexion

1. Ouvrez `http://localhost:8080`
2. Cliquez sur "Se connecter"
3. Utilisez `chef@dept-info.cm` / `admin123`
4. Vous devriez être redirigé vers le dashboard

---

## ❌ En cas de problème

### Le backend ne démarre pas
- Vérifiez que MySQL est démarré
- Vérifiez les identifiants dans `backend-gestion-seances/.env`
- La base `gestion_seances_db` doit exister

### Erreur de connexion (Login)
- Vérifiez que `seed.sql` a bien été importé
- Ouvrez `http://localhost:8080/test-api.html` pour diagnostiquer

### Erreur CORS
- Assurez-vous d'accéder via `http://localhost:8080` et PAS `file://`
- Redémarrez le backend après modification du CORS

---

## 📂 Structure des URLs

- **Frontend** : http://localhost:8080
- **Backend API** : http://localhost:3000/api
- **Test API** : http://localhost:8080/test-api.html

---

## 🛑 Arrêter les serveurs

Dans chaque terminal, appuyez sur `Ctrl + C`
