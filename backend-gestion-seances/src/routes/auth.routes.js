const express = require('express');
const router = express.Router();

const controller = require('../controllers/auth.controller');

// Log pour debug
router.post('/login', (req, res, next) => {
    console.log('📥 Reçu POST /api/auth/login - Body:', req.body);
    next();
}, controller.login);

module.exports = router;