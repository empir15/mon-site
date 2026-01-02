const db = require('../config/db');
const bcrypt = require('bcrypt');

// Récupérer tous les utilisateurs (pour admin)
exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, nom, email, role, created_at FROM utilisateur');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
};

// Créer un utilisateur (Enseignant, Secrétaire, etc.)
exports.createUser = async (req, res) => {
    const { nom, email, motDePasse, role, grade, specialite } = req.body;

    try {
        // Vérifier si email existe déjà
        const [existing] = await db.query('SELECT * FROM utilisateur WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ message: 'Cet email est déjà utilisé.' });

        const hashedPassword = await bcrypt.hash(motDePasse, 10);

        const connection = await db.getConnection();
        await connection.beginTransaction();

        try {
            const [result] = await connection.query(
                'INSERT INTO utilisateur (nom, email, mot_de_passe, role) VALUES (?, ?, ?, ?)',
                [nom, email, hashedPassword, role]
            );
            const userId = result.insertId;

            // Si c'est un enseignant, ajouter dans la table enseignant
            if (role === 'ENSEIGNANT') {
                await connection.query(
                    'INSERT INTO enseignant (utilisateur_id, grade, specialite) VALUES (?, ?, ?)',
                    [userId, grade, specialite]
                );
            }

            await connection.commit();
            res.status(201).json({ message: 'Utilisateur créé avec succès', id: userId });
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la création', error: err });
    }
};

// Supprimer un utilisateur
exports.deleteUser = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM utilisateur WHERE id = ?', [id]);
        res.json({ message: 'Utilisateur supprimé' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur serveur', error: err });
    }
};
