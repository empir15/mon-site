const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  const { email, motDePasse } = req.body;
  console.log('🔐 Tentative login pour email:', email);  // Log pour debug

  if (!email || !motDePasse) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  try {
    const [results] = await db.query('SELECT * FROM utilisateur WHERE email = ?', [email]);

    if (results.length === 0) {
      console.log('❌ User non trouvé:', email);
      return res.status(401).json({ message: 'Utilisateur non trouvé' });
    }

    const user = results[0];
    const match = await bcrypt.compare(motDePasse, user.mot_de_passe);

    if (!match) {
      console.log('❌ Mot de passe incorrect pour:', email);
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    const secret = process.env.JWT_SECRET || 'super_secret_default_2026';  // Fallback
    const token = jwt.sign(
      { id: user.id, role: user.role },
      secret,
      { expiresIn: '8h' }
    );

    console.log('✅ Login réussi pour:', email, 'Rôle:', user.role);

    // Renvoie token + user data (frontend l'attend)
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nom: user.nom  // Ajoute nom si dispo
      }
    });
  } catch (err) {
    console.error('❌ Erreur login:', err);
    res.status(500).json({ message: 'Erreur serveur lors du login' });
  }
};
