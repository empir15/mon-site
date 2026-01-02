const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration CORS pour accepter les requêtes depuis file://
app.use(cors({
    origin: '*', // Accepter toutes les origines (y compris file://)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Route de test pour la racine
app.get('/', (req, res) => {
    res.json({
        statut: 'Succès ✅',
        message: 'Le serveur Backend SeancePlus est EN LIGNE ! 🚀',
        instructions: 'Utilisez le frontend sur http://localhost:8080 pour vous connecter.'
    });
});

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/users', require('./routes/user.routes'));
app.use('/api/salles', require('./routes/salle.routes'));
app.use('/api/seances', require('./routes/seance.routes'));

module.exports = app;
