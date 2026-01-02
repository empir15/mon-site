const express = require('express');
const router = express.Router();
const controller = require('../controllers/salle.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Lecture accessible à tous les utilisateurs authentifiés
router.get('/', verifyToken, controller.getAllSalles);
// Modification réservée au Chef et Secrétaire
router.post('/', verifyToken, checkRole('CHEF_DEPARTEMENT', 'SECRETAIRE'), controller.createSalle);
router.put('/:id', verifyToken, checkRole('CHEF_DEPARTEMENT', 'SECRETAIRE'), controller.updateSalle);
router.delete('/:id', verifyToken, checkRole('CHEF_DEPARTEMENT'), controller.deleteSalle);

module.exports = router;
