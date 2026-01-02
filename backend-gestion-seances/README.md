# Backend - Gestion des Séances

API REST pour le système de gestion des séances du Département d'Informatique.

## 🚀 Démarrage rapide

### Prérequis
- Node.js (v14+)
- MySQL (v8+)

### Installation

1. **Installer les dépendances**
```bash
npm install
```

2. **Configurer la base de données**

Créer la base de données et les tables :
```bash
mysql -u root -p < database.sql
```

Charger les données initiales (optionnel) :
```bash
mysql -u root -p < seed.sql
```

3. **Configuration**

Modifier le fichier `.env` selon votre configuration MySQL :
```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gestion_seances_db
JWT_SECRET=changez_moi_en_production
```

4. **Démarrer le serveur**

Mode développement (avec auto-reload) :
```bash
npm run dev
```

Mode production :
```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`

## 📋 Comptes par défaut (seed.sql)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Chef de Département | chef@dept-info.cm | admin123 |
| Secrétaire | secretaire@dept-info.cm | secretaire123 |
| Enseignant | j.kamga@dept-info.cm | prof123 |

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/login` - Connexion (retourne JWT)

### Utilisateurs (Chef uniquement)
- `GET /api/users` - Liste des utilisateurs
- `POST /api/users` - Créer un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur

### Salles (Chef, Secrétaire)
- `GET /api/salles` - Liste des salles
- `POST /api/salles` - Créer une salle
- `PUT /api/salles/:id` - Modifier une salle
- `DELETE /api/salles/:id` - Supprimer une salle

### Séances
- `GET /api/seances` - Liste des séances (avec filtres: date, enseignant_id, salle_id, groupe)
- `POST /api/seances` - Créer une séance (Chef, Secrétaire) - détecte les conflits
- `PUT /api/seances/:id` - Modifier une séance
- `DELETE /api/seances/:id` - Supprimer une séance (Chef, Secrétaire)

## 🛡️ Authentification

Toutes les routes (sauf `/api/auth/login`) nécessitent un token JWT.

Ajouter le header :
```
Authorization: Bearer <votre_token>
```

## 🏗️ Structure du projet

```
backend-gestion-seances/
├── src/
│   ├── config/
│   │   └── db.js              # Configuration MySQL
│   ├── controllers/
│   │   ├── auth.controller.js # Login
│   │   ├── user.controller.js # Gestion utilisateurs
│   │   ├── salle.controller.js # Gestion salles
│   │   └── seance.controller.js # Gestion séances
│   ├── middlewares/
│   │   └── auth.middleware.js # Vérification JWT
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── salle.routes.js
│   │   └── seance.routes.js
│   └── app.js                 # Configuration Express
├── server.js                  # Point d'entrée
├── database.sql               # Schéma de la BDD
├── seed.sql                   # Données initiales
├── .env                       # Configuration
└── package.json
```

## ✅ Fonctionnalités implémentées

- ✅ Authentification JWT
- ✅ Gestion des rôles (Chef, Enseignant, Secrétaire)
- ✅ CRUD Utilisateurs
- ✅ CRUD Salles
- ✅ CRUD Séances
- ✅ Détection des conflits (salle, enseignant, groupe)
- ✅ Filtrage des séances par critères

## 📝 Notes techniques

- **Hachage des mots de passe** : bcrypt (10 rounds)
- **Tokens JWT** : expire après 8h
- **Détection de conflits** : vérifie chevauchement temporel pour salle/enseignant/groupe
