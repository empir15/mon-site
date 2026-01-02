const db = require('../config/db');

// Récupérer toutes les salles
exports.getAllSalles = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM salle');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la récupération des salles', error: err });
  }
};

// Créer une nouvelle salle
exports.createSalle = async (req, res) => {
  const { nom, capacite, equipements } = req.body;
  if (!nom || !capacite) {
    return res.status(400).json({ message: 'Le nom et la capacité sont requis' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO salle (nom, capacite, equipements) VALUES (?, ?, ?)',
      [nom, capacite, equipements]
    );
    res.status(201).json({ id: result.insertId, nom, capacite, equipements });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la création de la salle', error: err });
  }
};

// Modifier une salle
exports.updateSalle = async (req, res) => {
  const { id } = req.params;
  const { nom, capacite, equipements } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE salle SET nom = ?, capacite = ?, equipements = ? WHERE id = ?',
      [nom, capacite, equipements, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    res.json({ message: 'Salle mise à jour avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la mise à jour de la salle', error: err });
  }
};

// Supprimer une salle
exports.deleteSalle = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM salle WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Salle non trouvée' });
    }
    res.json({ message: 'Salle supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ message: 'Erreur lors de la suppression de la salle', error: err });
  }
};
