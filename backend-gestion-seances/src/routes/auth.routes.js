const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');

router.post('/login', (req, res, next) => {
    console.log('📥 POST /api/auth/login', req.body);
    next();
}, controller.login);

// ➕ NOUVELLE ROUTE
router.post('/register', controller.register);

module.exports = router;
