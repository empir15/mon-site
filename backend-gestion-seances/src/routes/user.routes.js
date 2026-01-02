const express = require('express');
const router = express.Router();
const controller = require('../controllers/user.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Toutes les routes nécessitent authentification
router.get('/', verifyToken, checkRole('CHEF_DEPARTEMENT'), controller.getAllUsers);
router.post('/', verifyToken, checkRole('CHEF_DEPARTEMENT'), controller.createUser);
router.delete('/:id', verifyToken, checkRole('CHEF_DEPARTEMENT'), controller.deleteUser);

module.exports = router;
