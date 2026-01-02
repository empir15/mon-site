const express = require('express');
const router = express.Router();
const controller = require('../controllers/seance.controller');
const { verifyToken, checkRole } = require('../middlewares/auth.middleware');

// Consultation accessible à tous les utilisateurs authentifiés
router.get('/', verifyToken, controller.getAllSeances);
// Création/modification réservée au Chef et Secrétaire
router.post('/', verifyToken, checkRole('CHEF_DEPARTEMENT', 'SECRETAIRE'), controller.createSeance);
router.put('/:id', verifyToken, controller.updateSeance); // Enseignants peuvent marquer comme effectuée
router.delete('/:id', verifyToken, checkRole('CHEF_DEPARTEMENT', 'SECRETAIRE'), controller.deleteSeance);

module.exports = router;
