const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = (req, res) => {
  const { email, motDePasse } = req.body;

  db.query(
    'SELECT * FROM utilisateur WHERE email = ?',
    [email],
    async (err, results) => {
      if (err || results.length === 0)
        return res.status(401).json({ message: 'Utilisateur non trouvé' });

      const user = results[0];
      const match = await bcrypt.compare(motDePasse, user.mot_de_passe);

      if (!match)
        return res.status(401).json({ message: 'Mot de passe incorrect' });

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '8h' }
      );

      res.json({ token, role: user.role });
    }
  );
};
