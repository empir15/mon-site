const db = require('../config/db');

// Utilitaires de détection de conflits
const checkConflicts = async (date, heure_debut, heure_fin, salle_id, enseignant_id, groupe, excludeSeanceId = null) => {
    let query = `
    SELECT * FROM seance 
    WHERE date = ? 
    AND (
      (heure_debut < ? AND heure_fin > ?) -- Chevauchement temporel
    )
    AND (
      salle_id = ? 
      OR enseignant_id = ? 
      OR groupe = ?
    )
    AND statut != 'ANNULEE'
  `;

    const params = [date, heure_fin, heure_debut, salle_id, enseignant_id, groupe];

    if (excludeSeanceId) {
        query += ' AND id != ?';
        params.push(excludeSeanceId);
    }

    const [rows] = await db.query(query, params);
    return rows;
};

// Récupérer toutes les séances (avec filtres optionnels)
exports.getAllSeances = async (req, res) => {
    try {
        const { date, enseignant_id, salle_id, groupe } = req.query;
        let query = `
      SELECT s.*, u.nom as enseignant_nom, sa.nom as salle_nom 
      FROM seance s
      JOIN enseignant e ON s.enseignant_id = e.id
      JOIN utilisateur u ON e.utilisateur_id = u.id
      JOIN salle sa ON s.salle_id = sa.id
    `;
        const params = [];
        const conditions = [];

        if (date) { conditions.push('s.date = ?'); params.push(date); }
        if (enseignant_id) { conditions.push('s.enseignant_id = ?'); params.push(enseignant_id); }
        if (salle_id) { conditions.push('s.salle_id = ?'); params.push(salle_id); }
        if (groupe) { conditions.push('s.groupe = ?'); params.push(groupe); }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY s.date, s.heure_debut';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la récupération des séances', error: err });
    }
};

// Créer une séance
exports.createSeance = async (req, res) => {
    const { type, date, heure_debut, heure_fin, enseignant_id, salle_id, groupe, commentaire } = req.body;

    try {
        // Vérification des conflits
        const conflicts = await checkConflicts(date, heure_debut, heure_fin, salle_id, enseignant_id, groupe);

        if (conflicts.length > 0) {
            const conflictMsg = [];
            conflicts.forEach(c => {
                if (c.salle_id == salle_id) conflictMsg.push('La salle est déjà occupée.');
                if (c.enseignant_id == enseignant_id) conflictMsg.push("L'enseignant a déjà un cours.");
                if (c.groupe == groupe) conflictMsg.push("Le groupe a déjà un cours.");
            });
            return res.status(409).json({ message: 'Conflit détecté', details: conflictMsg });
        }

        const [result] = await db.query(
            'INSERT INTO seance (type, date, heure_debut, heure_fin, enseignant_id, salle_id, groupe, commentaire) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [type, date, heure_debut, heure_fin, enseignant_id, salle_id, groupe, commentaire]
        );
        res.status(201).json({ message: 'Séance créée avec succès', id: result.insertId });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la création de la séance', error: err });
    }
};

// Mettre à jour une séance
exports.updateSeance = async (req, res) => {
    const { id } = req.params;
    const { type, date, heure_debut, heure_fin, enseignant_id, salle_id, groupe, commentaire, statut } = req.body;

    try {
        // Vérifier si la séance existe
        const [existing] = await db.query('SELECT * FROM seance WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ message: 'Séance non trouvée' });

        // Si on modifie les horaires ou lieux, vérifier les conflits
        if (date || heure_debut || heure_fin || salle_id || enseignant_id || groupe) {
            const checkDate = date || existing[0].date;
            const checkStart = heure_debut || existing[0].heure_debut;
            const checkEnd = heure_fin || existing[0].heure_fin;
            const checkSalle = salle_id || existing[0].salle_id;
            const checkProf = enseignant_id || existing[0].enseignant_id;
            const checkGroupe = groupe || existing[0].groupe;

            const conflicts = await checkConflicts(checkDate, checkStart, checkEnd, checkSalle, checkProf, checkGroupe, id);
            if (conflicts.length > 0) {
                return res.status(409).json({ message: 'Conflit détecté lors de la modification', conflicts });
            }
        }

        // Mise à jour simplifiée (reçoit tous les champs ou utilise l'existant serait mieux, mais ici on update ce qui est envoyé)
        // Pour faire simple, on construit la requête dynamiquement ou on suppose que tout est envoyé. 
        // Faisons une update de champs spécifiques pour simplifier si tout n'est pas fourni.

        const fields = [];
        const values = [];
        if (type) { fields.push('type = ?'); values.push(type); }
        if (date) { fields.push('date = ?'); values.push(date); }
        if (heure_debut) { fields.push('heure_debut = ?'); values.push(heure_debut); }
        if (heure_fin) { fields.push('heure_fin = ?'); values.push(heure_fin); }
        if (enseignant_id) { fields.push('enseignant_id = ?'); values.push(enseignant_id); }
        if (salle_id) { fields.push('salle_id = ?'); values.push(salle_id); }
        if (groupe) { fields.push('groupe = ?'); values.push(groupe); }
        if (commentaire !== undefined) { fields.push('commentaire = ?'); values.push(commentaire); }
        if (statut) { fields.push('statut = ?'); values.push(statut); }

        if (fields.length === 0) return res.json({ message: 'Aucune modification envoyée' });

        values.push(id);
        await db.query(`UPDATE seance SET ${fields.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Séance mise à jour' });

    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la modification', error: err });
    }
};

// Supprimer une séance
exports.deleteSeance = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM seance WHERE id = ?', [id]);
        res.json({ message: 'Séance supprimée' });
    } catch (err) {
        res.status(500).json({ message: 'Erreur lors de la suppression', error: err });
    }
};
