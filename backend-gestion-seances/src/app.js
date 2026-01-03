const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration CORS pour accepter les requêtes depuis file://
app.use(cors({
    origin: ['http://127.0.0.1:8080', 'http://localhost:8080', '*'],  // Ajoute ton port frontend
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Gère les préflights OPTIONS pour éviter 405
app.options('*', cors());

// Middleware
app.use(express.json());

// Route de test pour la racine
app.get('/', (req, res) => {
    res.json({
        statut: 'Succès ✅',
        message: 'Le serveur Backend SeancePlus est EN LIGNE ! 🚀',
        instructions: 'Utilisez le frontend sur http://localhost:8080 pour vous connecter.'
    });
});

// Montage des routes avec logs pour debug
try {
    app.use('/api/auth', require('./routes/auth.routes'));
    console.log('✅ Route /api/auth montée avec succès');
} catch (err) {
    console.error('❌ Erreur montage /api/auth:', err.message);
}

try {
    app.use('/api/users', require('./routes/user.routes'));
    console.log('✅ Route /api/users montée avec succès');
} catch (err) {
    console.error('❌ Erreur montage /api/users:', err.message);
}

try {
    app.use('/api/salles', require('./routes/salle.routes'));
    console.log('✅ Route /api/salles montée avec succès');
} catch (err) {
    console.error('❌ Erreur montage /api/salles:', err.message);
}

try {
    app.use('/api/seances', require('./routes/seance.routes'));
    console.log('✅ Route /api/seances montée avec succès');
} catch (err) {
    console.error('❌ Erreur montage /api/seances:', err.message);
}

// Route de test pour login (temporaire, enlève après)
app.post('/api/auth/login-test', (req, res) => {
    console.log('🧪 Test POST /api/auth/login-test reçu:', req.body);
    res.json({ message: 'Login test OK !', body: req.body });
});

module.exports = app;
